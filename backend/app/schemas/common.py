"""
Enums compartidos — usados tanto en schemas como en modelos.
"""
from enum import Enum


class AlertLevel(str, Enum):
    """Nivel de alerta del resultado de un escaneo."""
    SAFE = "safe"
    WARNING = "warning"
    DANGER = "danger"


class MatchType(str, Enum):
    """Tipo de coincidencia en la detección de alérgenos."""
    DIRECT = "direct"      # Ingrediente contiene directamente el alérgeno
    TRACE = "trace"        # "contiene trazas de..."
    POSSIBLE = "possible"  # "puede contener..."
    FUZZY = "fuzzy"        # Coincidencia por fuzzy matching (OCR error)


class Severity(str, Enum):
    """Severidad de la alergia del usuario."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ReportStatus(str, Enum):
    """Estado del reporte de producto (crowdsourcing)."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ScanSource(str, Enum):
    """Fuente de la solicitud de escaneo."""
    CAMERA = "camera"           # Imagen tomada con la cámara
    BARCODE_ONLY = "barcode_only"  # Solo se escaneó el código de barras
    MANUAL = "manual"           # Ingresado manualmente por el usuario
