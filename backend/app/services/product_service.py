"""
Servicio de productos — búsqueda y reportes (crowdsourcing).
"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ProductNotFoundException
from app.models.report import ProductReport
from app.repositories.product_repo import ProductRepository
from app.repositories.report_repo import ReportRepository
from app.schemas.common import ReportStatus
from app.schemas.product import ProductResponse
from app.schemas.report import ReportResponse


class ProductService:
    """Lógica de negocio para productos y reportes."""

    def __init__(self, session: AsyncSession):
        self.products = ProductRepository(session)
        self.reports = ReportRepository(session)

    async def get_by_barcode(self, barcode: str) -> ProductResponse:
        """
        Busca un producto por barcode.
        Lanza ProductNotFoundException (404) si no existe.
        """
        product = await self.products.get_by_barcode(barcode)
        if product is None:
            raise ProductNotFoundException(barcode=barcode)
        return ProductResponse(
            id=str(product.id),
            barcode=product.barcode,
            name=product.name,
            brand=product.brand,
            ingredients_array=product.ingredients_array or [],
            verified_by_admin=product.verified_by_admin,
            country_origin=product.country_origin,
            image_url=product.image_url,
        )

    async def create_report(
        self,
        user_id: UUID,
        barcode: str | None,
        notes: str | None,
        photo_url: str | None,
    ) -> ReportResponse:
        """
        Crea un reporte de producto (crowdsourcing). Estado inicial: pending.
        photo_url ya viene subido a Storage (o None si no hubo foto).
        """
        report = ProductReport(
            reported_by=user_id,
            barcode=barcode,
            notes=notes,
            photo_url=photo_url,
            status=ReportStatus.PENDING.value,
        )
        saved = await self.reports.create(report)
        return ReportResponse(
            id=str(saved.id),
            status=ReportStatus.PENDING,
            message="Gracias por tu reporte. Será revisado por nuestro equipo.",
        )
