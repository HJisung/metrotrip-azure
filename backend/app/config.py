"""Environment-based application settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="METROTRIP_",
        extra="ignore",
    )

    app_name: str = "MetroTrip API"
    app_env: str = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = (
        "mysql+pymysql://metrotrip:metrotrip@localhost:3306/metrotrip?charset=utf8mb4"
    )
    cors_origins: list[str] = ["http://localhost:5173"]
    jwt_secret: str = "local-only-change-this-secret"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    verification_code_expire_minutes: int = 5
    verification_max_attempts: int = 5
    email_mode: str = "console"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
