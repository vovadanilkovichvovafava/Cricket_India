"""SQLAlchemy database setup."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

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

    # Errors
    from app.models.errors import FeatureErrorLog  # noqa: F401

    Base.metadata.create_all(bind=engine)
