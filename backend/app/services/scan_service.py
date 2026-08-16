"""
Servicio de escaneo — orquesta el flujo completo (la joya del sistema).

Flujo:
  1. Cargar alergias del usuario (desde el JWT, nunca del request).
  2. Resolver ingredientes vía caché 3 niveles (L1/L2/L3).
  3. Detectar alérgenos (fast path → directo → fuzzy + advertencias).
  4. Calcular nivel de alerta (ante duda, advertir).
  5. Guardar en scan_history.
  6. Responder al frontend.
"""
import time
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scan import ScanHistory
from app.repositories.scan_history_repo import ScanHistoryRepository
from app.repositories.user_repo import UserRepository
from app.schemas.common import AlertLevel
from app.schemas.scan import (
    AllergenMatch,
    ProductBrief,
    ScanRequest,
    ScanResponse,
)
from app.services.cache_service import CacheService
from app.services.detection import (
    UserAllergenProfile,
    compute_alert_level,
    detect_allergens,
)
from app.services.text_normalizer import normalize


class ScanService:
    """Lógica de negocio del escaneo de etiquetas."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = UserRepository(session)
        self.scans = ScanHistoryRepository(session)
        self.cache = CacheService(session)

    async def process_scan(self, user_id: UUID, request: ScanRequest) -> ScanResponse:
        """Ejecuta el flujo completo de escaneo y devuelve el resultado."""
        start = time.perf_counter()

        # 1. Cargar alergias del usuario desde la BD
        user_allergies = await self.users.get_user_allergies(user_id)

        COMMON_SYNONYMS = {
            "agua": ["agua", "aqua", "water", "eau", "purified water"],
            "aqua": ["agua", "aqua", "water", "eau", "purified water"],
            "water": ["agua", "aqua", "water", "eau", "purified water"],
            "aspartamo": ["aspartamo", "aspartame", "e951", "e-951"],
            "aspartame": ["aspartamo", "aspartame", "e951", "e-951"],
            "aluminio": ["aluminio", "aluminum", "aluminium"],
            "aluminum": ["aluminio", "aluminum", "aluminium"],
            "aluminium": ["aluminio", "aluminum", "aluminium"],
            "azucar": ["azucar", "sugar", "sucre"],
            "sugar": ["azucar", "sugar", "sucre"],
            "leche": ["leche", "milk", "lait", "lacteos", "dairy", "lactosa", "lactose"],
            "milk": ["leche", "milk", "lait", "lacteos", "dairy", "lactosa", "lactose"],
            "lactosa": ["leche", "milk", "lait", "lacteos", "dairy", "lactosa", "lactose"],
            "lactose": ["leche", "milk", "lait", "lacteos", "dairy", "lactosa", "lactose"],
            "gluten": ["gluten", "trigo", "wheat", "cebada", "barley", "centeno", "rye"],
            "wheat": ["gluten", "trigo", "wheat"],
            "trigo": ["gluten", "trigo", "wheat"],
            "mani": ["mani", "cacahuate", "peanut", "peanuts"],
            "peanut": ["mani", "cacahuate", "peanut", "peanuts"],
            "soja": ["soja", "soya", "soy", "soybean"],
            "soya": ["soja", "soya", "soy", "soybean"],
            "soy": ["soja", "soya", "soy", "soybean"],
            "huevo": ["huevo", "huevos", "egg", "eggs", "albúmina", "albumin"],
            "egg": ["huevo", "huevos", "egg", "eggs"],
            "tartrazina": ["tartrazina", "tartrazine", "e102", "e-102", "yellow 5"],
            "tartrazine": ["tartrazina", "tartrazine", "e102", "e-102", "yellow 5"],
            "glutamato": ["glutamato", "glutamate", "msg", "e621", "e-621"],
            "glutamate": ["glutamato", "glutamate", "msg", "e621", "e-621"],
            "sulfitos": ["sulfitos", "sulfites", "sulfite", "e220", "e221", "e222", "e223", "e224", "e225", "e226", "e227", "e228"],
            "sulfites": ["sulfitos", "sulfites", "sulfite", "e220"],
            "mariscos": ["mariscos", "shellfish", "crustacean", "crustaceos", "camaron", "shrimp", "prawns"],
            "shellfish": ["mariscos", "shellfish", "crustacean", "crustaceos", "camaron", "shrimp"],
            "pescado": ["pescado", "fish", "poisson"],
            "fish": ["pescado", "fish", "poisson"],
            "sesamo": ["sesamo", "sesame", "ajonjoli", "ajonjolí"],
            "sesame": ["sesamo", "sesame", "ajonjoli", "ajonjolí"],
            "ajonjoli": ["sesamo", "sesame", "ajonjoli", "ajonjolí"],
            "nuez": ["nuez", "nueces", "nut", "nuts", "walnut", "tree nuts"],
            "nuts": ["nuez", "nueces", "nut", "nuts", "walnut", "tree nuts"],
            "almendra": ["almendra", "almendras", "almond", "almonds"],
            "almond": ["almendra", "almendras", "almond", "almonds"],
            "mostaza": ["mostaza", "mustard"],
            "mustard": ["mostaza", "mustard"],
            "apio": ["apio", "celery"],
            "celery": ["apio", "celery"],
        }

        def _expand(name: str, raw_syns: list[str]) -> list[str]:
            res = set([normalize(name)] + [normalize(s) for s in raw_syns if s])
            for s in list(res):
                if s in COMMON_SYNONYMS:
                    res.update([normalize(x) for x in COMMON_SYNONYMS[s]])
            return list(res)

        profiles = [
            UserAllergenProfile(
                name=ua.allergen.name,
                severity=_severity(ua.severity),
                synonyms=_expand(ua.allergen.name, ua.allergen.synonyms or []),
                ocr_variants=[normalize(v) for v in (ua.allergen.ocr_variants or [])],
            )
            for ua in user_allergies
            if ua.allergen is not None
        ]

        # 2. Resolver ingredientes (caché 3 niveles — o L0 si es modo manual)
        ocr = await self.cache.resolve(request.image_base64, request.barcode, request.scan_source)

        # 3. Detectar alérgenos
        detected = detect_allergens(profiles, ocr.ingredients, ocr.warnings)

        # 4. Nivel de alerta
        alert_level = AlertLevel(compute_alert_level(detected))
        message = _build_message(alert_level, [d.name for d in detected])

        elapsed_ms = int((time.perf_counter() - start) * 1000)

        # 5. Persistir historial
        allergens_payload = [
            {
                "name": d.name,
                "match_type": d.match_type.value,
                "source_ingredient": d.source_ingredient,
                "severity": d.severity.value,
                "confidence": round(d.confidence, 3),
            }
            for d in detected
        ]
        await self.scans.create(
            ScanHistory(
                user_id=user_id,
                product_id=UUID(ocr.product_id) if ocr.product_id else None,
                barcode=ocr.product_barcode,
                result_status=alert_level.value,
                scan_source=request.scan_source.value,
                app_version=request.app_version,
                detected_allergens=allergens_payload,
                ocr_confidence=ocr.confidence,
                ingredients_found=ocr.ingredients,
                processing_time_ms=elapsed_ms,
                from_cache=ocr.from_cache,
            )
        )

        # 6. Respuesta
        product = None
        if ocr.product_barcode or ocr.product_name:
            product = ProductBrief(
                barcode=ocr.product_barcode,
                name=ocr.product_name,
                brand=ocr.product_brand,
            )

        return ScanResponse(
            success=True,
            alert_level=alert_level,
            message=message,
            confidence=ocr.confidence,
            from_cache=ocr.from_cache,
            processing_time_ms=elapsed_ms,
            product=product,
            detected_text=ocr.text,
            ingredients=ocr.ingredients,
            allergens_found=[
                AllergenMatch(
                    name=d.name,
                    match_type=d.match_type,
                    source_ingredient=d.source_ingredient,
                    severity=d.severity,
                    confidence=round(d.confidence, 3),
                )
                for d in detected
            ],
            warnings=ocr.warnings,
        )

    async def get_history(self, user_id: UUID, limit: int = 20, offset: int = 0) -> dict:
        """Retorna el historial de escaneos paginado del usuario."""
        total, items = await self.scans.get_user_history(user_id, limit, offset)
        return {
            "total": total,
            "items": [
                {
                    "id": str(s.id),
                    "barcode": s.barcode,
                    "result_status": s.result_status,
                    "allergens_found": [a.get("name") for a in (s.detected_allergens or [])],
                    "confidence": s.ocr_confidence,
                    "from_cache": s.from_cache,
                    "scanned_at": s.scanned_at.isoformat() if s.scanned_at else None,
                }
                for s in items
            ],
        }


def _severity(value: str):
    """Convierte el string de severidad de la BD al enum Severity."""
    from app.schemas.common import Severity

    try:
        return Severity(value)
    except ValueError:
        return Severity.HIGH


def _build_message(alert_level: AlertLevel, names: list[str]) -> str:
    """Mensaje legible para el usuario según el nivel de alerta."""
    unique = list(dict.fromkeys(names))
    joined = ", ".join(unique)
    if alert_level == AlertLevel.DANGER:
        return (
            f"⚠️ PELIGRO: Se detectaron los siguientes alérgenos: {joined}. "
            "Este producto NO es seguro para tu perfil."
        )
    if alert_level == AlertLevel.WARNING:
        return (
            f"⚠️ PRECAUCIÓN: posible presencia de {joined}. "
            "Revisa la etiqueta con cuidado antes de consumir."
        )
    return "✅ No se detectaron alérgenos de tu perfil en este producto."
