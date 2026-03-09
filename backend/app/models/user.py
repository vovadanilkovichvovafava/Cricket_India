"""User SQLAlchemy model."""

import secrets
import string
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base


def _generate_referral_code():
    """Generate a short unique referral code like 'CK7X9M'."""
    chars = string.ascii_uppercase + string.digits
    return "CK" + "".join(secrets.choice(chars) for _ in range(4))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    country_code = Column(String(5), nullable=False, default="+91")
    referral_code = Column(String(10), unique=True, index=True, default=_generate_referral_code)
    referred_by = Column(Integer, nullable=True)  # user id who referred this user
    referral_count = Column(Integer, default=0)    # how many people this user referred
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
