"""
Endpoints: GET /api/v1/users/me, PUT /api/v1/users/me, PUT /api/v1/users/me/allergies,
GET /api/v1/users/me/scans. Todos requieren autenticación JWT.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.schemas.user import UserProfileResponse, UserProfileUpdate, UserAllergiesUpdate
from app.services.scan_service import ScanService
from app.services.user_service import UserService

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
    return await UserService(db).get_profile(UUID(current_user["user_id"]))


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
    return await UserService(db).update_profile(UUID(current_user["user_id"]), body)


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
    count = await UserService(db).replace_allergies(UUID(current_user["user_id"]), body)
    return {"message": f"Alergias actualizadas: {count} configuradas."}


@router.get(
    "/me/scans",
    response_model=dict,
    summary="Historial de escaneos",
)
async def get_my_scan_history(
    # Acotado para evitar lecturas masivas / DoS (límite máximo de página = 100).
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Retorna el historial de escaneos paginado."""
    return await ScanService(db).get_history(
        UUID(current_user["user_id"]), limit=limit, offset=offset
    )
