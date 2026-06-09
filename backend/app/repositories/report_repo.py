"""
Repositorio de reportes de productos (crowdsourcing).
"""
from app.models.report import ProductReport
from app.repositories.base import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession


class ReportRepository(BaseRepository[ProductReport]):
    """Queries sobre la tabla product_reports."""

    def __init__(self, session: AsyncSession):
        super().__init__(ProductReport, session)

    async def create(self, report: ProductReport) -> ProductReport:
        """Persiste un nuevo reporte de producto."""
        return await self.add(report)
