from fastapi import APIRouter, HTTPException, status
from supabase import create_client, Client

from app.config import settings
from app.schemas.auth import UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["Auth"])

def _get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase credentials missing"
        )
    return create_client(settings.supabase_url, settings.supabase_anon_key)

@router.post("/register")
async def register(user: UserRegister):
    """
    Registra un usuario nuevo. Esto llama internamente a Supabase Auth.
    El trigger de Supabase creará automáticamente el Profile del usuario.
    """
    supabase = _get_supabase_client()
    try:
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "full_name": user.full_name
                }
            }
        })
        return {"message": "User registered successfully", "user": response.user}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login")
async def login(user: UserLogin):
    """
    Inicia sesión con email y contraseña.
    Retorna el Token JWT que se debe usar en el Swagger UI (botón Authorize).
    """
    supabase = _get_supabase_client()
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": response.user
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
