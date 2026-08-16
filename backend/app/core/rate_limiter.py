"""
Rate limiting con slowapi.
Límite: 60 requests/minuto por IP real para endpoints de escaneo.
"""
from slowapi import Limiter
from starlette.requests import Request

from app.config import settings


def get_client_ip(request: Request) -> str:
    """Obtiene la IP real del cliente considerando cabeceras de proxies inversos."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


limiter = Limiter(
    key_func=get_client_ip,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)

