"""Session replay storage — rrweb event recordings for admin playback."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, LargeBinary, Boolean, DateTime
from app.core.database import Base


class SessionReplay(Base):
    """Stores gzip-compressed rrweb events for a single user session."""
    __tablename__ = "session_replays"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=True)
    events_gz = Column(LargeBinary, nullable=True)  # gzip(JSON array of rrweb events)
    events_count = Column(Integer, default=0)
    uncompressed_size = Column(Integer, default=0)  # bytes, cap at 2MB
    is_complete = Column(Boolean, default=False)  # true after session_end
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
