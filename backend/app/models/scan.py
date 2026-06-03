from typing import Optional
"""
Modelo SQLAlchemy: ScanHistory.
Registro de cada escaneo realizado por un usuario.
"""
import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ScanHistory(Base):
    """
    Historial de escaneos de un usuario.

    scan_source:      'camera' | 'barcode_only' | 'manual' → analytics de comportamiento
    app_version:      versión del backend al momento del escaneo → debug por release
    detected_allergens: JSONB → permite analytics sin JOINs adicionales
    from_cache:       true si se usó L1/L2 caché, false si se llamó a Vision API
    """
    __tablename__ = "scan_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id"), nullable=True
    )
    barcode: Mapped[str] = mapped_column(String, nullable=True)  # denormalizado para queries rápidos
    result_status: Mapped[str] = mapped_column(String, nullable=False)  # 'safe' | 'warning' | 'danger'
    scan_source: Mapped[str] = mapped_column(String, default="camera", server_default="camera")
    app_version: Mapped[str] = mapped_column(String, nullable=True)
    detected_allergens: Mapped[list] = mapped_column(JSONB, default=[], server_default="[]")
    ocr_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    ingredients_found: Mapped[list[str]] = mapped_column(ARRAY(String), default=[], server_default="{}")
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    from_cache: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    scanned_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relaciones
    user: Mapped["Profile"] = relationship(back_populates="scans")  # type: ignore[name-defined]  # noqa: F821
    product: Mapped["Product"] = relationship()  # type: ignore[name-defined]  # noqa: F821
