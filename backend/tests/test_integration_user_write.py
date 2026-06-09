"""
Tests e2e del camino de ESCRITURA (perfil / alergias / scan) contra Supabase real.

Usan el fixture `e2e_user` (crea/borra un usuario real vía Admin API → el trigger
de Supabase crea su profile). Las escrituras de cada test NO se commitean (el
`db_session` hace rollback), así que no ensucian la BD; el usuario se borra al final.
"""
import pytest

from app.repositories.allergen_repo import AllergenRepository
from app.schemas.common import AlertLevel, Severity
from app.schemas.scan import ScanRequest
from app.schemas.user import UserAllergiesUpdate, UserAllergyEntry
from app.services.scan_service import ScanService
from app.services.user_service import UserService


async def _gluten_id(db_session) -> str:
    allergens = await AllergenRepository(db_session).get_active_allergens()
    gluten = next(a for a in allergens if a.name == "gluten")
    return str(gluten.id)


@pytest.mark.integration
async def test_replace_allergies_persists(db_session, e2e_user):
    service = UserService(db_session)
    gluten_id = await _gluten_id(db_session)

    count = await service.replace_allergies(
        e2e_user,
        UserAllergiesUpdate(
            allergies=[UserAllergyEntry(allergen_id=gluten_id, severity=Severity.HIGH)]
        ),
    )
    assert count == 1

    profile = await service.get_profile(e2e_user)
    assert any(a.allergen_name == "gluten" for a in profile.allergies)


@pytest.mark.integration
async def test_scan_detects_gluten_and_persists_history(db_session, e2e_user, monkeypatch):
    # 1. Configurar alergia a gluten
    user_service = UserService(db_session)
    gluten_id = await _gluten_id(db_session)
    await user_service.replace_allergies(
        e2e_user,
        UserAllergiesUpdate(
            allergies=[UserAllergyEntry(allergen_id=gluten_id, severity=Severity.HIGH)]
        ),
    )

    # 2. Monkeypatch Vision → texto determinista (sin gastar cuota)
    from app.infrastructure.vision_client import vision_client

    async def fake_extract_text(image_base64: str) -> dict:
        return {
            "text": "ingredientes: harina de trigo, azucar, aceite vegetal, sal.",
            "confidence": 0.95,
            "raw_response": None,
        }

    monkeypatch.setattr(vision_client, "extract_text", fake_extract_text)

    # 3. Escanear (barcode None → va al path de Vision)
    scan_service = ScanService(db_session)
    response = await scan_service.process_scan(
        e2e_user,
        ScanRequest(image_base64="A" * 200, barcode=None),
    )

    # 4. Detectó gluten → peligro
    assert response.alert_level == AlertLevel.DANGER
    assert any(a.name == "gluten" for a in response.allergens_found)

    # 5. Se guardó en el historial
    history = await scan_service.get_history(e2e_user)
    assert history["total"] >= 1
