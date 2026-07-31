"""
Conexión async a PostgreSQL via SQLAlchemy 2.0 + asyncpg.
El engine es lazy — solo se inicializa si DATABASE_URL está configurado.
Esto permite arrancar el servidor en desarrollo sin credenciales de BD.
"""
from collections.abc import AsyncGenerator
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# Engine y session factory — lazy initialization
_engine: Optional[AsyncEngine] = None
_AsyncSessionLocal: Optional[async_sessionmaker] = None


def _get_engine() -> AsyncEngine:
    """Crea el engine la primera vez que se necesita (lazy)."""
    global _engine
    if _engine is None:
        if not settings.database_url:
            raise RuntimeError(
                "DATABASE_URL no configurado. "
                "Agrega tus credenciales de Supabase al archivo .env"
            )
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.is_development,  # Log SQL en desarrollo
            pool_pre_ping=True,            # Detecta conexiones muertas
            pool_size=10,
            max_overflow=20,
        )
    return _engine


def _get_session_factory() -> async_sessionmaker:
    """Crea la session factory la primera vez que se necesita."""
    global _AsyncSessionLocal
    if _AsyncSessionLocal is None:
        _AsyncSessionLocal = async_sessionmaker(
            _get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependencia FastAPI — provee una sesión de BD por request.
    Se cierra automáticamente al finalizar el request (via finally).

    Uso en endpoints:
        @router.get("/")
        async def endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    session_factory = _get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
