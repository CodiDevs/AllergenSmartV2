"""
Schemas Pydantic para productos.
"""
from typing import Optional
from pydantic import BaseModel


class ProductResponse(BaseModel):
    """Producto devuelto al frontend."""
    id: str
    barcode: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    ingredients_array: list[str] = []
    verified_by_admin: bool = False
    country_origin: str = "EC"
    image_url: Optional[str] = None


class ProductCreate(BaseModel):
    """Datos para crear un producto nuevo (uso interno / admin)."""
    barcode: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    ingredients_raw: Optional[str] = None
    ingredients_array: list[str] = []
    country_origin: str = "EC"
