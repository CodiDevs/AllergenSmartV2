"""
Middleware de autenticación JWT via Supabase Auth.
Verifica tokens en cada request protegido.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client, Client

from app.config import settings
from app.core.exceptions import UnauthorizedException
from app.infrastructure.database import get_db

# Esquema de seguridad para Swagger UI
bearer_scheme = HTTPBearer()


def _get_supabase_client() -> Client:
    """Crea un cliente Supabase para verificar JWTs."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise UnauthorizedException()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Dependencia FastAPI — verifica JWT de Supabase y extrae user_id.

    Uso en endpoints:
        @router.get("/me")
        async def get_profile(user: dict = Depends(get_current_user)):
            user_id = user["user_id"]
    """
    token = credentials.credentials

    try:
        supabase = _get_supabase_client()
        response = supabase.auth.get_user(token)

        if not response or not response.user:
            raise UnauthorizedException()

        return {
            "user_id": str(response.user.id),
            "email": response.user.email,
        }
    except UnauthorizedException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "UNAUTHORIZED",
                "message": "Token inválido o expirado. Inicia sesión nuevamente.",
                "action_required": "REDIRECT_LOGIN",
            },
        )


async def get_current_admin(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Dependencia FastAPI — requiere que el usuario sea admin.
    Valida profiles.is_admin = true en la BD. Úsala en endpoints de administración.
    """
    from uuid import UUID

    from app.repositories.user_repo import UserRepository

    if not await UserRepository(db).is_admin(UUID(user["user_id"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "No tienes permisos de administrador.",
                "action_required": "NONE",
            },
        )
    return user
