"""
Servicio de usuario — perfil y alergias.
"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UserNotFoundException
from app.repositories.user_repo import UserRepository
from app.schemas.common import Severity
from app.schemas.user import (
    UserAllergiesUpdate,
    UserAllergyItem,
    UserProfileResponse,
    UserProfileUpdate,
)


class UserService:
    """Lógica de negocio para perfiles de usuario."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = UserRepository(session)

    def _to_response(self, profile) -> UserProfileResponse:
        """Mapea un Profile (con alergias cargadas) al schema de respuesta."""
        allergies = []
        for ua in profile.allergies:
            allergen = ua.allergen
            allergies.append(
                UserAllergyItem(
                    allergen_id=str(ua.allergen_id),
                    allergen_name=allergen.name if allergen else None,
                    category_name=(
                        allergen.category.name
                        if allergen and allergen.category
                        else None
                    ),
                    severity=Severity(ua.severity),
                )
            )
        return UserProfileResponse(
            id=str(profile.id),
            full_name=profile.full_name,
            city=profile.city,
            language=profile.language,
            notifications_enabled=profile.notifications_enabled,
            is_admin=profile.is_admin,
            allergies=allergies,
        )

    async def get_profile(self, user_id: UUID) -> UserProfileResponse:
        """Retorna el perfil completo. Lanza UserNotFoundException si no existe."""
        profile = await self.repo.get_profile(user_id)
        if profile is None:
            raise UserNotFoundException(user_id=str(user_id))
        return self._to_response(profile)

    async def update_profile(
        self, user_id: UUID, data: UserProfileUpdate
    ) -> UserProfileResponse:
        """Actualiza campos del perfil (solo los provistos)."""
        updated = await self.repo.update_profile(
            user_id, data.model_dump(exclude_unset=True)
        )
        if updated is None:
            raise UserNotFoundException(user_id=str(user_id))
        return self._to_response(updated)

    async def delete_account(self, user_id: UUID) -> None:
        """
        Borra la cuenta del usuario en la BD local y en Supabase Auth.
        """
        # 1. Borrar perfil de la BD local
        profile = await self.repo.get_by_id(user_id)
        if profile:
            await self.repo.delete(profile)
        
        # 2. Borrar de Supabase Auth usando la service_role_key
        from app.core.config import settings
        from supabase import create_client
        
        if settings.supabase_url and settings.supabase_service_role_key:
            try:
                supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
                supabase.auth.admin.delete_user(str(user_id))
            except Exception as e:
                # Loggear pero no fallar si ya fue borrado o hay un error menor
                print(f"Error borrando usuario en Supabase: {e}")

    async def replace_allergies(
        self, user_id: UUID, data: UserAllergiesUpdate
    ) -> int:
        """
        Reemplaza todas las alergias del usuario (idempotente).
        Si un allergen_id no es un UUID válido (ej. "aqua"), lo busca o crea en el catálogo.
        Retorna el número de alergias configuradas.
        """
        from app.models.allergen import Allergen
        from sqlalchemy import select

        allergies = []
        for item in data.allergies:
            try:
                allergen_uuid = UUID(item.allergen_id)
            except ValueError:
                # No es un UUID, es un nombre manual introducido por el usuario
                clean_name = item.allergen_id.strip()
                
                # Buscar si ya existe (case-insensitive)
                stmt = select(Allergen).where(Allergen.name.ilike(clean_name))
                result = await self.session.execute(stmt)
                existing = result.scalar_one_or_none()
                
                # Diccionario de equivalencias y traducciones comunes (ES / EN / LAT)
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

                term_key = clean_name.lower()
                computed_synonyms = COMMON_SYNONYMS.get(term_key, [term_key])
                if term_key not in computed_synonyms:
                    computed_synonyms.append(term_key)

                if existing:
                    # Actualizar sinónimos si no los tenía completos
                    existing_syns = set(existing.synonyms or [])
                    existing_syns.update(computed_synonyms)
                    existing.synonyms = list(existing_syns)
                    self.session.add(existing)
                    await self.session.flush()
                    allergen_uuid = existing.id
                else:
                    # Crear alérgeno personalizado con sinónimos enriquecidos
                    new_allergen = Allergen(
                        name=clean_name.capitalize(),
                        synonyms=computed_synonyms,
                        ocr_variants=[],
                    )
                    self.session.add(new_allergen)
                    await self.session.flush() # Obtener UUID generado
                    allergen_uuid = new_allergen.id

            allergies.append({"allergen_id": allergen_uuid, "severity": item.severity.value})

        # Al usar replace_allergies, hacemos commit de todo junto (incluyendo los nuevos allergens)
        return await self.repo.replace_allergies(user_id, allergies)
