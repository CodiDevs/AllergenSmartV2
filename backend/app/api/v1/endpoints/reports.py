"""
Endpoint: POST /api/v1/reports
Crowdsourcing — los usuarios reportan productos locales no catalogados.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.schemas.report import ReportResponse
from app.schemas.common import ReportStatus

router = APIRouter(prefix="/reports", tags=["Reportes"])


@router.post(
    "",
    response_model=ReportResponse,
    status_code=201,
    summary="Reportar producto nuevo",
    description="Permite a los usuarios reportar productos locales no catalogados (crowdsourcing).",
)
async def create_report(
    barcode: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ReportResponse:
    """Crea un reporte de producto para revisión del equipo."""
    # TODO: implementar ProductService.create_report() + StorageClient.upload_report_photo()
    return ReportResponse(
        id="placeholder-report-id",
        status=ReportStatus.PENDING,
        message="Gracias por tu reporte. Será revisado por nuestro equipo.",
    )
