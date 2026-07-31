"""
Schemas Pydantic para el catálogo de alérgenos.
"""
from typing import Optional
from pydantic import BaseModel


class AllergenResponse(BaseModel):
    """Alérgeno individual del catálogo."""
    id: str
    name: str
    synonyms: list[str] = []
    is_active: bool = True


class CategoryResponse(BaseModel):
    """Categoría con sus alérgenos."""
    id: str
    name: str
    icon_emoji: Optional[str] = None
    description: Optional[str] = None
    allergens: list[AllergenResponse] = []


class AllergenCatalogResponse(BaseModel):
    """Respuesta completa del catálogo — agrupa alérgenos por categoría."""
    categories: list[CategoryResponse]
