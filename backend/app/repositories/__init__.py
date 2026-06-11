"""
Capa de Repositorios — acceso a datos vía SQLAlchemy async.

Los repositorios encapsulan TODAS las queries a la base de datos.
Los servicios nunca escriben SQL: piden datos a los repositorios.

IMPORTANTE (seguridad): el backend conecta a Postgres directo (asyncpg),
por lo que las RLS policies basadas en auth.uid() NO aplican. Cada repositorio
que maneje datos de un usuario DEBE filtrar por user_id explícitamente.
"""
