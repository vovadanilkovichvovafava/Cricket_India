"""Odds cache — stores bookmaker odds to reduce API calls."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.core.database import Base


class OddsCache(Base):
    """Cached odds from multiple bookmakers for a match."""
    __tablename__ = "odds_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), index=True, nullable=False)

    # Best odds
    best_home_odds = Column(Float, nullable=True)
    best_away_odds = Column(Float, nullable=True)
    best_draw_odds = Column(Float, nullable=True)

    # All bookmakers (JSON array)
    bookmakers = Column(JSON, nullable=True)  # [{bookmaker, home_odds, away_odds, draw_odds}, ...]

    # Totals / Over-Under
    totals = Column(JSON, nullable=True)  # [{bookmaker, line, over_odds, under_odds}, ...]

    # Cache metadata
    source = Column(String(50), default="the_odds_api")  # the_odds_api, manual
    cached_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)


class PlayerCache(Base):
    """Cached player profile data from CricAPI."""
    __tablename__ = "player_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String(50), unique=True, index=True, nullable=False)

    name = Column(String(200), nullable=False)
    country = Column(String(100), nullable=True)
    date_of_birth = Column(String(30), nullable=True)
    role = Column(String(50), nullable=True)  # Batsman, Bowler, All-rounder, WK-Batsman
    batting_style = Column(String(50), nullable=True)
    bowling_style = Column(String(100), nullable=True)
    place_of_birth = Column(String(200), nullable=True)
    player_img = Column(String(500), nullable=True)

    # Stats (JSON array from API)
    stats = Column(JSON, nullable=True)  # [{fn, matchtype, stat, value}, ...]

    cached_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
