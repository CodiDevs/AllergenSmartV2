"""
Endpoint: GET /api/v1/allergens
Retorna el catálogo completo de alérgenos agrupados por categoría.
Es un endpoint público — no requiere autenticación.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.allergen import AllergenCatalogResponse, CategoryResponse, AllergenResponse

router = APIRouter(prefix="/allergens", tags=["Alérgenos"])


@router.get(
    "",
    response_model=AllergenCatalogResponse,
    summary="Obtener catálogo de alérgenos",
    description="Retorna todas las categorías y alérgenos activos. Endpoint público — sin autenticación.",
)
async def get_allergen_catalog(
    db: AsyncSession = Depends(get_db),
) -> AllergenCatalogResponse:
    """
    Catálogo completo de alérgenos.
    El frontend lo carga al iniciar para mostrar los checkboxes de selección.
    """
    # TODO: implementar AllergenRepository y cargar desde BD
    # Por ahora retorna datos de ejemplo para probar la API
    return AllergenCatalogResponse(
        categories=[
            CategoryResponse(
                id="placeholder-1",
                name="Cereales con Gluten",
                icon_emoji="🌾",
                description="Trigo, cebada, centeno, avena y derivados",
                allergens=[
                    AllergenResponse(
                        id="placeholder-a",
                        name="gluten",
                        synonyms=["trigo", "cebada", "centeno", "harina de trigo"],
                        is_active=True,
                    )
                ],
            ),
            CategoryResponse(
                id="placeholder-2",
                name="Lácteos",
                icon_emoji="🥛",
                description="Leche, queso, yogur y derivados lácteos",
                allergens=[
                    AllergenResponse(
                        id="placeholder-b",
                        name="lactosa",
                        synonyms=["leche", "caseína", "suero de leche", "leche en polvo"],
                        is_active=True,
                    )
                ],
            ),
        ]
    )
