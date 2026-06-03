"""
Dependencias inyectables compartidas para todos los endpoints.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.infrastructure.database import get_db
from app.core.security import get_current_user, get_current_admin

# Re-exportar para uso conveniente en endpoints
__all__ = ["get_db", "get_current_user", "get_current_admin", "AsyncSession", "Depends"]
