"""
Endpoint: GET /api/v1/products/{barcode}
Público — busca un producto por código de barras.
Flujo híbrido: BD local → Open Food Facts → 404 (redirigir a OCR).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.product import BarcodeProductResult
from app.schemas.error import ErrorResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Productos"])


@router.get(
    "/{barcode}",
    response_model=BarcodeProductResult,
    responses={404: {"model": ErrorResponse}},
    summary="Buscar producto por código de barras (híbrido: BD local + Open Food Facts)",
    description=(
        "Busca el producto primero en la base de datos local. "
        "Si no existe, consulta Open Food Facts y lo cachea localmente. "
        "Si tampoco está en OFF, retorna **404** con `action_required: SCAN_LABEL` "
        "para que el cliente redirija al escáner OCR."
    ),
)
async def get_product_by_barcode(
    barcode: str,
    db: AsyncSession = Depends(get_db),
) -> BarcodeProductResult:
    """
    Lookup híbrido de producto por código de barras.
    No requiere autenticación — endpoint público.
    """
    return await ProductService(db).get_by_barcode_with_off_fallback(barcode)
