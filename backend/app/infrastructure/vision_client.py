"""
Cliente Google Cloud Vision API — MOCKEADO para el sprint actual.
Activa Vision API real cuando el usuario entregue la API key.
"""
from app.config import settings


class VisionClient:
    """
    Cliente para Google Cloud Vision API (TEXT_DETECTION).
    Estado actual: MOCK — retorna texto de ejemplo sin llamar a la API.
    """

    async def extract_text(self, image_base64: str) -> dict:
        """
        Envía imagen a Vision API y extorna el texto extraído.

        Args:
            image_base64: Imagen en base64 (con o sin data URI prefix)

        Returns:
            dict con 'text' (texto completo), 'confidence' (0.0-1.0)
        """
        if not settings.google_cloud_api_key:
            # MOCK: retorna texto simulado para desarrollo
            return self._mock_response()

        # TODO: implementar llamada real a Vision API cuando se active
        # https://cloud.google.com/vision/docs/reference/rest/v1/images/annotate
        return self._mock_response()

    def _mock_response(self) -> dict:
        """Respuesta simulada para desarrollo sin Vision API."""
        return {
            "text": "ingredientes: harina de trigo, azúcar, aceite vegetal, leche en polvo, sal, lecitina de soya. puede contener trazas de maní.",
            "confidence": 0.92,
            "raw_response": None,
        }


# Instancia singleton
vision_client = VisionClient()
