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
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;800&family=Inter:wght@400;500&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                /* Degradado moderno estilo AllergenSmart */
                background: linear-gradient(135deg, #E6F4FE 0%, #BFE0F9 100%);
                color: #0E3E5B;
                padding: 20px;
                overflow: hidden;
            }
            /* Decoraciones de fondo flotantes */
            .blob1, .blob2 {
                position: absolute;
                border-radius: 50%;
                filter: blur(60px);
                z-index: 0;
            }
            .blob1 { width: 300px; height: 300px; background: rgba(29, 158, 117, 0.2); top: -100px; left: -100px; animation: float 6s ease-in-out infinite; }
            .blob2 { width: 400px; height: 400px; background: rgba(59, 130, 246, 0.15); bottom: -150px; right: -100px; animation: float 8s ease-in-out infinite reverse; }
            
            @keyframes float {
                0% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(20px) scale(1.05); }
                100% { transform: translateY(0px) scale(1); }
            }
            
            /* Tarjeta Glassmorphism */
            .card {
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.5);
                padding: 50px 40px;
                border-radius: 30px;
                box-shadow: 0 20px 40px rgba(14, 62, 91, 0.08);
                max-width: 420px;
                width: 100%;
                text-align: center;
                z-index: 1;
                transform: translateY(20px);
                opacity: 0;
                animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            
            @keyframes slideUp {
                to { transform: translateY(0); opacity: 1; }
            }
            
            /* Icono SVG animado */
            .icon-container {
                width: 90px;
                height: 90px;
                background: linear-gradient(135deg, #1D9E75 0%, #147A5A 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                box-shadow: 0 10px 20px rgba(29, 158, 117, 0.3);
                transform: scale(0);
                animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s forwards;
            }
            
            @keyframes popIn {
                to { transform: scale(1); }
            }
            
            h1 { 
                font-family: 'Nunito', sans-serif;
                font-size: 28px; 
                font-weight: 800;
                margin: 0 0 12px; 
                color: #0E3E5B;
            }
            
            p { 
                font-size: 16px; 
                color: #517185; 
                line-height: 1.6; 
                margin: 0 0 32px; 
            }
            
            strong { color: #1D9E75; }
            
            /* Botón moderno */
            .btn {
                display: inline-block;
                background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 16px;
                font-family: 'Nunito', sans-serif;
                font-weight: 800;
                font-size: 18px;
                box-shadow: 0 8px 16px rgba(59, 130, 246, 0.25);
                transition: all 0.3s ease;
                width: 100%;
            }
            
            .btn:hover { 
                transform: translateY(-2px);
                box-shadow: 0 12px 20px rgba(59, 130, 246, 0.35);
            }
            
            .footer-text {
                margin-top: 24px;
                font-size: 13px;
                color: #88A1B1;
                margin-bottom: 0;
            }
        </style>
    </head>
    <body>
        <div class="blob1"></div>
        <div class="blob2"></div>
        
        <div class="card">
            <div class="icon-container">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            
            <h1>¡Verificación Exitosa!</h1>
            
            <p>Bienvenido/a a <strong>AllergenSmart</strong>.<br>Tu dirección de correo ha sido confirmada correctamente y tu cuenta ya está activa.</p>
            
            <a href="allergensmart://" class="btn">Abrir Aplicación</a>
            
            <p class="footer-text">Si abriste este enlace desde tu computadora, ya puedes cerrar esta ventana y regresar a tu celular.</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/reset-password")
async def reset_password_page():
    """
    Página que se muestra cuando el usuario hace clic en el enlace de
    recuperación de contraseña desde su correo. Le indica que puede
    regresar a la app para establecer su nueva contraseña.
    """
    from fastapi.responses import HTMLResponse
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - AllergenSmart</title>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;800&family=Inter:wght@400;500&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #EEF3FF 0%, #DBEAFE 100%);
                color: #0E3E5B;
                padding: 20px;
                overflow: hidden;
            }
            .blob1, .blob2 {
                position: absolute;
                border-radius: 50%;
                filter: blur(60px);
                z-index: 0;
            }
            .blob1 { width: 300px; height: 300px; background: rgba(59, 130, 246, 0.2); top: -100px; left: -100px; animation: float 6s ease-in-out infinite; }
            .blob2 { width: 400px; height: 400px; background: rgba(99, 102, 241, 0.15); bottom: -150px; right: -100px; animation: float 8s ease-in-out infinite reverse; }
            @keyframes float {
                0% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(20px) scale(1.05); }
                100% { transform: translateY(0px) scale(1); }
            }
            .card {
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.5);
                padding: 50px 40px;
                border-radius: 30px;
                box-shadow: 0 20px 40px rgba(14, 62, 91, 0.08);
                max-width: 420px;
                width: 100%;
                text-align: center;
                z-index: 1;
                transform: translateY(20px);
                opacity: 0;
                animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes slideUp {
                to { transform: translateY(0); opacity: 1; }
            }
            .icon-container {
                width: 90px;
                height: 90px;
                background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
                transform: scale(0);
                animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s forwards;
            }
            @keyframes popIn {
                to { transform: scale(1); }
            }
            h1 { 
                font-family: 'Nunito', sans-serif;
                font-size: 28px; 
                font-weight: 800;
                margin: 0 0 12px; 
                color: #0E3E5B;
            }
            p { 
                font-size: 16px; 
                color: #517185; 
                line-height: 1.6; 
                margin: 0 0 32px; 
            }
            strong { color: #3B82F6; }
            .btn {
                display: inline-block;
                background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 16px;
                font-family: 'Nunito', sans-serif;
                font-weight: 800;
                font-size: 18px;
                box-shadow: 0 8px 16px rgba(59, 130, 246, 0.25);
                transition: all 0.3s ease;
                width: 100%;
            }
            .btn:hover { 
                transform: translateY(-2px);
                box-shadow: 0 12px 20px rgba(59, 130, 246, 0.35);
            }
            .footer-text {
                margin-top: 24px;
                font-size: 13px;
                color: #88A1B1;
                margin-bottom: 0;
            }
        </style>
    </head>
    <body>
        <div class="blob1"></div>
        <div class="blob2"></div>
        <div class="card">
            <div class="icon-container">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
            </div>
            <h1>Restablece tu contraseña</h1>
            <p>Tu solicitud de recuperación fue verificada correctamente. Abre <strong>AllergenSmart</strong> en tu celular e inicia sesión con tu contraseña actual para cambiarla desde tu perfil.</p>
            <a href="allergensmart://" class="btn">Abrir AllergenSmart</a>
            <p class="footer-text">Si abriste este enlace desde tu computadora, simplemente cierra esta ventana y abre la app en tu celular.</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
