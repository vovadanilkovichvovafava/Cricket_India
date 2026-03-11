"""Feature error logs — tracks frontend and backend errors."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.core.database import Base


class FeatureErrorLog(Base):
    """Logs errors from features (frontend reports + backend exceptions)."""
    __tablename__ = "feature_error_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)  # null if anonymous

    # Error details
    feature = Column(String(100), nullable=False, index=True)  # "ai_chat", "predictions", "odds"
    error_type = Column(String(100), nullable=False)  # "api_error", "timeout", "validation", "crash"
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)

    # Context
    endpoint = Column(String(200), nullable=True)  # API endpoint that failed
    request_data = Column(JSON, nullable=True)  # sanitized request params
    response_code = Column(Integer, nullable=True)  # HTTP status code
    device_info = Column(String(200), nullable=True)  # browser/device from UA

    # Resolution
    is_resolved = Column(String(20), default="open")  # open, investigating, resolved, ignored
    resolved_by = Column(String(100), nullable=True)
    resolution_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
