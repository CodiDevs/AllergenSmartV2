"""
Tests de integración del camino de ESCRITURA (perfil / alergias / scan).

POSPUESTOS: estas operaciones requieren un usuario real en `auth.users` (FK de
`profiles.id`), gestionado por Supabase Auth. Crearlo/borrarlo de forma segura
necesita la Admin API + limpieza, o una BD Postgres local (ver Bloque D del plan,
servicio `db` en docker-compose). Hasta entonces se marcan skip documentado para
no ensuciar la BD de Supabase ni dejar usuarios huérfanos.
"""
import pytest


@pytest.mark.integration
@pytest.mark.skip(
    reason="Requiere usuario de prueba en auth.users (Supabase Admin API) o Postgres local — Bloque D"
)
async def test_replace_allergies_persists(db_session):
    ...


@pytest.mark.integration
@pytest.mark.skip(
    reason="Requiere usuario de prueba en auth.users + scan end-to-end — Bloque D"
)
async def test_scan_persists_history(db_session):
    ...
