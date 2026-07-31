"""
Tests de integración de productos (lectura contra Supabase real).
"""
import pytest

from app.core.exceptions import ProductNotFoundException
from app.services.product_service import ProductService


@pytest.mark.integration
async def test_nonexistent_barcode_raises_not_found(db_session):
    service = ProductService(db_session)
    with pytest.raises(ProductNotFoundException):
        await service.get_by_barcode("0000000000000-inexistente")
