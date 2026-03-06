from __future__ import annotations

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    SECRET_KEY: str = "change-me"
    CLAUDE_API_KEY: Optional[str] = None
    CRICKET_API_KEY: Optional[str] = None
    THE_ODDS_API_KEY: Optional[str] = None
    DATABASE_URL: str = "sqlite:///./cricket.db"

    # App metadata
    APP_NAME: str = "Cricket Bet Analyzer API"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
