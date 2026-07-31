"""
Repositorio de alérgenos y categorías.
Sirve el catálogo (endpoint público) y alimenta el motor de detección.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.allergen import Allergen, AllergenCategory
from app.repositories.base import BaseRepository


class AllergenRepository(BaseRepository[Allergen]):
    """Queries sobre allergens y allergen_categories."""

    def __init__(self, session: AsyncSession):
        super().__init__(Allergen, session)

    async def get_catalog(self) -> list[AllergenCategory]:
        """
        Retorna todas las categorías con sus alérgenos activos cargados.
        Usado por GET /allergens (el frontend lo carga al arrancar).
        """
        stmt = (
            select(AllergenCategory)
            .options(selectinload(AllergenCategory.allergens))
            .order_by(AllergenCategory.display_order, AllergenCategory.name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_active_allergens(self) -> list[Allergen]:
        """
        Retorna todos los alérgenos activos (is_active = true).
        Alimenta el motor de detección de escaneo.
        """
        stmt = select(Allergen).where(Allergen.is_active.is_(True))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
