"""
Endpoints de autenticación — proxy delgado sobre Supabase Auth.

SEGURIDAD (SECURITY_GUIDELINES.md):
- Rate limiting estricto (brute force) en login/register.
- Nunca exponer detalles internos/de Supabase en los errores (sin `str(e)`).
- Audit log de intentos de login/registro SIN datos sensibles (ni password ni token).
"""
import logging

from fastapi import APIRouter, HTTPException, Request, status
from supabase import create_client, Client

from app.config import settings
from app.core.rate_limiter import limiter
from app.schemas.auth import UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger("allergensmart.auth")


def _get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "AUTH_UNAVAILABLE",
                "message": "El servicio de autenticación no está disponible.",
                "action_required": "RETRY_LATER",
            },
        )
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, user: UserRegister):
    """
    Registra un usuario nuevo vía Supabase Auth.
    El trigger de Supabase crea automáticamente el Profile del usuario.
    """
    supabase = _get_supabase_client()
    try:
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {"data": {"full_name": user.full_name}},
        })
        logger.info("Registro exitoso para email=%s", user.email)
        return {"message": "User registered successfully", "user": response.user}
    except Exception:
        # No se expone el detalle real (puede revelar si el email existe, etc.)
        logger.warning("Fallo de registro para email=%s", user.email, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "REGISTRATION_FAILED",
                "message": "No se pudo completar el registro. Verifica tus datos e intenta de nuevo.",
                "action_required": "RETRY",
            },
        )


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, user: UserLogin):
    """
    Inicia sesión con email y contraseña.
    Retorna el Token JWT para usar en el header Authorization (y en Swagger Authorize).
    """
    supabase = _get_supabase_client()
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password,
        })
        logger.info("Login exitoso para email=%s", user.email)
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": response.user,
        }
    except Exception:
        # Mensaje genérico — no distinguir "email no existe" de "password incorrecto".
        logger.warning("Login fallido para email=%s", user.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_CREDENTIALS",
                "message": "Credenciales inválidas.",
                "action_required": "RETRY",
            },
        )
