"""
Servicio de caché OCR — sistema de 3 niveles.

  L1 (products.verified_by_admin): ingredientes confiables, ~5ms, $0.
  L2 (ocr_cache, TTL 30d):         OCR ya procesado, ~5ms, $0.
  L3 (Google Vision API):          OCR real, ~1500ms, ~$0.0015/img. Guarda en L2.

Mientras Vision esté mockeado, L3 devuelve texto simulado (ver vision_client.py).
"""
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.vision_client import vision_client
from app.repositories.cache_repo import CacheRepository
from app.repositories.product_repo import ProductRepository
from app.services import text_normalizer


@dataclass
class OCRResult:
    """Resultado del pipeline OCR/caché, listo para detección."""
    text: str
    ingredients: list[str]
    warnings: list[str]
    confidence: float
    from_cache: bool
    cache_level: str  # 'L1' | 'L2' | 'L3'
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_brand: Optional[str] = None
    product_barcode: Optional[str] = None


class CacheService:
    """Resuelve el texto/ingredientes de un escaneo usando el caché de 3 niveles."""

    def __init__(self, session: AsyncSession):
        self.products = ProductRepository(session)
        self.cache = CacheRepository(session)

    async def resolve(self, image_base64: str, barcode: Optional[str]) -> OCRResult:
        """
        Devuelve ingredientes/advertencias del producto, usando el nivel de
        caché más barato disponible. Solo cachea (L2) si hay barcode.
        """
        # --- L1: producto verificado por admin ---
        if barcode:
            product = await self.products.get_verified_by_barcode(barcode)
            if product:
                return OCRResult(
                    text=product.ingredients_raw or "",
                    ingredients=product.ingredients_array or [],
                    warnings=[],
                    confidence=1.0,
                    from_cache=True,
                    cache_level="L1",
                    product_id=str(product.id),
                    product_name=product.name,
                    product_brand=product.brand,
                    product_barcode=product.barcode,
                )

            # --- L2: caché OCR válido ---
            cached = await self.cache.get_valid_by_barcode(barcode)
            if cached:
                return OCRResult(
                    text=cached.ocr_text or "",
                    ingredients=cached.ingredients_extracted or [],
                    warnings=cached.warnings_extracted or [],
                    confidence=cached.ocr_confidence or 0.0,
                    from_cache=True,
                    cache_level="L2",
                    product_barcode=barcode,
                )

        # --- L3: Vision API (mock hasta tener API key) ---
        ocr = await vision_client.extract_text(image_base64)
        text = ocr.get("text", "")
        confidence = ocr.get("confidence", 0.0)
        ingredients = text_normalizer.extract_ingredients(text)
        warnings = text_normalizer.extract_warnings(text)

        # Guarda en L2 para próximos escaneos del mismo barcode
        if barcode:
            await self.cache.upsert(
                barcode=barcode,
                ocr_text=text,
                ingredients=ingredients,
                warnings=warnings,
                confidence=confidence,
            )

        return OCRResult(
            text=text,
            ingredients=ingredients,
            warnings=warnings,
            confidence=confidence,
            from_cache=False,
            cache_level="L3",
            product_barcode=barcode,
        )
