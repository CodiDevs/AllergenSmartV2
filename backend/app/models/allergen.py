from typing import Optional
"""
Modelos SQLAlchemy: AllergenCategory y Allergen.
El corazón del sistema — synonyms[] y ocr_variants[] alimentan el motor de detección.
"""
import uuid

from sqlalchemy import ARRAY, Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AllergenCategory(Base):
    """
    Categoría de alérgenos.
    Ej: 'Lácteos' agrupa lactosa, caseína, suero, etc.
    """
    __tablename__ = "allergen_categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    icon_emoji: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    allergens: Mapped[list["Allergen"]] = relationship(
        back_populates="category",
        order_by="Allergen.name",
    )


class Allergen(Base):
    """
    Catálogo de alérgenos — corazón del sistema de detección.

    synonyms[]:     términos que aparecen en etiquetas reales → motor de matching
    ocr_variants[]: errores comunes del OCR → fast path O(1) antes del fuzzy matching
    """
    __tablename__ = "allergens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("allergen_categories.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # NOTE: scientific_names se mantiene en esquema pero no se puebla en MVP
    scientific_names: Mapped[list[str]] = mapped_column(ARRAY(String), default=[], server_default="{}")

    # Clave del sistema: términos que aparecen en etiquetas reales
    synonyms: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, server_default="{}")

    # Fast path para errores conocidos del OCR: "glten" → "gluten"
    ocr_variants: Mapped[list[str]] = mapped_column(ARRAY(String), default=[], server_default="{}")

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    category: Mapped["AllergenCategory"] = relationship(back_populates="allergens")
