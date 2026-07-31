"""
Servicio Open Food Facts (OFF) — consulta la base de datos pública de productos.

Flujo:
  1. GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
  2. Si status == 1 → extrae product_name, ingredients_text y allergens_tags.
  3. Si status == 0 o error de red → retorna None (el caller decide qué hacer).

Usa httpx.AsyncClient para no bloquear el event loop de FastAPI.
Timeout de 5 segundos para no degradar la experiencia del usuario si OFF está lento.
"""
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

OFF_BASE_URL = "https://world.openfoodfacts.org/api/v2/product"
REQUEST_TIMEOUT_SECONDS = 5.0


@dataclass
class OFFProduct:
    """Datos extraídos de Open Food Facts para un código de barras."""
    barcode: str
    name: Optional[str]
    brand: Optional[str]
    ingredients_text: Optional[str]
    allergens_tags: list[str]
    image_url: Optional[str]


class OpenFoodFactsService:
    """Cliente asíncrono para la API pública de Open Food Facts."""

    async def fetch_product(self, barcode: str) -> Optional[OFFProduct]:
        """
        Busca un producto en Open Food Facts por código de barras.

        Returns:
            OFFProduct si se encuentra (status == 1).
            None si no existe (status == 0), si el barcode no es válido,
            o si hay un error de red/timeout.
        """
        url = f"{OFF_BASE_URL}/{barcode}.json"

        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.get(
                    url,
                    headers={"User-Agent": "AllergenSmart/2.0 (contacto@allergensmart.app)"},
                )

            if response.status_code != 200:
                logger.warning(
                    "[OFF] Respuesta HTTP %s para barcode '%s'",
                    response.status_code,
                    barcode,
                )
                return None

            data = response.json()

            # OFF usa status=1 para encontrado, status=0 para no encontrado
            if data.get("status") != 1:
                logger.info("[OFF] Producto no encontrado en OFF para barcode '%s'", barcode)
                return None

            product = data.get("product", {})

            # Extraer campos relevantes — OFF puede no tener todos
            name = (
                product.get("product_name_es")
                or product.get("product_name")
                or None
            )
            brand = product.get("brands") or None
            ingredients_text = product.get("ingredients_text_es") or product.get("ingredients_text") or None
            image_url = product.get("image_front_url") or product.get("image_url") or None

            # allergens_tags tiene formato "en:milk", "en:gluten" — normalizamos a solo el nombre
            raw_allergen_tags: list[str] = product.get("allergens_tags") or []
            allergens_tags = [tag.split(":")[-1] for tag in raw_allergen_tags]

            logger.info(
                "[OFF] Producto encontrado: '%s' (barcode: %s, alérgenos: %s)",
                name,
                barcode,
                allergens_tags,
            )

            return OFFProduct(
                barcode=barcode,
                name=name,
                brand=brand,
                ingredients_text=ingredients_text,
                allergens_tags=allergens_tags,
                image_url=image_url,
            )

        except httpx.TimeoutException:
            logger.warning("[OFF] Timeout consultando barcode '%s' (>%ss)", barcode, REQUEST_TIMEOUT_SECONDS)
            return None
        except httpx.RequestError as exc:
            logger.error("[OFF] Error de red consultando barcode '%s': %s", barcode, exc)
            return None
        except Exception as exc:
            logger.error("[OFF] Error inesperado consultando barcode '%s': %s", barcode, exc)
            return None
