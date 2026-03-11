"""Chat models — match chat, AI chat history, support chat."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from app.core.database import Base


class MatchChatMessage(Base):
    """User messages in match live chat (community)."""
    __tablename__ = "match_chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)  # anonymous or auth user id
    user_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MatchVote(Base):
    """User votes for match winner prediction (Pick the Winner)."""
    __tablename__ = "match_votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)
    vote = Column(String(10), nullable=False)  # "home", "away", "draw"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class CommunityPrediction(Base):
    """Community prediction aggregated per match (% home/draw/away)."""
    __tablename__ = "community_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), unique=True, index=True, nullable=False)
    total_votes = Column(Integer, default=0)
    home_pct = Column(Float, default=0.0)
    draw_pct = Column(Float, default=0.0)
    away_pct = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class AIChatMessage(Base):
    """AI Chat conversation history per user."""
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)  # FK users.id
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    message = Column(Text, nullable=False)
    match_context = Column(String(100), nullable=True)  # match_id if relevant
    value_bets = Column(JSON, nullable=True)  # bets attached to AI response
    model_used = Column(String(50), nullable=True)  # claude, fallback
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SupportChatMessage(Base):
    """Support chat conversation history."""
    __tablename__ = "support_chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=True)  # FK users.id (null if anonymous)
    session_id = Column(String(50), index=True, nullable=False)  # browser session
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
