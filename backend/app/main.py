"""
AllergenSmart API v2.0 — Punto de entrada principal de FastAPI.
Configura la app, middleware, CORS, routers y exception handlers.
"""
from contextlib import asynccontextmanager

# Monitoreo de producción (Sentry) — desactivado hasta que el proyecto vaya a producción.
# import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import router as v1_router
from app.config import settings
from app.core.exceptions import DomainException
from app.core.middleware import SecurityHeadersMiddleware
from app.core.rate_limiter import limiter


# =====================================================================
# Lifespan — startup y shutdown de la app
# =====================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Configura recursos al iniciar y los limpia al cerrar."""
    # Startup
    # Sentry (monitoreo de errores en prod) — reactivar al ir a producción:
    #   if settings.sentry_dsn and settings.is_production:
    #       sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)
    print(f"[START] {settings.app_name} v{settings.app_version} [{settings.environment}] arrancando...")
    yield
    # Shutdown
    print("[STOP] Servidor cerrando...")


# =====================================================================
# Aplicación FastAPI
# =====================================================================
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
## AllergenSmart API

API para la app móvil de detección de alérgenos en etiquetas de alimentos.

### Características
- 🔍 **OCR**: Extracción de texto de imágenes con Google Cloud Vision API
- 🧠 **Detección inteligente**: Fuzzy matching + sinónimos para tolerar errores de OCR
- ⚡ **Caché de 3 niveles**: Productos verificados → OCR cache → Vision API
- 🔐 **Auth**: JWT via Supabase Auth
- 🛡️ **Rate limiting**: 10 escaneos/minuto por IP

### Mercado objetivo
Manta, Ecuador — optimizado para etiquetas ecuatorianas (INEN, ARCSA)
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# =====================================================================
# Rate Limiter
# =====================================================================
app.state.limiter = limiter

# =====================================================================
# Security Headers (HSTS, CSP, X-Frame-Options, nosniff...)
# =====================================================================
app.add_middleware(SecurityHeadersMiddleware)

# =====================================================================
# CORS
# =====================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# Exception Handlers — convierte excepciones a ErrorResponse estándar
# =====================================================================
@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException) -> JSONResponse:
    """Convierte excepciones de dominio al formato ErrorResponse estándar."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "action_required": exc.action_required,
        },
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Convierte errores de rate limiting al formato ErrorResponse estándar."""
    return JSONResponse(
        status_code=429,
        content={
            "error_code": "RATE_LIMITED",
            "message": f"Has excedido el límite de {settings.rate_limit_per_minute} escaneos por minuto. Espera un momento.",
            "action_required": "WAIT_AND_RETRY",
        },
    )


# =====================================================================
# Routers
# =====================================================================
app.include_router(v1_router)


# =====================================================================
# Health Check — endpoint raíz público
# =====================================================================
@app.get(
    "/",
    tags=["Health"],
    summary="Estado del servidor",
    response_description="Estado y versión de la API",
)
async def health_check() -> dict:
    """Verifica que el servidor está funcionando correctamente."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }
