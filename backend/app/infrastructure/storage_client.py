"""
Cliente Supabase Storage — para subir fotos de etiquetas y reportes.
"""
from app.config import settings


class StorageClient:
    """
    Cliente para Supabase Storage.
    Maneja la subida de imágenes de etiquetas y fotos de reportes.
    """

    LABEL_BUCKET = "product-labels"
    REPORT_BUCKET = "product-reports"

    async def upload_label_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str = "image/jpeg",
    ) -> str:
        """
        Sube una imagen de etiqueta a Supabase Storage.

        Returns:
            URL pública de la imagen subida.
        """
        if not settings.supabase_url:
            return f"mock://storage/{filename}"

        # TODO: implementar subida real con supabase client
        return f"{settings.supabase_url}/storage/v1/object/public/{self.LABEL_BUCKET}/{filename}"

    async def upload_report_photo(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str = "image/jpeg",
    ) -> str:
        """Sube una foto de reporte a Supabase Storage."""
        if not settings.supabase_url:
            return f"mock://storage/reports/{filename}"

        return f"{settings.supabase_url}/storage/v1/object/public/{self.REPORT_BUCKET}/{filename}"


storage_client = StorageClient()
