"""
Tests del motor de detección de alérgenos.
Lógica pura — sin BD ni red. Cubre fast path, directo, fuzzy y advertencias.
"""
from app.schemas.common import MatchType, Severity
from app.services.detection import (
    UserAllergenProfile,
    compute_alert_level,
    detect_allergens,
)


def _gluten_profile(severity=Severity.HIGH) -> UserAllergenProfile:
    return UserAllergenProfile(
        name="gluten",
        severity=severity,
        synonyms=["gluten", "trigo", "harina de trigo", "cebada"],
        ocr_variants=["glten", "g1uten"],
    )


def test_direct_match():
    detected = detect_allergens(
        [_gluten_profile()],
        ingredients=["harina de trigo", "azucar"],
        warnings=[],
    )
    assert len(detected) == 1
    assert detected[0].name == "gluten"
    assert detected[0].match_type == MatchType.DIRECT
    assert detected[0].confidence == 1.0


def test_ocr_variant_fast_path():
    detected = detect_allergens(
        [_gluten_profile()],
        ingredients=["contiene glten procesado"],
        warnings=[],
    )
    assert len(detected) == 1
    assert detected[0].match_type == MatchType.DIRECT


def test_fuzzy_match_tolerates_ocr_error():
    detected = detect_allergens(
        [_gluten_profile()],
        ingredients=["harina de triqo"],  # 'g'->'q' error de OCR
        warnings=[],
    )
    assert len(detected) == 1
    assert detected[0].match_type == MatchType.FUZZY
    assert detected[0].confidence < 1.0


def test_no_match_returns_empty():
    detected = detect_allergens(
        [_gluten_profile()],
        ingredients=["agua", "sal", "azucar"],
        warnings=[],
    )
    assert detected == []


def test_warning_produces_trace_match():
    detected = detect_allergens(
        [_gluten_profile()],
        ingredients=["agua", "sal"],
        warnings=["puede contener trazas de trigo"],
    )
    assert len(detected) == 1
    assert detected[0].match_type == MatchType.TRACE


def test_alert_level_danger_for_high_direct():
    detected = detect_allergens(
        [_gluten_profile(Severity.HIGH)],
        ingredients=["harina de trigo"],
        warnings=[],
    )
    assert compute_alert_level(detected) == "danger"


def test_alert_level_warning_for_low_severity():
    detected = detect_allergens(
        [_gluten_profile(Severity.LOW)],
        ingredients=["harina de trigo"],
        warnings=[],
    )
    assert compute_alert_level(detected) == "warning"


def test_alert_level_safe_when_empty():
    assert compute_alert_level([]) == "safe"


def test_multiple_allergens_detected():
    gluten = _gluten_profile()
    lactosa = UserAllergenProfile(
        name="lactosa",
        severity=Severity.MEDIUM,
        synonyms=["lactosa", "leche", "leche en polvo"],
        ocr_variants=[],
    )
    detected = detect_allergens(
        [gluten, lactosa],
        ingredients=["harina de trigo", "leche en polvo", "sal"],
        warnings=[],
    )
    names = {d.name for d in detected}
    assert names == {"gluten", "lactosa"}
