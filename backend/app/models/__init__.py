"""Pydantic schemas for API requests/responses."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# --- Auth requests ---

class RegisterRequest(BaseModel):
    phone: str
    password: str
    name: str
    country_code: str = "+91"
    ref: Optional[str] = None  # referral code


class LoginRequest(BaseModel):
    phone: str
    password: str
    country_code: str = "+91"


# --- Auth responses ---

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    name: str
    country_code: str
    referral_code: Optional[str] = None
    referral_count: int = 0
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class ReferralInfoResponse(BaseModel):
    referral_code: str
    referral_count: int
    referral_link: str
