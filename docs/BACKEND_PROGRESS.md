# 📊 BACKEND_PROGRESS — AllergenSmart V2

> **Documento vivo** — se actualiza al cerrar cada cosa completa.
> Última actualización: **2026-06-09** · Rama: `V1-backend`.

---

## 🎯 Objetivo

Dejar **todo el backend funcional, seguro y desplegable** para que el Frontend (React Native/Expo)
lo conecte sin tocar lógica. Clean Architecture: `endpoints → services → repositories → models/DB`.

---

## 🟢 Estado actual (de un vistazo)

| Área | Estado |
|------|--------|
| Esqueleto FastAPI + Swagger + rate limiter + excepciones | ✅ |
| Auth (register/login) + JWT (Supabase) | ✅ real |
| Capas `repositories/` + `services/` + `detection.py` | ✅ completas |
| Endpoints (`/allergens`, `/users/me`(+allergies/scans), `/products`, `/scan`, `/reports`) | ✅ conectados a BD |
| Seed 14 alérgenos (UE 1169/2011 ≈ Codex) | ✅ cargado en Supabase |
| **Google Vision OCR** | ✅ **real y verificado** (key activa) |
| **Supabase Storage** (fotos reportes) | ✅ bucket `product-reports` creado + subida verificada |
| Security headers + auth hardening | ✅ |
| Tests unitarios (detección/normalizer) | ✅ 15 verde |
| Tests integración lectura (catálogo/producto) | ✅ verde |
| Docker (Dockerfile/compose/.dockerignore) | ✅ archivos listos (build pendiente de Docker Desktop) |

**Resumen**: el backend está funcional de punta a punta contra Supabase con OCR real.
Falta cerrar tests e2e de escritura, probar `/scan` con foto real y desplegar.

---

## 📋 Pasos restantes

- [ ] **Tests e2e de escritura** (perfil/scan) vía Supabase Admin API ⬅️ *siguiente recomendado*
- [ ] **Probar `/scan` real** con foto de etiqueta (`photos/foto1.webp`)
- [ ] **Deploy a Google Cloud Run** (requiere `gcloud auth login` del usuario)
- [ ] `docker build` + `docker compose up` (requiere Docker Desktop arrancado)
- [ ] (futuro) endpoints admin (revisar reportes), CI, observabilidad

---

## ⚠️ Notas técnicas / gotchas

1. **RLS bypass**: el backend conecta a Postgres directo (asyncpg) → no aplica `auth.uid()`.
   Los repositories **filtran por `user_id` manualmente** en cada query de datos del usuario.
2. **FK `profiles.id → auth.users.id`**: requiere un stub `auth.users` en `models/user.py` para que
   el ORM resuelva el FK (Alembic lo ignora vía `include_name`). Sin esto, ninguna query ORM corre.
3. **Tests asyncpg + asyncio**: el fixture usa engine con `NullPool` dedicado por test para evitar
   "Event loop is closed".
4. **Python 3.14**: vigilar compatibilidad de libs async.
5. **Secretos**: `SUPABASE_SERVICE_ROLE_KEY` y demás solo en `.env` (gitignored) / Secret Manager.
   Nunca en frontend ni en la imagen Docker.

---

## 🔌 Para el Frontend (cómo conectar)

- **Base URL dev**: `http://<IP_DEL_BACKEND>:8000/api/v1`
- **Auth**: el frontend usa **Supabase JS** para `signUp`/`signInWithPassword` (ver
  `docs/FRONTEND_AUTH_GUIDE.md`) y manda `Authorization: Bearer <access_token>` en cada request.
- **Endpoints** (contratos en la Biblia Técnica §7): `/auth/register`, `/auth/login`, `/allergens`,
  `/users/me` (+`/allergies`, `/scans`), `/products/{barcode}`, `/scan`, `/reports`, `GET /` health.
- **Swagger**: `http://localhost:8000/docs` → **Authorize** con el JWT.

---

## 🗓️ Bitácora (por hitos)

### Hito 1 — Lógica de negocio (2026-06-09)
Auditoría inicial (auth real, resto mock) → construcción de las capas `repositories/` y `services/`
+ `detection.py` (motor fuzzy). Todos los endpoints conectados a BD. Seed de 14 alérgenos cargado.
15 tests unitarios verde. Resuelto el bug latente del FK `auth.users` que bloqueaba todo el ORM.

### Hito 2 — Fase 2: seguridad, Vision, tests, Docker (2026-06-09)
- **Seguridad**: `core/middleware.py` (security headers; HSTS solo prod); `auth.py` con errores
  genéricos (sin `str(e)`), rate limit 5/min y audit log.
- **Vision REAL**: `vision_client.py` llama a `images:annotate` (TEXT_DETECTION, hint es) con httpx +
  validación de imagen previa. Key del usuario verificada en vivo. Ya no es mock.
- **Tests integración**: `pytest.ini` + `conftest.py` (NullPool). Lectura contra Supabase: 19✓/2 skip.
- **Docker**: `Dockerfile` (no-root, `$PORT` para Cloud Run) + `.dockerignore` + `docker-compose.yml`.

### Hito 3 — Fase 3: Storage, docs, e2e, scan real, deploy (2026-06-09)
- **Storage**: bucket `product-reports` creado; subida verificada (devuelve signed URL).
- **Docs**: borrados `docs/README.md` y `backend/README.md` (redundantes); README raíz con guía de
  arranque correcta + sección Deploy; este doc reestructurado.
- **Tests e2e** (`tests/test_integration_user_write.py` + fixture `e2e_user` en `conftest.py`):
  crea/borra usuario real vía Admin API; borrado por SQL directo sobre `auth.users` (el HTTP de GoTrue
  daba ReadTimeout). Verifica `replace_allergies` y `scan` (Vision monkeypatched) → danger + historial.
- **`/scan` REAL verificado**: `scripts/scan_image.py` sobre `backend/photos/foto1.webp` (etiqueta de
  vitaminas) → Vision OCR real → detectó **lactosa** (`lactose`) → **DANGER**. Pipeline real OK.
- **Deploy Cloud Run preparado**: `scripts/deploy_cloudrun.ps1` + sección Deploy en README.
  Pendiente de acción del usuario: `gcloud auth login` + crear secretos + correr el script.
