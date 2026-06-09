"""Enable Row Level Security (defense-in-depth)

Habilita RLS en todas las tablas y crea policies.

IMPORTANTE: el backend conecta con el rol `postgres` de Supabase (tiene BYPASSRLS),
por lo que sigue leyendo/escribiendo igual. RLS solo protege si algo entra por los
roles `anon`/`authenticated` (p.ej. Supabase JS directo desde el frontend).

Revision ID: b7f2a9c4e1d3
Revises: 3265caf90a58
Create Date: 2026-06-09

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7f2a9c4e1d3"
down_revision: Union[str, None] = "3265caf90a58"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tablas con dueño de fila → (tabla, columna que apunta a auth.users vía profiles.id)
_OWNER_TABLES: list[tuple[str, str]] = [
    ("profiles", "id"),
    ("user_allergies", "user_id"),
    ("scan_history", "user_id"),
    ("product_reports", "reported_by"),
]

# Catálogo de solo lectura (cualquier usuario logueado puede leer)
_PUBLIC_READ_TABLES: list[str] = ["allergens", "allergen_categories", "products"]

# Sin acceso público (solo el backend con BYPASSRLS) → RLS on, sin policies = deny-all
_PRIVATE_TABLES: list[str] = ["ocr_cache"]

_ALL_TABLES = (
    [t for t, _ in _OWNER_TABLES] + _PUBLIC_READ_TABLES + _PRIVATE_TABLES
)


def upgrade() -> None:
    # Habilitar RLS en todas las tablas de la app
    for table in _ALL_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")

    # Policies de dueño de fila: cada usuario solo ve/edita sus propias filas
    for table, owner_col in _OWNER_TABLES:
        op.execute(
            f"""
            CREATE POLICY "{table}_owner_all" ON {table}
            FOR ALL
            TO authenticated
            USING (auth.uid() = {owner_col})
            WITH CHECK (auth.uid() = {owner_col});
            """
        )

    # Catálogo: lectura para usuarios logueados (y anon, para el catálogo público de alérgenos)
    for table in _PUBLIC_READ_TABLES:
        op.execute(
            f"""
            CREATE POLICY "{table}_public_read" ON {table}
            FOR SELECT
            TO anon, authenticated
            USING (true);
            """
        )

    # _PRIVATE_TABLES: RLS habilitado sin policies → deny-all salvo BYPASSRLS del backend.


def downgrade() -> None:
    for table, _ in _OWNER_TABLES:
        op.execute(f'DROP POLICY IF EXISTS "{table}_owner_all" ON {table};')
    for table in _PUBLIC_READ_TABLES:
        op.execute(f'DROP POLICY IF EXISTS "{table}_public_read" ON {table};')
    for table in _ALL_TABLES:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
