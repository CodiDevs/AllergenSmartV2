r"""
Prueba REAL del pipeline de escaneo sobre una imagen de etiqueta.

Corre Google Vision REAL → normaliza → detecta alérgenos cruzando contra TODO el
catálogo activo (simula un usuario alérgico a todo, para ver qué hay en la etiqueta).

Uso (desde backend/):
    python -m scripts.scan_image                       # usa ../photos/foto1.webp
    python -m scripts.scan_image ruta\a\otra_foto.jpg
"""
import asyncio
import base64
import sys
from pathlib import Path

from app.infrastructure.database import _get_session_factory
from app.infrastructure.vision_client import vision_client
from app.repositories.allergen_repo import AllergenRepository
from app.services import text_normalizer as tn
from app.services.detection import (
    UserAllergenProfile,
    compute_alert_level,
    detect_allergens,
)
from app.schemas.common import Severity

_DEFAULT_PHOTO = Path(__file__).resolve().parents[1] / "photos" / "foto1.webp"


async def main(image_path: Path) -> None:
    if not image_path.exists():
        print(f"[ERROR] No existe la imagen: {image_path}")
        sys.exit(1)

    image_b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
    print(f"Imagen: {image_path.name} ({image_path.stat().st_size // 1024} KB)\n")

    # 1. OCR REAL con Google Vision
    print("Llamando a Google Vision (OCR real)...")
    ocr = await vision_client.extract_text(image_b64)
    text = ocr["text"]
    print(f"  confianza: {ocr['confidence']}")
    print(f"  texto detectado (primeros 400 chars):\n  {text[:400]!r}\n")

    # 2. Normalizar
    ingredients = tn.extract_ingredients(text)
    warnings = tn.extract_warnings(text)
    print(f"Ingredientes extraídos ({len(ingredients)}): {ingredients}")
    print(f"Advertencias: {warnings}\n")

    # 3. Detectar contra todo el catálogo activo
    factory = _get_session_factory()
    async with factory() as session:
        allergens = await AllergenRepository(session).get_active_allergens()
    profiles = [
        UserAllergenProfile(
            name=a.name,
            severity=Severity.HIGH,
            synonyms=[tn.normalize(a.name)] + [tn.normalize(s) for s in (a.synonyms or [])],
            ocr_variants=[tn.normalize(v) for v in (a.ocr_variants or [])],
        )
        for a in allergens
    ]
    detected = detect_allergens(profiles, ingredients, warnings)

    # 4. Resultado
    print("=" * 50)
    print(f"NIVEL DE ALERTA: {compute_alert_level(detected).upper()}")
    if detected:
        print("Alérgenos detectados:")
        for d in detected:
            print(f"  - {d.name} [{d.match_type.value}] en '{d.source_ingredient}' (conf {d.confidence})")
    else:
        print("No se detectaron alérgenos del catálogo en esta etiqueta.")
    print("=" * 50)


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else _DEFAULT_PHOTO
    asyncio.run(main(path))
