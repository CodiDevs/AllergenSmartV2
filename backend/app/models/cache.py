from typing import Optional
"""
Modelo SQLAlchemy: OCRCache.
Caché de resultados OCR por barcode — TTL de 30 días.
Cache L2 del sistema de 3 niveles.
"""
import uuid
from datetime import datetime, timedelta

from sqlalchemy import ARRAY, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


def _default_expiry() -> datetime:
    """TTL de 30 días desde ahora."""
    return datetime.utcnow() + timedelta(days=30)


class OCRCache(Base):
    """
    Caché de resultados OCR indexado por barcode.

    Cache L2: más lento que L1 (products verificados) pero evita
    llamar a Vision API para el mismo producto dos veces.
    TTL: 30 días (expires_at).
    """
    __tablename__ = "ocr_cache"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    barcode: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    ocr_text: Mapped[str] = mapped_column(String, nullable=True)
    ingredients_extracted: Mapped[list[str]] = mapped_column(ARRAY(String), default=[], server_default="{}")
    warnings_extracted: Mapped[list[str]] = mapped_column(ARRAY(String), default=[], server_default="{}")
    ocr_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(default=_default_expiry, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    @property
    def is_valid(self) -> bool:
        """Retorna True si el caché aún no ha expirado."""
        return datetime.utcnow() < self.expires_at
