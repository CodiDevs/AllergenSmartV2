"""
Repositorio de perfiles de usuario y sus alergias.

SEGURIDAD: todas las queries filtran por user_id (el backend conecta directo
a Postgres, RLS no aplica). Nunca confiar en IDs del cliente: el user_id viene
del JWT verificado.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.allergen import Allergen
from app.models.user import Profile, UserAllergy
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[Profile]):
    """Queries sobre profiles y user_allergies."""

    def __init__(self, session: AsyncSession):
        super().__init__(Profile, session)

    async def get_profile(self, user_id: UUID) -> Optional[Profile]:
        """
        Retorna el perfil con sus alergias cargadas (allergen + category).
        Usado por GET /users/me.
        """
        stmt = (
            select(Profile)
            .where(Profile.id == user_id)
            .options(
                selectinload(Profile.allergies)
                .selectinload(UserAllergy.allergen)
                .selectinload(Allergen.category)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_profile(self, user_id: UUID, fields: dict) -> Optional[Profile]:
        """
        Actualiza campos del perfil (solo los provistos, no None).
        Retorna el perfil actualizado o None si no existe.
        """
        profile = await self.session.get(Profile, user_id)
        if profile is None:
            return None
        for key, value in fields.items():
            if value is not None and hasattr(profile, key):
                setattr(profile, key, value)
        await self.session.flush()
        return await self.get_profile(user_id)

    async def replace_allergies(
        self, user_id: UUID, allergies: list[dict]
    ) -> int:
        """
        Reemplaza TODAS las alergias del usuario (idempotente).
        allergies: [{"allergen_id": UUID, "severity": str}]
        Retorna el número de alergias configuradas.
        """
        # Borra las existentes
        await self.session.execute(
            delete(UserAllergy).where(UserAllergy.user_id == user_id)
        )
        # Inserta las nuevas
        for item in allergies:
            self.session.add(
                UserAllergy(
                    user_id=user_id,
                    allergen_id=item["allergen_id"],
                    severity=item.get("severity", "high"),
                )
            )
        await self.session.flush()
        return len(allergies)

    async def get_user_allergies(self, user_id: UUID) -> list[UserAllergy]:
        """
        Retorna las alergias del usuario con su alérgeno cargado.
        Usado por el motor de detección de escaneo.
        """
        stmt = (
            select(UserAllergy)
            .where(UserAllergy.user_id == user_id)
            .options(selectinload(UserAllergy.allergen))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def is_admin(self, user_id: UUID) -> bool:
        """Retorna True si el perfil tiene is_admin = true."""
        stmt = select(Profile.is_admin).where(Profile.id == user_id)
        result = await self.session.execute(stmt)
        return bool(result.scalar_one_or_none())
