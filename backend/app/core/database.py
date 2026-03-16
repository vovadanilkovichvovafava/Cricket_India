"""SQLAlchemy database setup."""

import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

from app.config import settings

# check_same_thread is SQLite-only; skip for PostgreSQL
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables — imports every model so SQLAlchemy registers them."""
    # Core
    from app.models.user import User  # noqa: F401
    from app.models.prediction_history import PredictionHistory  # noqa: F401

    # Matches & caches
    from app.models.match import Match  # noqa: F401
    from app.models.prediction_cache import PredictionCache, ChatCache  # noqa: F401
    from app.models.odds_cache import OddsCache, PlayerCache  # noqa: F401

    # Chat & community
    from app.models.chat import (  # noqa: F401
        MatchChatMessage, MatchVote, CommunityPrediction,
        AIChatMessage, SupportChatMessage,
    )

    # Bets
    from app.models.bet import UserBet, ExpressBet  # noqa: F401

    # Admin
    from app.models.admin import AdminUser, AdminSession, AdminInvite  # noqa: F401

    # Analytics
    from app.models.analytics import (  # noqa: F401
        AnalyticsEvent, BannerClick, PostbackLog,
        TrackingParameter, ROIAnalytics,
    )

    # ML pipeline
    from app.models.ml import (  # noqa: F401
        MLModel, MLTrainingData, EnsembleModel,
        ConfidenceCalibration, LearningLog,
        LearningPattern, LeagueLearning,
    )

    # Notifications
    from app.models.notifications import FCMToken  # noqa: F401

    # Session Replay
    from app.models.session_replay import SessionReplay  # noqa: F401

    # Errors
    from app.models.errors import FeatureErrorLog  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Auto-migrate: add columns that create_all() doesn't add to existing tables
    _run_migrations()


def _run_migrations():
    """Add missing columns to existing tables (works for both SQLite and PostgreSQL)."""
    is_postgres = not settings.DATABASE_URL.startswith("sqlite")

    if is_postgres:
        # PostgreSQL: use IF NOT EXISTS or check information_schema
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP",
            "ALTER TABLE postback_logs ADD COLUMN IF NOT EXISTS user_db_id INTEGER",
            "ALTER TABLE postback_logs ADD COLUMN IF NOT EXISTS source VARCHAR(50)",
            "ALTER TABLE postback_logs ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100)",
            "ALTER TABLE postback_logs ADD COLUMN IF NOT EXISTS premium_activated BOOLEAN DEFAULT FALSE",
            "ALTER TABLE postback_logs ADD COLUMN IF NOT EXISTS error VARCHAR(500)",
            "ALTER TABLE postback_logs ADD COLUMN IF NOT EXISTS country VARCHAR(10)",
        ]
    else:
        # SQLite: no IF NOT EXISTS, rely on try/except
        migrations = [
            "ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN premium_until DATETIME",
            "ALTER TABLE postback_logs ADD COLUMN user_db_id INTEGER",
            "ALTER TABLE postback_logs ADD COLUMN source VARCHAR(50)",
            "ALTER TABLE postback_logs ADD COLUMN transaction_id VARCHAR(100)",
            "ALTER TABLE postback_logs ADD COLUMN premium_activated BOOLEAN DEFAULT 0",
            "ALTER TABLE postback_logs ADD COLUMN error VARCHAR(500)",
            "ALTER TABLE postback_logs ADD COLUMN country VARCHAR(10)",
        ]

    with engine.connect() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
                conn.commit()
                logger.info(f"Migration OK: {stmt[:60]}...")
            except Exception as e:
                logger.debug(f"Migration skip: {stmt[:40]}... ({e})")
