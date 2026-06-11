"""
Endpoint: GET /api/v1/products/{barcode}
Público — busca un producto por código de barras.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.product import ProductResponse
from app.schemas.error import ErrorResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Productos"])


@router.get(
    "/{barcode}",
    response_model=ProductResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Buscar producto por código de barras",
)
async def get_product_by_barcode(
    barcode: str,
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Busca un producto en el catálogo por su código de barras. Endpoint público."""
    return await ProductService(db).get_by_barcode(barcode)
