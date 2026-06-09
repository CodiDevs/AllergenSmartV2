# 📊 BACKEND_PROGRESS — AllergenSmart V2

> **Documento vivo.** Se actualiza al cerrar cada slice. Última actualización: 2026-06-09.
> Rama: `V1-backend`.

---

## 🎯 Objetivo del sprint

Dejar **todo el backend funcional y conectable** para que el equipo de Frontend (React Native / Expo)
lo enchufe sin tocar lógica de negocio. Hoy el esqueleto + autenticación están listos; el resto de
endpoints devuelven datos MOCK. La meta es reemplazar cada mock por lógica real contra Supabase,
capa por capa (Clean Architecture: `endpoints → services → repositories → models/DB`).

---

## ✅ Hecho

- Base de datos + migración Alembic (`backend/alembic/versions/3265caf90a58_initial_schema.py`).
- RLS policies + triggers de Supabase Auth activos.
- Modelos SQLAlchemy (todos): user, allergen, product, scan, report, cache.
- Schemas Pydantic (todos): scan, user, allergen, product, report, error, common, auth.
- App FastAPI corre con Swagger en `/docs`, router v1, rate limiter (slowapi), excepciones de dominio.
- **Auth real**: `POST /api/v1/auth/register` y `/login` → Supabase Auth.
- **JWT real**: `core/security.py:get_current_user` valida el token vía `supabase.auth.get_user()`.
- **Engine async** lazy a Postgres (`infrastructure/database.py`, asyncpg).

---

## 🔧 En progreso

- **Nada pendiente de la lógica de negocio.** Falta solo lo que depende de credenciales
  externas (Vision API key, Storage bucket) y tests de integración con BD.

---

## 📋 Falta (checklist)

### Capas nuevas
- [x] `repositories/base.py` (genérico) + `allergen_repo`, `product_repo`, `user_repo`, `scan_history_repo`, `cache_repo`, `report_repo`
- [x] `services/`: `allergen_service`, `user_service`, `product_service`, `text_normalizer`, `detection`, `cache_service`, `scan_service`
- [x] `infrastructure/storage_client.py` (Supabase Storage real + validación MIME/firma/tamaño)
- [x] `scripts/seed_allergens.py` (14 alérgenos estándar UE/Codex, idempotente) — **cargado en Supabase**
- [x] `tests/` unit (detección + normalizer) — 15 tests verde
- [ ] `tests/` de integración con BD (requiere usuario de prueba)
- [ ] Dockerfile + docker-compose

### Endpoints (mock → conectado a BD) ✅ todos hechos
- [x] `GET /api/v1/allergens` — catálogo real desde BD (verificado: 14 cat / 14 alérgenos)
- [x] `GET/PUT /api/v1/users/me` + `PUT /me/allergies` + `GET /me/scans`
- [x] `GET /api/v1/products/{barcode}`
- [x] `POST /api/v1/scan` — pipeline completo (OCR mock → normalizar → detectar → cache → guardar)
- [x] `POST /api/v1/reports` — guardar reporte + subir foto (storage guarda sin foto hasta tener bucket)
- [x] `get_current_admin` — valida `profiles.is_admin` en BD

### Fix importante
- [x] **Bug latente resuelto**: el ORM no resolvía el FK `profiles.id → auth.users.id`
  (tabla gestionada por Supabase, ausente del metadata). Se añadió un stub `auth.users`
  en `models/user.py` (Alembic la ignora vía `include_name`). Sin esto, NINGUNA query ORM
  funcionaba — nadie lo notó porque auth usa el cliente `supabase-py`, no el ORM.

---

## ⚠️ Problemas / Bloqueos

1. **Catálogo de alérgenos vacío en BD.** Sin seed, `/allergens` real devuelve vacío y el scan no
   detecta nada. → Necesita `seed_allergens.py`. Los datos (qué alérgenos, synonyms, ocr_variants)
   se curan a mano (estándar latino ~14 mayores). **Se mostrará la lista al usuario antes de cargar.**
2. **Google Vision = MOCK.** `vision_client.py` devuelve texto fijo. El pipeline se construye y prueba
   con el mock; el OCR real necesita la API key. → Ver sección API keys.
3. **Supabase Storage** sin bucket configurado para fotos de reportes. → Ver sección API keys.
4. **RLS bypass**: el backend conecta a Postgres directo (asyncpg) → NO aplica `auth.uid()` de RLS.
   Los repositories DEBEN filtrar por `user_id` manualmente en cada query de datos del usuario.
5. **Python 3.14**: ya hubo ajustes de compatibilidad; vigilar libs async (asyncpg / SQLAlchemy).

---

