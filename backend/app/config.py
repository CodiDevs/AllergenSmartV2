"""
AllergenSmart V2 — Configuración centralizada
Carga variables de entorno con validación automática de Pydantic.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # === App ===
    app_name: str = "AllergenSmart API"
    app_version: str = "2.0.0"
    environment: str = "development"

    # === CORS ===
    cors_origins: str = "http://localhost:8081,http://localhost:19006,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    # === Supabase ===
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""

    # === Google Cloud (mockeado hasta activar) ===
    google_cloud_api_key: str = ""

    # === Rate Limiting ===
    rate_limit_per_minute: int = 10

    # === Monitoring ===
    sentry_dsn: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    """Singleton de settings — se cachea en memoria."""
    return Settings()


# Instancia global para importar directamente
settings = get_settings()
