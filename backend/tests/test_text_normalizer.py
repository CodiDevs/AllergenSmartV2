"""
Tests del normalizador de texto OCR.
Lógica pura — sin BD ni red.
"""
from app.services import text_normalizer as tn


def test_normalize_lowercases_and_strips_accents():
    assert tn.normalize("Harina de TRIGO") == "harina de trigo"
    assert tn.normalize("Lecitina de Soya") == "lecitina de soya"
    assert tn.normalize("  múltiples   espacios ") == "multiples espacios"


def test_normalize_empty():
    assert tn.normalize("") == ""
    assert tn.normalize(None) == ""  # type: ignore[arg-type]


def test_extract_ingredients_basic():
    text = "Ingredientes: harina de trigo, azúcar, aceite vegetal, sal."
    result = tn.extract_ingredients(text)
    assert "harina de trigo" in result
    assert "azucar" in result
    assert "aceite vegetal" in result
    assert "sal" in result


def test_extract_ingredients_stops_at_warnings():
    text = "ingredientes: leche, azucar. puede contener trazas de mani."
    result = tn.extract_ingredients(text)
    assert "leche" in result
    assert "azucar" in result
    # La advertencia NO debe colarse como ingrediente
    assert not any("mani" in i for i in result)


def test_extract_warnings_traces():
    text = "ingredientes: harina. puede contener trazas de mani y soya."
    warnings = tn.extract_warnings(text)
    assert any("mani" in w for w in warnings)


def test_extract_ingredients_filters_noise():
    text = "ingredientes: a, 123, leche"
    result = tn.extract_ingredients(text)
    assert "leche" in result
    assert "123" not in result
    assert "a" not in result
