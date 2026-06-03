"""
Excepciones de dominio de AllergenSmart.
Cada excepción tiene un error_code y action_required para el frontend.
"""
from dataclasses import dataclass


@dataclass
class DomainException(Exception):
    """Base para todas las excepciones de dominio."""
    error_code: str
    message: str
    action_required: str | None = None
    status_code: int = 500


class ProductNotFoundException(DomainException):
    def __init__(self, barcode: str | None = None):
        detail = f" con barcode '{barcode}'" if barcode else ""
        super().__init__(
            error_code="PRODUCT_NOT_FOUND",
            message=f"No se encontró un producto{detail}.",
            action_required="SCAN_LABEL",
            status_code=404,
        )


class OCRUnreadableException(DomainException):
    def __init__(self, reason: str = "imagen borrosa"):
        super().__init__(
            error_code="OCR_UNREADABLE",
            message=f"La imagen está demasiado borrosa ({reason}). Intenta con mejor iluminación.",
            action_required="RETAKE_PHOTO",
            status_code=422,
        )


class OCRNoTextException(DomainException):
    def __init__(self):
        super().__init__(
            error_code="OCR_NO_TEXT",
            message="No se detectó texto en la imagen. Enfoca la sección de ingredientes.",
            action_required="RETAKE_PHOTO",
            status_code=422,
        )


class InvalidImageException(DomainException):
    def __init__(self, reason: str = "imagen inválida"):
        super().__init__(
            error_code="INVALID_IMAGE",
            message=f"La imagen proporcionada no es válida ({reason}).",
            action_required="RETAKE_PHOTO",
            status_code=400,
        )


class ImageTooLargeException(DomainException):
    def __init__(self, max_mb: int = 5):
        super().__init__(
            error_code="IMAGE_TOO_LARGE",
            message=f"La imagen excede el tamaño máximo de {max_mb} MB.",
            action_required="COMPRESS_IMAGE",
            status_code=400,
        )


class UnauthorizedException(DomainException):
    def __init__(self):
        super().__init__(
            error_code="UNAUTHORIZED",
            message="Tu sesión ha expirado. Inicia sesión nuevamente.",
            action_required="REDIRECT_LOGIN",
            status_code=401,
        )


class VisionAPIException(DomainException):
    def __init__(self):
        super().__init__(
            error_code="VISION_API_ERROR",
            message="El servicio de reconocimiento de texto no está disponible. Intenta más tarde.",
            action_required="RETRY_LATER",
            status_code=502,
        )


class RateLimitException(DomainException):
    def __init__(self, limit: int = 10):
        super().__init__(
            error_code="RATE_LIMITED",
            message=f"Has excedido el límite de {limit} escaneos por minuto. Espera un momento.",
            action_required="WAIT_AND_RETRY",
            status_code=429,
        )


class UserNotFoundException(DomainException):
    def __init__(self, user_id: str | None = None):
        detail = f" con ID '{user_id}'" if user_id else ""
        super().__init__(
            error_code="USER_NOT_FOUND",
            message=f"No se encontró el perfil de usuario{detail}.",
            action_required="REDIRECT_LOGIN",
            status_code=404,
        )
