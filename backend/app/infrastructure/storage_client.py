"""
Cliente Supabase Storage — sube fotos de reportes y etiquetas.

Estado: sube de verdad si SUPABASE_SERVICE_ROLE_KEY está configurado y el bucket
existe. Mientras tanto (sin credenciales/bucket) retorna None y el reporte se
guarda sin foto. Valida MIME, tamaño y firma de archivo (SECURITY_GUIDELINES).
"""
import uuid
from typing import Optional

from app.config import settings

# --- Restricciones de archivo (SECURITY_GUIDELINES: OCR Security) ---
ALLOWED_MIME = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

# Firmas (magic numbers) por tipo — validación de contenido real
_SIGNATURES: dict[str, bytes] = {
    "image/jpeg": b"\xff\xd8",
    "image/jpg": b"\xff\xd8",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/webp": b"RIFF",  # seguido de 'WEBP' en offset 8
}


class InvalidUploadError(ValueError):
    """El archivo subido no cumple las restricciones de seguridad."""


def _ext_for(content_type: str) -> str:
    return {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }.get(content_type, "bin")


def validate_image(image_bytes: bytes, content_type: str) -> None:
    """Valida tamaño, MIME y firma. Lanza InvalidUploadError si no pasa."""
    if content_type not in ALLOWED_MIME:
        raise InvalidUploadError(f"Tipo no permitido: {content_type}")
    if not image_bytes:
        raise InvalidUploadError("Archivo vacío")
    if len(image_bytes) > MAX_FILE_BYTES:
        raise InvalidUploadError("La imagen excede 10 MB")
    signature = _SIGNATURES.get(content_type, b"")
    if signature and not image_bytes.startswith(signature):
        raise InvalidUploadError("La firma del archivo no coincide con su tipo")


class StorageClient:
    """Cliente para Supabase Storage (buckets privados)."""

    LABEL_BUCKET = "product-labels"
    REPORT_BUCKET = "product-reports"

    def _client(self):
        """Cliente Supabase con service_role (acceso a Storage privado)."""
        if not settings.supabase_url or not settings.supabase_service_role_key:
            return None
        from supabase import create_client

        return create_client(settings.supabase_url, settings.supabase_service_role_key)

    def _upload(
        self, bucket: str, image_bytes: bytes, content_type: str
    ) -> Optional[str]:
        """Sube los bytes y retorna un path firmado, o None si no hay storage."""
        validate_image(image_bytes, content_type)
        client = self._client()
        if client is None:
            # Storage no configurado todavía → el reporte se guarda sin foto.
            return None

        filename = f"{uuid.uuid4()}.{_ext_for(content_type)}"
        client.storage.from_(bucket).upload(
            filename,
            image_bytes,
            {"content-type": content_type, "upsert": "false"},
        )
        # URL firmada (bucket privado) válida 1 año
        signed = client.storage.from_(bucket).create_signed_url(filename, 31536000)
        return signed.get("signedURL") or signed.get("signed_url")

    async def upload_report_photo(
        self, image_bytes: bytes, content_type: str = "image/jpeg"
    ) -> Optional[str]:
        """Sube una foto de reporte. Retorna URL firmada o None."""
        return self._upload(self.REPORT_BUCKET, image_bytes, content_type)

    async def upload_label_image(
        self, image_bytes: bytes, content_type: str = "image/jpeg"
    ) -> Optional[str]:
        """Sube una imagen de etiqueta. Retorna URL firmada o None."""
        return self._upload(self.LABEL_BUCKET, image_bytes, content_type)


storage_client = StorageClient()
