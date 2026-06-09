"""
Middlewares transversales de seguridad.
Cumple SECURITY_GUIDELINES.md → "HTTP Security Headers".
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Añade cabeceras de seguridad a todas las respuestas.

    - HSTS: solo en producción (en dev se sirve por HTTP).
    - CSP `default-src 'none'`: la API no sirve HTML; bloquea cualquier render.
      Swagger UI (/docs) se exceptúa porque necesita cargar sus assets.
    """

    # Rutas de documentación que necesitan una CSP relajada para cargar Swagger/ReDoc.
    _DOCS_PATHS = ("/docs", "/redoc", "/openapi.json")

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # CSP estricta salvo en la documentación interactiva
        if request.url.path.startswith(self._DOCS_PATHS):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; img-src 'self' data: https:; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "worker-src 'self' blob:"
            )
        else:
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

        # HSTS solo en producción (HTTPS forzado por el proxy/hosting)
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response
