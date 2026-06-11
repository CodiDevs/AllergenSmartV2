"""
Normalizador de texto OCR.
Limpia el texto crudo de Vision API y extrae ingredientes y advertencias.
Optimizado para etiquetas en español ecuatoriano.
"""
import re

from unidecode import unidecode

# Frases que anteceden a la lista de ingredientes
_INGREDIENTS_MARKERS = [
    "ingredientes",
    "contiene",
    "elaborado con",
]

# Frases de advertencia (alérgenos por contaminación cruzada)
_WARNING_PATTERNS = [
    r"puede contener[^.;\n]*",
    r"trazas de[^.;\n]*",
    r"elaborado en (?:una )?l[ií]nea[^.;\n]*",
    r"procesad[oa] en[^.;\n]*",
]


def normalize(text: str) -> str:
    """
    Normaliza texto para matching: minúsculas, sin acentos, espacios colapsados.
    'Harina de TRIGO' -> 'harina de trigo'
    """
    if not text:
        return ""
    text = unidecode(text.lower())
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_warnings(ocr_text: str) -> list[str]:
    """
    Extrae frases de advertencia ('puede contener trazas de maní...').
    Retorna las frases tal cual aparecen (normalizadas).
    """
    norm = normalize(ocr_text)
    warnings: list[str] = []
    for pattern in _WARNING_PATTERNS:
        for match in re.findall(pattern, norm):
            cleaned = match.strip(" .,;:")
            if cleaned and cleaned not in warnings:
                warnings.append(cleaned)
    return warnings


def extract_ingredients(ocr_text: str) -> list[str]:
    """
    Extrae la lista de ingredientes del texto OCR.

    Estrategia: busca el marcador 'ingredientes:' y toma el texto que sigue
    hasta el primer marcador de advertencia o fin de línea relevante. Si no
    hay marcador, divide todo el texto por separadores comunes.
    """
    norm = normalize(ocr_text)
    if not norm:
        return []

    segment = norm
    # Corta desde el marcador de ingredientes si existe
    for marker in _INGREDIENTS_MARKERS:
        idx = norm.find(marker)
        if idx != -1:
            segment = norm[idx + len(marker):]
            break

    # Corta antes de las advertencias (no son ingredientes)
    for pattern in (r"puede contener", r"trazas de", r"elaborado en", r"procesad"):
        cut = re.search(pattern, segment)
        if cut:
            segment = segment[: cut.start()]

    segment = segment.lstrip(" :.-")

    # Divide por comas, puntos y comas, saltos de línea
    parts = re.split(r"[,;.\n•·]", segment)
    ingredients: list[str] = []
    for part in parts:
        item = part.strip(" :.-()[]")
        # Filtra ruido: vacíos, números sueltos, fragmentos de 1 char
        if item and len(item) > 1 and not item.isdigit():
            ingredients.append(item)
    return ingredients
