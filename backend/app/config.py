from __future__ import annotations

import logging
import secrets as _secrets

from pydantic_settings import BaseSettings
from typing import List, Optional

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    SECRET_KEY: str = "change-me"
    CLAUDE_API_KEY: Optional[str] = None
    CRICKET_API_KEY: Optional[str] = None
    THE_ODDS_API_KEY: Optional[str] = None
    POSTBACK_SECRET: Optional[str] = None         # shared secret for postback verification
    DATABASE_URL: str = "sqlite:///./cricket.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Security
    ENVIRONMENT: str = "development"  # "production" or "development"

    # AI limits (per user per day)
    FREE_AI_LIMIT: int = 3
    FREE_SUPPORT_LIMIT: int = 10

    # Rate limiting
    RATE_LIMIT_AUTH: str = "5/minute"       # login/register
    RATE_LIMIT_AI: str = "10/minute"        # AI chat
    RATE_LIMIT_GENERAL: str = "60/minute"   # general API

    # App metadata
    APP_NAME: str = "Cricket Bet Analyzer API"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # CORS — WEB_URL injected by Coolify, localhost for dev
    WEB_URL: Optional[str] = None
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    def get_cors_origins(self) -> list[str]:
        origins = list(self.CORS_ORIGINS)
        if self.WEB_URL:
            origins.append(self.WEB_URL.rstrip("/"))
        return origins

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()

# Warn if using default secret key
# NOTE: Do NOT auto-generate in dev — random key on each restart
# invalidates all JWT tokens and kicks users out of their sessions.
if settings.SECRET_KEY == "change-me":
    if settings.ENVIRONMENT == "production":
        logger.critical(
            "⛔ SECRET_KEY is set to default 'change-me' in PRODUCTION! "
            "Set SECRET_KEY environment variable to a random 32+ char string."
        )
    else:
        logger.warning(
            "⚠️  SECRET_KEY is 'change-me' (default). "
            "Set SECRET_KEY env variable for production."
        )
