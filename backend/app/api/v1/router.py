"""
Router principal v1 — agrupa todos los endpoints bajo /api/v1
"""
from fastapi import APIRouter

from app.api.v1.endpoints import allergens, users, products, scan, reports

router = APIRouter(prefix="/api/v1")

router.include_router(allergens.router)
router.include_router(users.router)
router.include_router(products.router)
router.include_router(scan.router)
router.include_router(reports.router)
