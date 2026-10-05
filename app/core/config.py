from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HireMind AI"
    app_env: str = "development"
    debug: bool = False

    database_url: str = Field(
        validation_alias="DATABASE_URL"
    )

    jwt_secret_key: str = Field(
        validation_alias="JWT_SECRET_KEY"
    )

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    cors_origins: str = ""

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 5

    chroma_persist_directory: str = "chroma_data"
    enable_rag_ingestion: bool = False

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value: object) -> bool:
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "t", "yes", "y", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"0", "false", "f", "no", "n", "off", "release", "production", "prod", ""}:
                return False
        return bool(value)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
