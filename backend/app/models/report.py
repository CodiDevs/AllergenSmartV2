"""
Modelo SQLAlchemy: ProductReport.
Crowdsourcing — los usuarios reportan productos locales no catalogados.
"""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ProductReport(Base):
    """
    Reporte de un producto por parte de un usuario.
    status: 'pending' → 'approved' | 'rejected' (revisado por admin)
    """
    __tablename__ = "product_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    reported_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id"), nullable=True
    )
    barcode: Mapped[str] = mapped_column(String, nullable=True)
    photo_url: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending", server_default="pending")
    reviewed_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id"), nullable=True
    )
    reviewed_at: Mapped[datetime] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relaciones
    reporter: Mapped["Profile"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="reports",
        foreign_keys=[reported_by],
    )
