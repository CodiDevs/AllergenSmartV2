"""
Tests de integración del catálogo de alérgenos (lectura contra Supabase real).
Valida que el seed esté cargado y que el servicio lo arme correctamente.
"""
import pytest

from app.services.allergen_service import AllergenService


@pytest.mark.integration
async def test_catalog_loads_from_db(db_session):
    catalog = await AllergenService(db_session).get_catalog()
    assert len(catalog.categories) >= 1


@pytest.mark.integration
async def test_catalog_has_14_major_allergens(db_session):
    catalog = await AllergenService(db_session).get_catalog()
    total = sum(len(c.allergens) for c in catalog.categories)
    assert total >= 14


@pytest.mark.integration
async def test_catalog_contains_gluten_with_synonyms(db_session):
    catalog = await AllergenService(db_session).get_catalog()
    allergens = {a.name: a for c in catalog.categories for a in c.allergens}
    assert "gluten" in allergens
    assert "trigo" in allergens["gluten"].synonyms
