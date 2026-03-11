"""AI Prediction cache — stores AI analysis results per match (24h TTL)."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from app.core.database import Base


class PredictionCache(Base):
    __tablename__ = "prediction_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), index=True, nullable=False)

    # Prediction result
    predicted_winner = Column(String(100), nullable=False)
    confidence = Column(Float, default=0.5)
    analysis_text = Column(Text, nullable=True)  # full AI analysis

    # Key factors (JSON array)
    key_factors = Column(JSON, nullable=True)  # [{factor, impact, detail}, ...]

    # Value bets (JSON array)
    value_bets = Column(JSON, nullable=True)  # [{market, selection, odds, confidence, reasoning}, ...]

    # Model info
    model_used = Column(String(50), default="claude")  # claude, xgboost, fallback

    # Cache TTL
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)  # 24h after creation


class ChatCache(Base):
    """Cache AI chat responses to avoid re-calling Claude for same questions."""
    __tablename__ = "chat_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_hash = Column(String(64), index=True, nullable=False)  # SHA256 of question
    match_context = Column(String(100), nullable=True)  # match_id if relevant

    response_text = Column(Text, nullable=False)
    value_bets = Column(JSON, nullable=True)
    model_used = Column(String(50), default="claude")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
