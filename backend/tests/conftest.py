"""
Fixtures compartidos de tests.

Los tests marcados `integration` usan una sesión real contra Supabase. Se saltan
automáticamente si DATABASE_URL no está configurado (p.ej. en CI sin secretos).

NOTA (asyncio + asyncpg): cada test corre en su propio event loop (function scope).
Por eso el fixture crea un engine dedicado con NullPool y lo descarta al terminar,
en vez de reusar el engine global de la app (cuyas conexiones quedarían atadas a un
loop ya cerrado → "RuntimeError: Event loop is closed").
"""
import uuid

import pytest
import pytest_asyncio
from sqlalchemy import text
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
            # Rollback defensivo: las ESCRITURAS de los tests e2e NO se commitean →
            # no ensucian la BD. La limpieza del usuario la hace el fixture e2e_user.
            await session.rollback()
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def e2e_user():
    """
    Crea un usuario de prueba REAL en Supabase Auth (service_role) → el trigger
    `on_auth_user_created` crea su `profile`. Hace yield del user_id (UUID) y al
    final lo borra (cascade limpia profile/allergies/scans).

    Se salta si falta SUPABASE_SERVICE_ROLE_KEY.
    """
    if not settings.supabase_service_role_key or not settings.supabase_url:
        pytest.skip("SUPABASE_SERVICE_ROLE_KEY no configurado — se omiten tests e2e")

    from supabase import create_client

    client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    # La CREACIÓN va por la Admin API (dispara el trigger que crea el profile).
    email = f"e2e+{uuid.uuid4().hex}@example.com"
    created = client.auth.admin.create_user(
        {
            "email": email,
            "password": uuid.uuid4().hex + "Aa1!",
            "email_confirm": True,
            "user_metadata": {"full_name": "E2E Test User"},
        }
    )
    user_id = uuid.UUID(created.user.id)
    try:
        yield user_id
    finally:
        # El BORRADO va por SQL directo (fiable y rápido; el endpoint HTTP de GoTrue
        # daba ReadTimeout). El FK ON DELETE CASCADE limpia profile/allergies/scans.
        # Best-effort: un fallo de limpieza no debe marcar el test como fallido.
        await _delete_auth_user_sql(str(user_id))


async def _delete_auth_user_sql(user_id: str) -> None:
    """Borra un usuario de auth.users vía SQL (cascade). Best-effort."""
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    try:
        async with engine.begin() as conn:
            await conn.execute(
                text("DELETE FROM auth.users WHERE id = :id"), {"id": user_id}
            )
    except Exception:  # noqa: BLE001 — limpieza best-effort
        import warnings

        warnings.warn(f"No se pudo limpiar el usuario e2e {user_id}", stacklevel=2)
    finally:
        await engine.dispose()
