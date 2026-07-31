# =====================================================================
# AllergenSmart API — imagen de producción
# Base mínima, usuario no-root (SECURITY_GUIDELINES → Docker).
# =====================================================================
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Usuario sin privilegios
RUN useradd --create-home --uid 1000 appuser

# Dependencias primero (mejor cache de capas)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código de la app + migraciones + scripts (seed)
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY scripts ./scripts

USER appuser

EXPOSE 8000

# Respeta $PORT si el entorno lo define; en local cae a 8000.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
