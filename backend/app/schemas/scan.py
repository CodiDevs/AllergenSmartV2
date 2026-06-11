"""
Schemas Pydantic para el endpoint de escaneo.
ScanRequest: lo que llega del frontend.
ScanResponse: lo que el frontend recibe.
"""
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.common import AlertLevel, MatchType, Severity, ScanSource


class ScanRequest(BaseModel):
    """Request del frontend para escanear una etiqueta."""
    image_base64: str = Field(
        ...,
        min_length=100,
        # 10 MB de imagen ≈ 13.4 MB en base64; 14_000_000 deja margen para el prefijo data URI.
        # Cota el tamaño del body ANTES de decodificar (evita cargar payloads gigantes en memoria).
        max_length=14_000_000,
        description="Imagen de la etiqueta codificada en base64 (con o sin data URI prefix)",
    )
    barcode: Optional[str] = Field(
        None,
        description="Código de barras (opcional, si se escaneó por separado)",
    )
    scan_source: ScanSource = Field(
        ScanSource.CAMERA,
        description="Fuente del escaneo: camera | barcode_only | manual",
    )
    app_version: Optional[str] = Field(
        None,
        description="Versión de la app móvil (para analytics)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJR...",
                "barcode": "7861000123456",
                "scan_source": "camera",
                "app_version": "2.0.0",
            }]
        }
    }


class AllergenMatch(BaseModel):
    """Alérgeno detectado en el producto."""
    name: str = Field(..., description="Nombre del alérgeno detectado")
    match_type: MatchType = Field(..., description="Tipo de coincidencia")
    source_ingredient: str = Field(..., description="Ingrediente fuente de la detección")
    severity: Severity = Field(Severity.HIGH, description="Severidad de la alergia del usuario")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confianza del matching (0-1)")


class ProductBrief(BaseModel):
    """Información básica del producto en la respuesta."""
    barcode: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None


class ScanResponse(BaseModel):
    """Respuesta completa del escaneo al frontend."""
    success: bool
    alert_level: AlertLevel
    message: str
    confidence: float = Field(ge=0.0, le=1.0)
    from_cache: bool = False
    processing_time_ms: Optional[int] = None
    product: Optional[ProductBrief] = None
    detected_text: str = ""
    ingredients: list[str] = []
    allergens_found: list[AllergenMatch] = []
    warnings: list[str] = []  # "puede contener trazas de..."
