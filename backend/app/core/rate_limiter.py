"""
Rate limiting con slowapi.
Límite: 10 requests/minuto por IP para endpoints de escaneo.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

# Limiter global — key_func extrae la IP del request
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)
