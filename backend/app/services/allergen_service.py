"""
Servicio de alérgenos — sirve el catálogo al frontend.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.allergen_repo import AllergenRepository
from app.schemas.allergen import (
    AllergenCatalogResponse,
    AllergenResponse,
    CategoryResponse,
)


class AllergenService:
    """Lógica de negocio para el catálogo de alérgenos."""

    def __init__(self, session: AsyncSession):
        self.repo = AllergenRepository(session)

    async def get_catalog(self) -> AllergenCatalogResponse:
        """
        Construye el catálogo agrupado por categoría.
        Solo incluye alérgenos activos. Endpoint público.
        """
        categories = await self.repo.get_catalog()
        return AllergenCatalogResponse(
            categories=[
                CategoryResponse(
                    id=str(cat.id),
                    name=cat.name,
                    icon_emoji=cat.icon_emoji,
                    description=cat.description,
                    allergens=[
                        AllergenResponse(
                            id=str(a.id),
                            name=a.name,
                            synonyms=a.synonyms or [],
                            is_active=a.is_active,
                        )
                        for a in cat.allergens
                        if a.is_active
                    ],
                )
                for cat in categories
            ]
        )
