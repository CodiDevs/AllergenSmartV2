"""
Repositorio del caché OCR (Cache L2).
Indexado por barcode con TTL de 30 días.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cache import OCRCache
from app.repositories.base import BaseRepository


class CacheRepository(BaseRepository[OCRCache]):
    """Queries sobre la tabla ocr_cache."""

    def __init__(self, session: AsyncSession):
        super().__init__(OCRCache, session)

    async def get_valid_by_barcode(self, barcode: str) -> Optional[OCRCache]:
        """
        Retorna el caché del barcode SOLO si no ha expirado.
        Cache L2: evita re-llamar a Vision API.
        """
        stmt = select(OCRCache).where(
            OCRCache.barcode == barcode,
            OCRCache.expires_at > datetime.utcnow(),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(
        self,
        barcode: str,
        ocr_text: str,
        ingredients: list[str],
        warnings: list[str],
        confidence: Optional[float],
    ) -> OCRCache:
        """
        Inserta o actualiza el caché para un barcode.
        Refresca expires_at (nuevo TTL de 30 días via default del modelo).
        """
        existing = await self.session.execute(
            select(OCRCache).where(OCRCache.barcode == barcode)
        )
        entry = existing.scalar_one_or_none()
        if entry is None:
            entry = OCRCache(barcode=barcode)
            self.session.add(entry)
        entry.ocr_text = ocr_text
        entry.ingredients_extracted = ingredients
        entry.warnings_extracted = warnings
        entry.ocr_confidence = confidence
        await self.session.flush()
        return entry
