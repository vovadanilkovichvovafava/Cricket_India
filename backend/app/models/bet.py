"""User bets — bet tracker with P&L tracking."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from app.core.database import Base


class UserBet(Base):
    """Individual bet logged by user in Bet Tracker."""
    __tablename__ = "user_bets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)  # FK to users.id

    # Bet details
    match_name = Column(String(200), nullable=False)  # "CSK vs MI"
    market = Column(String(100), nullable=True)  # "Match Winner", "Top Batsman"
    pick = Column(String(200), nullable=False)  # "CSK to win"
    odds = Column(Float, nullable=False)
    stake = Column(Float, nullable=False)  # amount in INR

    # Result
    status = Column(String(20), default="pending")  # pending, won, lost
    profit = Column(Float, nullable=True)  # calculated on resolution

    # Metadata
    match_id = Column(String(50), nullable=True, index=True)  # link to match if available
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)


class ExpressBet(Base):
    """Accumulator / express bet (multiple picks in one bet)."""
    __tablename__ = "express_bets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)

    # Express details
    name = Column(String(200), nullable=True)  # user-given name or auto
    picks = Column(JSON, nullable=False)  # [{match_name, market, pick, odds}, ...]
    combined_odds = Column(Float, nullable=False)
    stake = Column(Float, nullable=False)  # amount in INR
    potential_payout = Column(Float, nullable=True)

    # Result
    status = Column(String(20), default="pending")  # pending, won, lost, partial
    won_picks = Column(Integer, default=0)
    total_picks = Column(Integer, default=0)
    profit = Column(Float, nullable=True)

    # Metadata
    is_ai_suggested = Column(Boolean, default=False)  # suggested by AI
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
