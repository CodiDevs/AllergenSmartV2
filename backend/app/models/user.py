from typing import Optional
"""
Modelos SQLAlchemy: Profile y UserAllergy.
Profile extiende auth.users de Supabase (mismo UUID).
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    """
    Perfil del usuario — extiende auth.users de Supabase.
    Se crea automáticamente via trigger SQL al registrarse.
    El id es el mismo UUID que Supabase Auth asigna.
    """
    __tablename__ = "profiles"

    # Mismo UUID que auth.users — NO se genera aquí
    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    full_name: Mapped[str] = mapped_column(String, default="", server_default="")
    city: Mapped[str] = mapped_column(String, default="Manta", server_default="Manta")
    language: Mapped[str] = mapped_column(String, default="es-EC", server_default="es-EC")
    avatar_url: Mapped[str] = mapped_column(String, nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Relaciones
    allergies: Mapped[list["UserAllergy"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    scans: Mapped[list["ScanHistory"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="user",
        cascade="all, delete-orphan",
    )
    reports: Mapped[list["ProductReport"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="reporter",
        foreign_keys="ProductReport.reported_by",
    )


class UserAllergy(Base):
    """
    Tabla pivote N:M entre profiles y allergens.
    Guarda la severidad de cada alergia del usuario.
    """
    __tablename__ = "user_allergies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    allergen_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("allergens.id", ondelete="CASCADE"), nullable=False
    )
    severity: Mapped[str] = mapped_column(String, default="high", server_default="high")
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())

    # Relaciones
    user: Mapped["Profile"] = relationship(back_populates="allergies")
    allergen: Mapped["Allergen"] = relationship()  # type: ignore[name-defined]  # noqa: F821
