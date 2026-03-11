"""Push notifications — FCM tokens and notification log."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from app.core.database import Base


class FCMToken(Base):
    """Firebase Cloud Messaging tokens for push notifications."""
    __tablename__ = "fcm_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=True)  # null for anonymous
    token = Column(String(500), unique=True, index=True, nullable=False)
    device_type = Column(String(20), nullable=True)  # web, android, ios
    browser = Column(String(50), nullable=True)  # chrome, firefox, safari
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
