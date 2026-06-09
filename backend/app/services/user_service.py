"""
Servicio de usuario — perfil y alergias.
"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UserNotFoundException
from app.repositories.user_repo import UserRepository
from app.schemas.common import Severity
from app.schemas.user import (
    UserAllergiesUpdate,
    UserAllergyItem,
    UserProfileResponse,
    UserProfileUpdate,
)


class UserService:
    """Lógica de negocio para perfiles de usuario."""

    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)

    def _to_response(self, profile) -> UserProfileResponse:
        """Mapea un Profile (con alergias cargadas) al schema de respuesta."""
        allergies = []
        for ua in profile.allergies:
            allergen = ua.allergen
            allergies.append(
                UserAllergyItem(
                    allergen_id=str(ua.allergen_id),
                    allergen_name=allergen.name if allergen else None,
                    category_name=(
                        allergen.category.name
                        if allergen and allergen.category
                        else None
                    ),
                    severity=Severity(ua.severity),
                )
            )
        return UserProfileResponse(
            id=str(profile.id),
            full_name=profile.full_name,
            city=profile.city,
            language=profile.language,
            notifications_enabled=profile.notifications_enabled,
            is_admin=profile.is_admin,
            allergies=allergies,
        )

    async def get_profile(self, user_id: UUID) -> UserProfileResponse:
        """Retorna el perfil completo. Lanza UserNotFoundException si no existe."""
        profile = await self.repo.get_profile(user_id)
        if profile is None:
            raise UserNotFoundException(user_id=str(user_id))
        return self._to_response(profile)

    async def update_profile(
        self, user_id: UUID, data: UserProfileUpdate
    ) -> UserProfileResponse:
        """Actualiza campos del perfil (solo los provistos)."""
        updated = await self.repo.update_profile(
            user_id, data.model_dump(exclude_unset=True)
        )
        if updated is None:
            raise UserNotFoundException(user_id=str(user_id))
        return self._to_response(updated)

    async def replace_allergies(
        self, user_id: UUID, data: UserAllergiesUpdate
    ) -> int:
        """
        Reemplaza todas las alergias del usuario (idempotente).
        Retorna el número de alergias configuradas.
        """
        allergies = [
            {"allergen_id": UUID(item.allergen_id), "severity": item.severity.value}
            for item in data.allergies
        ]
        return await self.repo.replace_allergies(user_id, allergies)
