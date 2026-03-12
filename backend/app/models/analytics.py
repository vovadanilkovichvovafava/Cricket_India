"""Analytics & tracking — events, banner clicks, postbacks, ROI, tracking params."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean
from app.core.database import Base


class AnalyticsEvent(Base):
    """User behavior events (page views, clicks, features used)."""
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=True)  # null for anonymous
    session_id = Column(String(50), index=True, nullable=True)
    event_type = Column(String(50), index=True, nullable=False)  # page_view, click, ai_request, bet_placed
    event_data = Column(JSON, nullable=True)  # {page, match_id, feature, ...}
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    country = Column(String(5), nullable=True)  # from geo
    platform = Column(String(20), nullable=True)  # web, ios, android
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class BannerClick(Base):
    """Affiliate banner click tracking for monetization."""
    __tablename__ = "banner_clicks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=True)
    banner_id = Column(String(50), index=True, nullable=True)  # banner placement id
    bookmaker = Column(String(100), nullable=False)  # "1xBet", "Bet365"
    url = Column(Text, nullable=True)  # affiliate link clicked
    page = Column(String(100), nullable=True)  # where the banner was shown
    match_id = Column(String(50), nullable=True)  # if shown on match page
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PostbackLog(Base):
    """Affiliate postback logs — conversion tracking from bookmakers."""
    __tablename__ = "postback_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), index=True, nullable=True)       # original user_id from postback (can be string)
    user_db_id = Column(Integer, index=True, nullable=True)       # resolved User.id in our DB
    source = Column(String(50), nullable=True)                    # "direct", "keitaro", "manual"
    click_id = Column(String(100), index=True, nullable=True)     # from affiliate link
    transaction_id = Column(String(100), nullable=True)           # unique transaction from bookmaker
    event = Column(String(50), nullable=False)                    # deposit, ftd, registration, etc.
    amount = Column(Float, nullable=True)                         # deposit/cashout amount
    currency = Column(String(5), nullable=True)                   # INR, USD
    country = Column(String(10), nullable=True)                   # country code from geo
    premium_activated = Column(Boolean, default=False)            # whether this postback activated Pro
    error = Column(String(500), nullable=True)                    # error message if activation failed
    raw_params = Column(JSON, nullable=True)                      # full postback query params
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TrackingParameter(Base):
    """UTM / tracking parameters per user session for attribution."""
    __tablename__ = "tracking_parameters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=True)
    session_id = Column(String(50), index=True, nullable=True)
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    utm_content = Column(String(100), nullable=True)
    utm_term = Column(String(100), nullable=True)
    referrer = Column(Text, nullable=True)  # HTTP referer
    landing_page = Column(String(500), nullable=True)
    click_id = Column(String(100), nullable=True)  # affiliate click_id
    sub_id = Column(String(100), nullable=True)  # sub-affiliate id
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ROIAnalytics(Base):
    """ROI tracking for AI predictions — profit/loss analysis."""
    __tablename__ = "roi_analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(10), index=True, nullable=False)  # YYYY-MM-DD
    match_id = Column(String(50), index=True, nullable=True)

    # Prediction outcome
    total_predictions = Column(Integer, default=0)
    correct_predictions = Column(Integer, default=0)
    accuracy_pct = Column(Float, nullable=True)

    # Financial ROI (if user followed AI bets)
    total_staked = Column(Float, default=0.0)
    total_returned = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)
    roi_pct = Column(Float, nullable=True)  # (returned - staked) / staked * 100

    # Value bet performance
    value_bets_total = Column(Integer, default=0)
    value_bets_won = Column(Integer, default=0)
    avg_odds = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
