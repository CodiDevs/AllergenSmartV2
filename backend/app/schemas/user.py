"""
Schemas Pydantic para el perfil de usuario y sus alergias.
"""
from typing import Optional
from pydantic import BaseModel
from app.schemas.common import Severity


class UserAllergyItem(BaseModel):
    """Alergia del usuario en el perfil."""
    allergen_id: str
    allergen_name: Optional[str] = None
    category_name: Optional[str] = None
    severity: Severity = Severity.HIGH


class UserProfileResponse(BaseModel):
    """Perfil completo del usuario autenticado."""
    id: str
    full_name: str
    city: str
    language: str = "es-EC"
    notifications_enabled: bool
    is_admin: bool = False
    allergies: list[UserAllergyItem] = []


class UserProfileUpdate(BaseModel):
    """Campos actualizables del perfil."""
    full_name: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = None
    notifications_enabled: Optional[bool] = None


class UserAllergyEntry(BaseModel):
    """Entrada individual para actualizar alergias."""
    allergen_id: str
    severity: Severity = Severity.HIGH


class UserAllergiesUpdate(BaseModel):
    """
    Reemplaza TODAS las alergias del usuario.
    Operación idempotente — no es incremental.
    """
    allergies: list[UserAllergyEntry]
