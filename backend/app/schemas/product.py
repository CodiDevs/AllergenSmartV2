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
    # Texto crudo de ingredientes (viene de OFF o de escaneo OCR)
    ingredients_text: Optional[str] = None
    verified_by_admin: bool = False
    country_origin: str = "EC"
    image_url: Optional[str] = None


class BarcodeProductResult(BaseModel):
    """
    Respuesta enriquecida del endpoint GET /products/{barcode}.
    Incluye todo lo necesario para que el frontend decida si mostrar
    el modal de ingredientes o redirigir al escáner OCR.
    """
    id: str
    barcode: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    ingredients_text: Optional[str] = None
    ingredients_array: list[str] = []
    allergens_tags: list[str] = []
    verified_by_admin: bool = False
    from_cache: bool = False  # True si vino de nuestra BD, False si vino de OFF
    image_url: Optional[str] = None


class ProductCreate(BaseModel):
    """Datos para crear un producto nuevo (uso interno / admin)."""
    barcode: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    ingredients_raw: Optional[str] = None
    ingredients_array: list[str] = []
    country_origin: str = "EC"
