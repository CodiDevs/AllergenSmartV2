"""
Repositorio de productos.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    """Queries sobre la tabla products."""

    def __init__(self, session: AsyncSession):
        super().__init__(Product, session)

    async def get_by_barcode(self, barcode: str) -> Optional[Product]:
        """
        Busca un producto activo (no soft-deleted) por código de barras.
        Retorna None si no existe o fue borrado.
        """
        stmt = select(Product).where(
            Product.barcode == barcode,
            Product.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_verified_by_barcode(self, barcode: str) -> Optional[Product]:
        """
        Cache L1: producto verificado por admin (ingredientes confiables).
        Solo retorna si verified_by_admin = true.
        """
        stmt = select(Product).where(
            Product.barcode == barcode,
            Product.deleted_at.is_(None),
            Product.verified_by_admin.is_(True),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
