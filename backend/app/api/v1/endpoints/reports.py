"""
Endpoint: POST /api/v1/reports
Crowdsourcing — los usuarios reportan productos locales no catalogados.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.infrastructure.storage_client import InvalidUploadError, storage_client
from app.schemas.report import ReportResponse
from app.services.product_service import ProductService

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
    photo_url: Optional[str] = None
    if photo is not None:
        try:
            content = await photo.read()
            photo_url = await storage_client.upload_report_photo(
                content, photo.content_type or "image/jpeg"
            )
        except InvalidUploadError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "INVALID_IMAGE",
                    "message": str(exc),
                    "action_required": "RETAKE_PHOTO",
                },
            )

    return await ProductService(db).create_report(
        user_id=UUID(current_user["user_id"]),
        barcode=barcode,
        notes=notes,
        photo_url=photo_url,
    )
