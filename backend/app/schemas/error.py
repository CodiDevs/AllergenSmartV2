"""
Schema de errores estandarizado — contrato obligatorio para todos los errores HTTP 400+.
El frontend usa error_code y action_required para mostrar la UI correcta.
"""
from typing import Optional
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """
    Formato obligatorio para todos los errores de la API.

    error_code:      String constante legible por máquina (para el frontend)
    message:         Mensaje en español para mostrar al usuario
    action_required: Qué debe hacer el frontend (RETAKE_PHOTO, REDIRECT_LOGIN, etc.)
    """
    error_code: str = Field(..., description="Código de error legible por máquina")
    message: str = Field(..., description="Mensaje en español para el usuario")
    action_required: Optional[str] = Field(
        None,
        description="Acción que el frontend debe ejecutar",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "error_code": "OCR_UNREADABLE",
                "message": "La imagen está demasiado borrosa. Intenta con mejor iluminación.",
                "action_required": "RETAKE_PHOTO",
            }]
        }
    }
