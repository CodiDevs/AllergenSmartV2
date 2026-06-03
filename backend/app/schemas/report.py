"""
Schemas Pydantic para reportes de productos (crowdsourcing).
"""
from typing import Optional
from pydantic import BaseModel
from app.schemas.common import ReportStatus


class ReportCreate(BaseModel):
    """Datos para crear un reporte de producto."""
    barcode: Optional[str] = None
    notes: Optional[str] = None
    # photo_url se asigna en el backend tras subir a Supabase Storage


class ReportResponse(BaseModel):
    """Respuesta al crear un reporte."""
    id: str
    status: ReportStatus
    message: str
