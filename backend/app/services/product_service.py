"""
Servicio de productos — búsqueda con fallback a Open Food Facts y reportes (crowdsourcing).
"""
import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ProductNotFoundException
from app.models.product import Product
from app.models.report import ProductReport
from app.repositories.product_repo import ProductRepository
from app.repositories.report_repo import ReportRepository
from app.schemas.common import ReportStatus
from app.schemas.product import BarcodeProductResult, ProductResponse
from app.schemas.report import ReportResponse
from app.services.open_food_facts_service import OpenFoodFactsService

logger = logging.getLogger(__name__)


class ProductService:
    """Lógica de negocio para productos y reportes."""

    def __init__(self, session: AsyncSession):
        self.products = ProductRepository(session)
        self.reports = ReportRepository(session)
        self.session = session

    async def get_by_barcode(self, barcode: str) -> ProductResponse:
        """
        Busca un producto por barcode en la BD local.
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
            ingredients_text=product.ingredients_raw,
            verified_by_admin=product.verified_by_admin,
            country_origin=product.country_origin,
            image_url=product.image_url,
        )

    async def get_by_barcode_with_off_fallback(self, barcode: str) -> BarcodeProductResult:
        """
        Búsqueda híbrida por código de barras:
          1. Busca en nuestra BD (Supabase/PostgreSQL).
          2. Si no está → consulta Open Food Facts.
          3. Si OFF lo tiene → lo guarda en nuestra BD (caché) y retorna.
          4. Si ninguno lo tiene → lanza ProductNotFoundException (HTTP 404)
             con action_required='SCAN_LABEL' para que el frontend redirija al OCR.

        Returns:
            BarcodeProductResult con from_cache=True si vino de nuestra BD,
            from_cache=False si vino de Open Food Facts.
        Raises:
            ProductNotFoundException: cuando ni la BD ni OFF tienen el producto.
        """
        # ── L1: Caché local (nuestra BD) ─────────────────────────────────────
        product = await self.products.get_by_barcode(barcode)
        if product is not None:
            logger.info("[ProductService] Barcode '%s' encontrado en BD local (caché L1)", barcode)
            return BarcodeProductResult(
                id=str(product.id),
                barcode=product.barcode,
                name=product.name,
                brand=product.brand,
                ingredients_text=product.ingredients_raw,
                ingredients_array=product.ingredients_array or [],
                allergens_tags=[],  # Los tags de OFF no se guardan en la BD local actualmente
                verified_by_admin=product.verified_by_admin,
                from_cache=True,
                image_url=product.image_url,
            )

        # ── L2: Open Food Facts (fuente externa pública) ──────────────────────
        logger.info("[ProductService] Barcode '%s' no está en BD local, consultando OFF...", barcode)
        off = OpenFoodFactsService()
        off_product = await off.fetch_product(barcode)

        if off_product is None:
            # Ninguna fuente conoce este producto → redirigir al OCR
            logger.info("[ProductService] Barcode '%s' no encontrado en OFF. Lanzando 404.", barcode)
            raise ProductNotFoundException(barcode=barcode)

        # ── Guardar en nuestra BD para futuras consultas (caché L2→L1) ───────
        try:
            new_product = Product(
                barcode=off_product.barcode,
                name=off_product.name,
                brand=off_product.brand,
                ingredients_raw=off_product.ingredients_text,
                ingredients_array=[],   # Se podría parsear ingredients_text en el futuro
                image_url=off_product.image_url,
                verified_by_admin=False,    # No verificado por admin, viene de OFF
                country_origin="EC",        # Default; OFF no siempre indica el país de venta
            )
            self.session.add(new_product)
            await self.session.commit()
            await self.session.refresh(new_product)
            cached_id = str(new_product.id)
            logger.info("[ProductService] Producto OFF guardado en BD: id=%s barcode=%s", cached_id, barcode)
        except Exception as exc:
            # Si falla la escritura (ej. UNIQUE constraint race condition), no es crítico.
            # Retornamos igualmente los datos de OFF sin ID de BD.
            await self.session.rollback()
            logger.warning("[ProductService] No se pudo cachear el producto de OFF: %s", exc)
            cached_id = "off_temp"

        return BarcodeProductResult(
            id=cached_id,
            barcode=off_product.barcode,
            name=off_product.name,
            brand=off_product.brand,
            ingredients_text=off_product.ingredients_text,
            ingredients_array=[],
            allergens_tags=off_product.allergens_tags,
            verified_by_admin=False,
            from_cache=False,
            image_url=off_product.image_url,
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
