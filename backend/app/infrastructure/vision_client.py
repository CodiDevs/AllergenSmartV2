"""
Cliente Google Cloud Vision API (TEXT_DETECTION).

- Si GOOGLE_CLOUD_API_KEY está configurada → llamada REAL vía httpx.
- Si está vacía → MOCK (texto de ejemplo) para desarrollo sin key.

SEGURIDAD (SECURITY_GUIDELINES — OCR Security): antes de enviar la imagen a un
tercero se valida tipo (firma), MIME permitido y tamaño (≤10MB). Los errores de
la API se traducen a VisionAPIException genérica (no se filtra la respuesta de Google).
"""
import base64
import binascii
import logging

import httpx

from app.config import settings
from app.core.exceptions import (
    InvalidImageException,
    OCRNoTextException,
    VisionAPIException,
)
from app.infrastructure.storage_client import MAX_FILE_BYTES, validate_image

logger = logging.getLogger("allergensmart.vision")

_VISION_URL = "https://vision.googleapis.com/v1/images:annotate"
_TIMEOUT = httpx.Timeout(20.0)

# Firmas → MIME, para inferir el tipo de una imagen base64 sin content-type.
_SIGNATURES: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"RIFF", "image/webp"),  # 'WEBP' en offset 8
]


def _strip_data_uri(image_base64: str) -> str:
    """Quita el prefijo 'data:image/...;base64,' si viene del frontend."""
    if image_base64.startswith("data:"):
        _, _, payload = image_base64.partition(",")
        return payload
    return image_base64


def _decode_and_validate(image_base64: str) -> bytes:
    """Decodifica base64 y valida firma, MIME y tamaño. Lanza si no pasa."""
    raw = _strip_data_uri(image_base64)
    try:
        image_bytes = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise InvalidImageException(reason="base64 inválido")

    if len(image_bytes) > MAX_FILE_BYTES:
        raise InvalidImageException(reason="imagen mayor a 10 MB")

    content_type = next(
        (mime for sig, mime in _SIGNATURES if image_bytes.startswith(sig)),
        None,
    )
    if content_type is None:
        raise InvalidImageException(reason="formato no soportado")

    # Reusa la validación central (MIME permitido + tamaño + firma)
    validate_image(image_bytes, content_type)
    return image_bytes


def _derive_confidence(full_text_annotation: dict) -> float:
    """Promedia la confianza de los bloques detectados. Fallback 0.9."""
    confidences: list[float] = []
    for page in full_text_annotation.get("pages", []):
        for block in page.get("blocks", []):
            if "confidence" in block:
                confidences.append(float(block["confidence"]))
    if confidences:
        return round(sum(confidences) / len(confidences), 3)
    return 0.9


class VisionClient:
    """Cliente para Google Cloud Vision API (TEXT_DETECTION)."""

    async def extract_text(self, image_base64: str) -> dict:
        """
        Extrae texto de una etiqueta. Retorna dict con 'text' y 'confidence'.

        Raises:
            InvalidImageException: imagen mal formada / tipo o tamaño inválido.
            VisionAPIException:     fallo al llamar a Vision API.
            OCRNoTextException:     la imagen no contenía texto.
        """
        if not settings.google_cloud_api_key:
            logger.info("GOOGLE_CLOUD_API_KEY ausente → usando MOCK de Vision")
            return self._mock_response()

        # Validación de seguridad antes de salir a un tercero
        image_bytes = _decode_and_validate(image_base64)
        content_b64 = base64.b64encode(image_bytes).decode("ascii")

        payload = {
            "requests": [
                {
                    "image": {"content": content_b64},
                    "features": [{"type": "TEXT_DETECTION"}],
                    "imageContext": {"languageHints": ["es"]},
                }
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.post(
                    _VISION_URL,
                    params={"key": settings.google_cloud_api_key},
                    json=payload,
                )
        except httpx.HTTPError:
            logger.warning("Error de red llamando a Vision API", exc_info=True)
            raise VisionAPIException()

        if resp.status_code != 200:
            # No se expone el cuerpo de la respuesta de Google
            logger.warning("Vision API status=%s", resp.status_code)
            raise VisionAPIException()

        data = resp.json()
        response = (data.get("responses") or [{}])[0]

        if response.get("error"):
            logger.warning("Vision API devolvió error en el payload")
            raise VisionAPIException()

        full = response.get("fullTextAnnotation")
        if not full or not full.get("text"):
            raise OCRNoTextException()

        return {
            "text": full["text"],
            "confidence": _derive_confidence(full),
            "raw_response": None,
        }

    def _mock_response(self) -> dict:
        """Respuesta simulada para desarrollo sin Vision API."""
        return {
            "text": "ingredientes: harina de trigo, azúcar, aceite vegetal, leche en polvo, sal, lecitina de soya. puede contener trazas de maní.",
            "confidence": 0.92,
            "raw_response": None,
        }


# Instancia singleton
vision_client = VisionClient()
