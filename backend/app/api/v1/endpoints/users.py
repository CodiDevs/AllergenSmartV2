"""
Endpoints: GET /api/v1/users/me, PUT /api/v1/users/me, PUT /api/v1/users/me/allergies
Requieren autenticación JWT.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.schemas.user import UserProfileResponse, UserProfileUpdate, UserAllergiesUpdate

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Obtener perfil del usuario autenticado",
)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> UserProfileResponse:
    """Retorna el perfil completo del usuario con sus alergias configuradas."""
    # TODO: implementar UserRepository
    return UserProfileResponse(
        id=current_user["user_id"],
        full_name="",
        city="Manta",
        language="es-EC",
        notifications_enabled=True,
        is_admin=False,
        allergies=[],
    )


@router.put(
    "/me",
    response_model=UserProfileResponse,
    summary="Actualizar perfil del usuario",
)
async def update_my_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> UserProfileResponse:
    """Actualiza los campos del perfil (nombre, ciudad, idioma, notificaciones)."""
    # TODO: implementar UserService.update_profile()
    return UserProfileResponse(
        id=current_user["user_id"],
        full_name=body.full_name or "",
        city=body.city or "Manta",
        language=body.language or "es-EC",
        notifications_enabled=body.notifications_enabled if body.notifications_enabled is not None else True,
        allergies=[],
    )


@router.put(
    "/me/allergies",
    response_model=dict,
    summary="Actualizar restricciones alimentarias",
    description="Reemplaza TODAS las alergias del usuario (operación idempotente).",
)
async def update_my_allergies(
    body: UserAllergiesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Reemplaza las alergias del usuario con la nueva lista completa."""
    # TODO: implementar UserService.replace_allergies()
    return {"message": f"Alergias actualizadas: {len(body.allergies)} configuradas."}


@router.get(
    "/me/scans",
    response_model=dict,
    summary="Historial de escaneos",
)
async def get_my_scan_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Retorna el historial de escaneos paginado."""
    # TODO: implementar ScanHistoryRepository.get_user_history()
    return {"total": 0, "items": []}
