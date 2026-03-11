"""PredictionHistory SQLAlchemy model — tracks AI prediction accuracy."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.core.database import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(String(50), index=True, nullable=False)
    home_team = Column(String(50), nullable=False)
    away_team = Column(String(50), nullable=False)
    predicted_winner = Column(String(50), nullable=False)
    confidence = Column(Float, default=0.5)
    actual_winner = Column(String(50), nullable=True)  # filled when match completes
    is_correct = Column(Boolean, nullable=True)  # null = pending, true/false = verified
    match_date = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    verified_at = Column(DateTime, nullable=True)
