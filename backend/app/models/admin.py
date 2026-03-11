"""Admin system — admin users, sessions, invite codes."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base


class AdminUser(Base):
    """Admin panel accounts (separate from regular users)."""
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    role = Column(String(20), default="editor")  # superadmin, admin, editor
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AdminSession(Base):
    """Admin login sessions with JWT tracking."""
    __tablename__ = "admin_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(Integer, index=True, nullable=False)  # FK admin_users.id
    token_hash = Column(String(64), index=True, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)


class AdminInvite(Base):
    """Admin invitation codes for adding new admins."""
    __tablename__ = "admin_invites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    role = Column(String(20), default="editor")  # role granted on registration
    created_by = Column(Integer, nullable=False)  # admin_id who created
    used_by = Column(Integer, nullable=True)  # admin_id who used it
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    used_at = Column(DateTime, nullable=True)
