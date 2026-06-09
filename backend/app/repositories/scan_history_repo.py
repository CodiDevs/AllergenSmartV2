"""
Repositorio del historial de escaneos.
"""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scan import ScanHistory
from app.repositories.base import BaseRepository


class ScanHistoryRepository(BaseRepository[ScanHistory]):
    """Queries sobre la tabla scan_history."""

    def __init__(self, session: AsyncSession):
        super().__init__(ScanHistory, session)

    async def create(self, scan: ScanHistory) -> ScanHistory:
        """Persiste un nuevo registro de escaneo."""
        return await self.add(scan)

    async def get_user_history(
        self, user_id: UUID, limit: int = 20, offset: int = 0
    ) -> tuple[int, list[ScanHistory]]:
        """
        Retorna (total, items) del historial del usuario, paginado y
        ordenado por fecha descendente. SEGURIDAD: filtra por user_id.
        """
        total_stmt = (
            select(func.count())
            .select_from(ScanHistory)
            .where(ScanHistory.user_id == user_id)
        )
        total = (await self.session.execute(total_stmt)).scalar_one()

        items_stmt = (
            select(ScanHistory)
            .where(ScanHistory.user_id == user_id)
            .order_by(ScanHistory.scanned_at.desc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self.session.execute(items_stmt)).scalars().all())
        return total, items
