"""
Exporta todos los modelos SQLAlchemy para que Alembic los detecte automáticamente.
IMPORTANTE: todos los modelos deben importarse aquí para que Base.metadata los incluya.
"""
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.allergen import Allergen, AllergenCategory
from app.models.cache import OCRCache
from app.models.product import Product
from app.models.report import ProductReport
from app.models.scan import ScanHistory
from app.models.user import Profile, UserAllergy

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "Profile",
    "UserAllergy",
    "AllergenCategory",
    "Allergen",
    "Product",
    "ScanHistory",
    "ProductReport",
    "OCRCache",
]