## 🔑 Cuándo necesito API keys (acción del usuario)

| Cuándo | Qué se necesita | Acción del usuario | Mientras tanto |
|---|---|---|---|
| Pipeline de **scan real** | Google Cloud Vision API key | Crear proyecto en Google Cloud → habilitar Vision API → generar key → pegar en `.env` (`GOOGLE_CLOUD_API_KEY`) | Mock de OCR (texto simulado) |
| **Reportes** con foto | Supabase Storage bucket + creds | Crear bucket privado en Supabase → confirmar `SUPABASE_SERVICE_ROLE_KEY` en `.env` | Reporte sin foto / placeholder |

> El código queda listo para que, al pegar la key, funcione sin cambios.

---

## 🔌 Para el Frontend (cómo conectar)

- **Base URL dev**: `http://<IP_DEL_BACKEND>:8000/api/v1`
- **Auth**: el frontend usa **Supabase JS** directo para `signUp` / `signInWithPassword`
  (ver `docs/FRONTEND_AUTH_GUIDE.md`). Luego manda en cada request:
  `Authorization: Bearer <access_token>`.
- **Endpoints listos hoy**:
  - `POST /auth/register`, `POST /auth/login` (también se puede via Supabase JS directo)
  - `GET /` health check
- **Endpoints en construcción** (contratos ya definidos en la Biblia Técnica, sección 7):
  `/allergens`, `/users/me`, `/users/me/allergies`, `/users/me/scans`, `/products/{barcode}`,
  `/scan`, `/reports`.
- **Swagger** (pruebas): `http://localhost:8000/docs` → botón **Authorize** con el JWT.

---

## 🗓️ Bitácora

- **2026-06-09 (1)**: Creado este doc. Memoria persistente inicializada. Estado base auditado
  (auth real, resto mock). Arranca construcción de la capa `repositories/`.
- **2026-06-09 (6)**: Fase 2 — Bloque D (Docker):
  - `backend/Dockerfile` (python:3.14-slim, usuario no-root `appuser`, CMD respeta `$PORT` para Cloud Run),
    `backend/.dockerignore` (excluye `.venv`, `.env`, `tests`), `backend/docker-compose.yml` (api + env_file).
  - Verificado: Docker 29.0.1 instalado; `.env` ignorado por git y no trackeado.
  - **Pendiente**: `docker build` no se pudo correr porque Docker Desktop (daemon) no estaba arrancado.
    Al iniciarlo: `cd backend; docker build -t allergensmart-api .` y `docker compose up`.
- **2026-06-09 (5)**: Fase 2 — Bloque C (Tests de integración):
  - `pytest.ini` (asyncio_mode=auto, marker `integration`), `tests/conftest.py` (fixture `db_session`
    con engine NullPool dedicado → evita "Event loop is closed").
  - Tests de lectura contra Supabase: catálogo (14 alérgenos, gluten+sinónimos) y producto inexistente
    → `ProductNotFoundException`. Total: **19 passed, 2 skipped** (escritura pospuesta a usuario de prueba).
- **2026-06-09 (4)**: Fase 2 — Bloque B (Google Vision REAL activado):
  - `vision_client.py`: llamada real a `images:annotate` (TEXT_DETECTION, languageHints es) vía httpx;
    validación de imagen (firma/MIME/≤10MB) antes de enviar; errores → `VisionAPIException` genérica.
  - Verificado en vivo: la API key del usuario funciona (smoke test 1x1 → OCRNoTextException).
  - **Vision ya NO es mock** (solo cae a mock si la key está vacía).
- **2026-06-09 (3)**: Fase 2 — Bloque A (Hardening seguridad):
  - `core/middleware.py`: SecurityHeadersMiddleware (CSP, X-Frame-Options, nosniff, Referrer-Policy;
    HSTS solo en producción; CSP relajada solo en /docs).
  - `endpoints/auth.py`: errores genéricos (sin `str(e)`), rate limit `5/minute` en login/register,
    audit log de intentos sin datos sensibles.
- **2026-06-09 (2)**: Sprint completo de lógica de negocio:
  - Construidas capas `repositories/` y `services/` enteras + `detection.py` (motor fuzzy).
  - Todos los endpoints (allergens, users, products, scan, reports) conectados a BD real.
  - Seed de los 14 alérgenos estándar (UE 1169/2011 ≈ Codex) cargado y verificado en Supabase.
  - 15 tests unitarios verde (detección + normalizador OCR).
  - Resuelto bug latente del FK `auth.users` que bloqueaba todo el ORM.
  - **Pendiente externo**: Google Vision API key (scan real) y Supabase Storage bucket (fotos).
