# 🛡️ AllergenSmart V2

Plataforma móvil + backend que escanea etiquetas de alimentos con **OCR (Google Vision)** y detecta
alérgenos según el perfil del usuario mediante **fuzzy matching**. Mercado inicial: **Manta, Ecuador**.

## 📁 Estructura

- `backend/` — API **FastAPI** (Python 3.14), Clean Architecture, conectada a **Supabase**.
- `frontend/` — (próximamente) **React Native + Expo**.
- `docs/` — documentación del proyecto (ver abajo).

## 📚 Documentación

| Doc | Contenido |
|-----|-----------|
| [`docs/AllergenSmart_Technical_Bible.md`](docs/AllergenSmart_Technical_Bible.md) | Doc maestro: arquitectura, BD, contrato de API, decisiones. |
| [`docs/BACKEND_PROGRESS.md`](docs/BACKEND_PROGRESS.md) | Estado vivo del backend: hecho, pendiente, bitácora. |
| [`docs/SECURITY_GUIDELINES.md`](docs/SECURITY_GUIDELINES.md) | Estándares de seguridad obligatorios. |
| [`docs/FRONTEND_AUTH_GUIDE.md`](docs/FRONTEND_AUTH_GUIDE.md) | Cómo el frontend maneja auth (Supabase JS). |

---

## 🚀 Arrancar el Backend

> ⚠️ **Corre SIEMPRE desde la carpeta `backend/`.** El paquete `app` vive en `backend/app`; si lo
> ejecutas desde la raíz verás `ModuleNotFoundError: No module named 'app'`.

```powershell
cd backend
.\.venv\Scripts\Activate.ps1                 # activar el entorno virtual
python -m uvicorn app.main:app --reload      # levantar el servidor (auto-reload)
```

- **Swagger UI** (probar la API): http://localhost:8000/docs
- **Health check**: http://localhost:8000/

### Variables de entorno (`backend/.env`)

| Variable | Para qué |
|----------|----------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | auth del cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | acceso backend (BD directa, Storage). **Secreta — nunca al frontend/git** |
| `DATABASE_URL` | conexión async a Postgres (asyncpg) |
| `GOOGLE_CLOUD_API_KEY` | OCR real con Google Vision (si falta → mock) |

### Seed del catálogo de alérgenos (una vez)

```powershell
python -m scripts.seed_allergens   # 14 alérgenos estándar (UE 1169/2011 ≈ Codex), idempotente
```

### Tests

```powershell
python -m pytest tests/ -q
```

---

## 🐳 Docker (local)

El backend se empaqueta con `backend/Dockerfile` (imagen no-root). Para correrlo en local:
```powershell
cd backend
docker compose up --build
```
Los secretos se leen de `backend/.env` (nunca se hornean en la imagen).

> **Deploy a producción:** aún no aplica. El despliegue a la nube se definirá cuando el proyecto
> entre a producción; por ahora el backend corre solo en local.
