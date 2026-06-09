"""
Fixtures compartidos de tests.

Los tests marcados `integration` usan una sesión real contra Supabase. Se saltan
automáticamente si DATABASE_URL no está configurado (p.ej. en CI sin secretos).

NOTA (asyncio + asyncpg): cada test corre en su propio event loop (function scope).
Por eso el fixture crea un engine dedicado con NullPool y lo descarta al terminar,
en vez de reusar el engine global de la app (cuyas conexiones quedarían atadas a un
loop ya cerrado → "RuntimeError: Event loop is closed").
"""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings


@pytest_asyncio.fixture
async def db_session():
    """Sesión async contra la BD real. Se salta si no hay DATABASE_URL."""
    if not settings.database_url:
        pytest.skip("DATABASE_URL no configurado — se omiten tests de integración")

    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with factory() as session:
            yield session
            # Rollback defensivo: los tests de integración son de solo lectura;
            # cualquier cambio accidental NO se persiste.
            await session.rollback()
    finally:
        await engine.dispose()
