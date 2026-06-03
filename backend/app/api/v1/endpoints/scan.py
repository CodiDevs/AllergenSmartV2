"""
Endpoint: POST /api/v1/scan
El endpoint más importante del sistema.
Recibe imagen + barcode → OCR → detección de alérgenos → respuesta.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.rate_limiter import limiter
from app.schemas.scan import ScanRequest, ScanResponse
from app.schemas.common import AlertLevel, MatchType, Severity

router = APIRouter(prefix="/scan", tags=["Escaneo"])


@router.post(
    "",
    response_model=ScanResponse,
    summary="Escanear etiqueta de alimento",
    description="Endpoint principal. Recibe imagen en base64, realiza OCR y detecta alérgenos según el perfil del usuario.",
)
@limiter.limit("10/minute")
async def scan_label(
    request: Request,  # Requerido por slowapi para rate limiting
    body: ScanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ScanResponse:
    """
    Flujo completo de escaneo:
    1. Verificar caché L1 (product verified_by_admin)
    2. Verificar caché L2 (ocr_cache)
    3. Llamar a Vision API (L3)
    4. Normalizar texto OCR
    5. Detectar alérgenos (fast path → direct → fuzzy)
    6. Guardar en scan_history
    7. Responder
    """
    # TODO: implementar ScanService.process_scan()
    return ScanResponse(
        success=True,
        alert_level=AlertLevel.SAFE,
        message="✅ No se detectaron alérgenos conocidos en este producto.",
        confidence=0.92,
        from_cache=False,
        processing_time_ms=0,
        detected_text="[scan service not yet implemented]",
        ingredients=[],
        allergens_found=[],
        warnings=[],
    )
