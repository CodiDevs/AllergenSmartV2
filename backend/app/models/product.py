from typing import Optional
"""
Modelo SQLAlchemy: Product.
Incluye soft delete (deleted_at) para no romper FKs en scan_history.
"""
import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Product(Base, TimestampMixin):
    """
    Catálogo de productos escaneados.

    deleted_at: Soft delete — permite "borrar" sin perder historial de escaneos.
    verified_by_admin: Si True, es Cache L1 (confiable, sin necesidad de re-escanear).
    """
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    barcode: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    brand: Mapped[str] = mapped_column(String, nullable=True)
    ingredients_raw: Mapped[str] = mapped_column(String, nullable=True)
    ingredients_array: Mapped[list[str]] = mapped_column(ARRAY(String), default=[], server_default="{}")
    image_url: Mapped[str] = mapped_column(String, nullable=True)
    verified_by_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    verified_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id"), nullable=True
    )
    verified_at: Mapped[datetime] = mapped_column(nullable=True)
    country_origin: Mapped[str] = mapped_column(String, default="EC", server_default="EC")

    # Soft delete — no borrar físicamente para preservar scan_history
    deleted_at: Mapped[datetime] = mapped_column(nullable=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
