"""
Endpoint: GET /api/v1/allergens
Retorna el catálogo completo de alérgenos agrupados por categoría.
Es un endpoint público — no requiere autenticación.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.allergen import AllergenCatalogResponse
from app.services.allergen_service import AllergenService

router = APIRouter(prefix="/allergens", tags=["Alérgenos"])


@router.get(
    "",
    response_model=AllergenCatalogResponse,
    summary="Obtener catálogo de alérgenos",
    description="Retorna todas las categorías y alérgenos activos desde la BD. Endpoint público — sin autenticación.",
)
async def get_allergen_catalog(
    db: AsyncSession = Depends(get_db),
) -> AllergenCatalogResponse:
    """
    Catálogo completo de alérgenos.
    El frontend lo carga al iniciar para mostrar los checkboxes de selección.
    """
    return await AllergenService(db).get_catalog()
