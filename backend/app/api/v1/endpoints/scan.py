"""
Endpoint: POST /api/v1/scan
El endpoint más importante del sistema.
Recibe imagen + barcode → OCR → detección de alérgenos → respuesta.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.rate_limiter import limiter
from app.schemas.scan import ScanRequest, ScanResponse
from app.services.scan_service import ScanService

router = APIRouter(prefix="/scan", tags=["Escaneo"])


@router.post(
    "",
    response_model=ScanResponse,
    summary="Escanear etiqueta de alimento",
    description="Endpoint principal. Recibe imagen en base64, realiza OCR y detecta alérgenos según el perfil del usuario.",
)
async def scan_label(
    request: Request,
    body: ScanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ScanResponse:
    """
    Flujo completo de escaneo:
    1. Cargar alergias del usuario (del JWT)
    2. Resolver ingredientes vía caché 3 niveles (L1 product / L2 ocr_cache / L3 Vision)
    3. Detectar alérgenos (fast path → directo → fuzzy + advertencias)
    4. Calcular nivel de alerta
    5. Guardar en scan_history
    6. Responder
    """
    return await ScanService(db).process_scan(UUID(current_user["user_id"]), body)
