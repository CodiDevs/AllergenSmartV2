from typing import Optional
"""
Base declarativa SQLAlchemy y mixins compartidos.
Todos los modelos heredan de Base.
"""
import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base declarativa — todos los modelos ORM heredan de aquí."""
    pass


class TimestampMixin:
    """Mixin que agrega created_at y updated_at automáticos."""
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )


class UUIDPrimaryKeyMixin:
    """Mixin que agrega UUID como PK con generación automática."""
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
