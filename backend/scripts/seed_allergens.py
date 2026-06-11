r"""
Seed del catálogo de alérgenos — los 14 alérgenos mayores del estándar
internacional (Anexo II Reglamento UE 1169/2011, basado en Codex Alimentarius),
con sinónimos en español ecuatoriano y variantes OCR comunes.

IDEMPOTENTE: se puede correr varias veces. Hace upsert por nombre (no duplica).

Uso:
    cd backend
    .\.venv\Scripts\Activate.ps1
    python -m scripts.seed_allergens

Requiere DATABASE_URL configurado en .env (Supabase Postgres).
"""
import asyncio

from sqlalchemy import select

from app.infrastructure.database import _get_session_factory
from app.models.allergen import Allergen, AllergenCategory

# (categoria, emoji, descripcion, display_order, [allergens])
# allergen = (name, [synonyms], [ocr_variants])
CATALOG: list[tuple[str, str, str, int, list[tuple[str, list[str], list[str]]]]] = [
    (
        "Cereales con Gluten", "🌾",
        "Trigo, cebada, centeno, avena y derivados", 1,
        [
            ("gluten",
             ["gluten", "trigo", "harina de trigo", "harina", "cebada", "centeno",
              "avena", "malta", "semola", "salvado", "espelta", "almidon de trigo",
              "trigo duro", "couscous"],
             ["glten", "g1uten", "gluen", "tri9o", "harlna"]),
        ],
    ),
    (
        "Lácteos", "🥛",
        "Leche y derivados (lactosa, caseína, suero)", 2,
        [
            ("lactosa",
             ["lactosa", "leche", "leche en polvo", "leche entera", "caseina",
              "caseinato", "suero de leche", "suero lacteo", "crema de leche",
              "mantequilla", "queso", "yogurt", "cuajada", "nata"],
             ["1actosa", "lactose", "1eche", "casetna"]),
        ],
    ),
    (
        "Huevos", "🥚",
        "Huevo y derivados (albúmina, ovoproductos)", 3,
        [
            ("huevo",
             ["huevo", "huevos", "albumina", "clara de huevo", "yema de huevo",
              "ovoalbumina", "lecitina de huevo", "ovoproducto"],
             ["hvevo", "huev0", "a1bumina"]),
        ],
    ),
    (
        "Pescado", "🐟",
        "Pescado y derivados", 4,
        [
            ("pescado",
             ["pescado", "atun", "bonito", "sardina", "anchoa", "merluza",
              "bacalao", "aceite de pescado", "gelatina de pescado", "surimi"],
             ["pescad0", "atvn", "sardlna"]),
        ],
    ),
    (
        "Crustáceos", "🦐",
        "Camarón, langostino, cangrejo y similares", 5,
        [
            ("crustaceos",
             ["crustaceos", "camaron", "camarones", "langostino", "langosta",
              "cangrejo", "gamba", "krill"],
             ["camar0n", "crustace0s"]),
        ],
    ),
    (
        "Moluscos", "🦪",
        "Almeja, mejillón, calamar, concha y similares", 6,
        [
            ("moluscos",
             ["moluscos", "almeja", "mejillon", "calamar", "pulpo", "ostra",
              "concha", "caracol", "vieira", "pota"],
             ["mo1uscos", "meji11on", "ca1amar"]),
        ],
    ),
    (
        "Frutos Secos", "🌰",
        "Almendra, nuez, avellana, anacardo, pistacho", 7,
        [
            ("frutos secos",
             ["frutos secos", "almendra", "almendras", "nuez", "nueces",
              "avellana", "anacardo", "marañon", "pistacho", "castaña",
              "nuez de macadamia", "nuez de brasil", "pecana"],
             ["a1mendra", "frvtos secos", "ave11ana"]),
        ],
    ),
    (
        "Maní", "🥜",
        "Cacahuate y derivados", 8,
        [
            ("mani",
             ["mani", "cacahuate", "cacahuete", "aceite de mani",
              "mantequilla de mani", "pasta de mani"],
             ["man1", "manl", "cacahvate"]),
        ],
    ),
    (
        "Soya", "🫘",
        "Soja y derivados (lecitina, proteína de soya)", 9,
        [
            ("soya",
             ["soya", "soja", "lecitina de soya", "lecitina de soja",
              "proteina de soya", "aceite de soya", "salsa de soya", "tofu",
              "edamame", "harina de soya"],
             ["s0ya", "s0ja", "1ecitina de soya"]),
        ],
    ),
    (
        "Sésamo", "🌱",
        "Ajonjolí y derivados", 10,
        [
            ("sesamo",
             ["sesamo", "ajonjoli", "semilla de sesamo", "tahini",
              "aceite de sesamo"],
             ["sesam0", "aj0njoli"]),
        ],
    ),
    (
        "Sulfitos", "🧪",
        "Dióxido de azufre y sulfitos (conservantes)", 11,
        [
            ("sulfitos",
             ["sulfitos", "sulfito", "dioxido de azufre", "anhidrido sulfuroso",
              "metabisulfito", "metabisulfito de sodio", "bisulfito", "e220",
              "e221", "e222", "e223", "e224", "e226", "e227", "e228"],
             ["su1fitos", "metabisu1fito"]),
        ],
    ),
    (
        "Mostaza", "🟡",
        "Mostaza y derivados", 12,
        [
            ("mostaza",
             ["mostaza", "semilla de mostaza", "harina de mostaza",
              "mostaza dijon"],
             ["m0staza", "mostaze"]),
        ],
    ),
    (
        "Apio", "🥬",
        "Apio y derivados", 13,
        [
            ("apio",
             ["apio", "tallo de apio", "raiz de apio", "semilla de apio",
              "sal de apio"],
             ["ap1o", "api0"]),
        ],
    ),
    (
        "Altramuz", "🌼",
        "Lupino y derivados", 14,
        [
            ("altramuz",
             ["altramuz", "lupino", "lupin", "harina de altramuz",
              "chocho", "tarwi"],
             ["a1tramuz", "1upino"]),
        ],
    ),
]


async def seed() -> None:
    session_factory = _get_session_factory()
    async with session_factory() as session:
        created_cats = created_allergens = updated = 0
        for cat_name, emoji, desc, order, allergens in CATALOG:
            # Upsert categoría
            cat = (
                await session.execute(
                    select(AllergenCategory).where(AllergenCategory.name == cat_name)
                )
            ).scalar_one_or_none()
            if cat is None:
                cat = AllergenCategory(
                    name=cat_name, icon_emoji=emoji,
                    description=desc, display_order=order,
                )
                session.add(cat)
                await session.flush()
                created_cats += 1
            else:
                cat.icon_emoji, cat.description, cat.display_order = emoji, desc, order

            # Upsert alérgenos
            for name, synonyms, ocr_variants in allergens:
                allergen = (
                    await session.execute(
                        select(Allergen).where(Allergen.name == name)
                    )
                ).scalar_one_or_none()
                if allergen is None:
                    session.add(Allergen(
                        category_id=cat.id, name=name,
                        synonyms=synonyms, ocr_variants=ocr_variants,
                        is_active=True,
                    ))
                    created_allergens += 1
                else:
                    allergen.category_id = cat.id
                    allergen.synonyms = synonyms
                    allergen.ocr_variants = ocr_variants
                    allergen.is_active = True
                    updated += 1

        await session.commit()
        print(f"[SEED] Categorías nuevas: {created_cats} | "
              f"Alérgenos nuevos: {created_allergens} | Actualizados: {updated}")


if __name__ == "__main__":
    asyncio.run(seed())
