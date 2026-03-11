"""Match cache — stores match data from Cricket API to reduce API calls."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), unique=True, index=True, nullable=False)  # external API id
    name = Column(String(200), nullable=True)  # "CSK vs MI, 12th Match"
    match_type = Column(String(20), default="t20")  # t20, odi, test

    # Teams
    home_team_code = Column(String(10), nullable=False)
    home_team_name = Column(String(100), nullable=False)
    away_team_code = Column(String(10), nullable=False)
    away_team_name = Column(String(100), nullable=False)

    # Schedule
    date = Column(String(30), nullable=True)  # ISO date string
    venue = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)

    # Status
    status = Column(String(20), default="upcoming")  # upcoming, live, completed
    status_text = Column(String(200), nullable=True)  # "CSK won by 5 wickets"

    # Score (JSON array of innings)
    score = Column(JSON, nullable=True)  # [{runs, wickets, overs, inning}, ...]

    # Series
    series_id = Column(String(50), nullable=True, index=True)
    series_name = Column(String(200), nullable=True)

    # Odds (cached)
    home_odds = Column(Float, nullable=True)
    away_odds = Column(Float, nullable=True)
    draw_odds = Column(Float, nullable=True)

    # Result (for prediction verification)
    winner = Column(String(100), nullable=True)  # filled after match ends
    toss_winner = Column(String(100), nullable=True)
    toss_decision = Column(String(20), nullable=True)  # bat, bowl

    # Cache metadata
    raw_data = Column(JSON, nullable=True)  # full API response for reference
    cached_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
