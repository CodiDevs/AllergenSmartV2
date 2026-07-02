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

@router.get("/verify-success")
async def verify_success():
    """
    Página web simple que se muestra cuando la redirección profunda (Deep Link) 
    de Supabase falla en el celular, o cuando un usuario verifica desde su PC.
    """
    from fastapi.responses import HTMLResponse
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cuenta Verificada - AllergenSmart</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, sans-serif;
                background-color: #E6F4FE;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                color: #0E3E5B;
                text-align: center;
                padding: 20px;
            }
            .card {
                background: white;
                padding: 40px 30px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                max-width: 400px;
                width: 100%;
            }
            .icon {
                width: 80px;
                height: 80px;
                background: #E8F5E9;
                color: #2E7D32;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                margin: 0 auto 20px;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { font-size: 16px; color: #517185; line-height: 1.5; margin-bottom: 30px; }
            a {
                display: inline-block;
                background-color: #3B82F6;
                color: white;
                text-decoration: none;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: bold;
                font-size: 16px;
                transition: background 0.3s;
            }
            a:hover { background-color: #2563EB; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">✓</div>
            <h1>¡Cuenta verificada!</h1>
            <p>El correo de <strong>AllergenSmart</strong> ha sido confirmado con éxito. Ya puedes cerrar esta ventana y regresar a la aplicación para iniciar sesión.</p>
            <a href="allergensmart://">Abrir AllergenSmart</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
