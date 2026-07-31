"""
Motor de detección de alérgenos — lógica pura, sin BD ni I/O.
Testeable de forma aislada (requisito de SECURITY_GUIDELINES).

Estrategia de 3 niveles por alérgeno (de barato a caro):
  1. Fast path  — lookup de ocr_variants conocidos en el ingrediente (substring).
  2. Direct     — nombre/sinónimo aparece como substring del ingrediente.
  3. Fuzzy      — rapidfuzz.partial_ratio >= umbral (tolera errores de OCR).
Además, las advertencias ('puede contener trazas de...') generan matches
de tipo TRACE/POSSIBLE.
"""
from dataclasses import dataclass

from rapidfuzz import fuzz

from app.schemas.common import MatchType, Severity
from app.services.text_normalizer import normalize

# Umbral de similitud para fuzzy matching (0-100)
FUZZY_THRESHOLD = 85


@dataclass
class DetectedAllergen:
    """Resultado de detección de un alérgeno en un producto."""
    name: str
    match_type: MatchType
    source_ingredient: str
    severity: Severity
    confidence: float


@dataclass
class UserAllergenProfile:
    """Alérgeno del usuario preparado para detección (términos normalizados)."""
    name: str
    severity: Severity
    synonyms: list[str]       # incluye el name; normalizados
    ocr_variants: list[str]   # normalizados


def _match_in_ingredient(
    profile: UserAllergenProfile, ingredient: str
) -> tuple[MatchType, float] | None:
    """Intenta detectar el alérgeno en un ingrediente normalizado. Best-effort."""
    # 1. Fast path: variantes OCR conocidas
    for variant in profile.ocr_variants:
        if variant and variant in ingredient:
            return MatchType.DIRECT, 0.95

    # 2. Directo: sinónimo/nombre como substring
    for term in profile.synonyms:
        if term and term in ingredient:
            return MatchType.DIRECT, 1.0

    # 3. Fuzzy: tolera errores de OCR ('glten' ~ 'gluten') y variaciones cortas ('agua' ~ 'aqua')
    best = 0.0
    for term in profile.synonyms:
        if not term:
            continue
        score = max(fuzz.partial_ratio(term, ingredient), fuzz.ratio(term, ingredient))
        if score > best:
            best = score
    if best >= FUZZY_THRESHOLD or (best >= 75 and len(ingredient) <= 6):
        return MatchType.FUZZY, best / 100.0

    return None


def _match_in_warning(
    profile: UserAllergenProfile, warning: str
) -> float | None:
    """Detecta el alérgeno dentro de una frase de advertencia."""
    for term in profile.synonyms:
        if term and term in warning:
            return 1.0
    best = max(
        (fuzz.partial_ratio(t, warning) for t in profile.synonyms if t),
        default=0.0,
    )
    return best / 100.0 if best >= FUZZY_THRESHOLD else None


def detect_allergens(
    user_allergens: list[UserAllergenProfile],
    ingredients: list[str],
    warnings: list[str],
) -> list[DetectedAllergen]:
    """
    Cruza las alergias del usuario contra los ingredientes y advertencias.
    Retorna un match por alérgeno detectado (el de mayor confianza/peor caso).
    """
    norm_ingredients = [normalize(i) for i in ingredients]
    norm_warnings = [normalize(w) for w in warnings]
    results: list[DetectedAllergen] = []

    for profile in user_allergens:
        found: DetectedAllergen | None = None

        # Buscar en ingredientes (riesgo directo)
        for raw, ing in zip(ingredients, norm_ingredients):
            match = _match_in_ingredient(profile, ing)
            if match:
                match_type, confidence = match
                if found is None or confidence > found.confidence:
                    found = DetectedAllergen(
                        name=profile.name,
                        match_type=match_type,
                        source_ingredient=raw,
                        severity=profile.severity,
                        confidence=confidence,
                    )

        # Si no hubo match directo, buscar en advertencias (trazas)
        if found is None:
            for raw, warn in zip(warnings, norm_warnings):
                conf = _match_in_warning(profile, warn)
                if conf is not None:
                    match_type = (
                        MatchType.TRACE if "traza" in warn else MatchType.POSSIBLE
                    )
                    found = DetectedAllergen(
                        name=profile.name,
                        match_type=match_type,
                        source_ingredient=raw,
                        severity=profile.severity,
                        confidence=conf,
                    )
                    break

        if found:
            results.append(found)

    return results


def compute_alert_level(detected: list[DetectedAllergen]) -> str:
    """
    Deriva el nivel de alerta global del escaneo (principio: ante duda, advertir).
      - danger:  algún match DIRECT/FUZZY en ingredientes con severidad high.
      - warning: hay detecciones pero solo trazas/posibles o severidad menor.
      - safe:    sin detecciones.
    """
    if not detected:
        return "safe"

    direct_types = {MatchType.DIRECT, MatchType.FUZZY}
    for d in detected:
        if d.match_type in direct_types and d.severity == Severity.HIGH:
            return "danger"
    # Match directo pero severidad media/baja, o solo trazas → warning
    return "warning"
