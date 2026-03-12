"""Auth endpoints: register, login, me, referral — phone-based."""

import re
import traceback

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.core.rate_limiter import limiter
from app.models import RegisterRequest, LoginRequest, AuthResponse, UserResponse, ReferralInfoResponse
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/debug-schema")
async def debug_schema(db: Session = Depends(get_db)):
    """TEMPORARY: check DB schema — remove after debugging."""
    try:
        cols = db.execute(text("PRAGMA table_info(users)")).fetchall()
        user_cols = [{"name": c[1], "type": c[2]} for c in cols]
        count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        return {"users_columns": user_cols, "users_count": count, "status": "ok"}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}


# Allowed origins for referral links
_ALLOWED_ORIGINS = {"https://cricketbaazi.com", "https://www.cricketbaazi.com"}
_ORIGIN_REGEX = re.compile(r"^https://cricket-india-[a-z0-9]+\.saturn\.ac$")


def normalize_phone(country_code: str, phone: str) -> str:
    """Normalize phone: strip spaces/dashes, prepend country code → unique key."""
    digits = "".join(c for c in phone if c.isdigit())
    cc = country_code.strip().lstrip("+")
    return f"+{cc}{digits}"


def _validate_password(password: str):
    """Validate password strength: min 6 chars, at least one letter + one digit."""
    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="password_too_short",
        )
    if not re.search(r"[a-zA-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="password_needs_letter",
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="password_needs_digit",
        )


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new user with phone + password. Optionally pass ref code."""
    try:
        _validate_password(body.password)

        full_phone = normalize_phone(body.country_code, body.phone)

        # Check if phone already taken
        existing = db.query(User).filter(User.phone == full_phone).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="phone_already_registered",
            )

        # Resolve referral (validate format: alphanumeric only)
        referred_by_id = None
        if body.ref:
            ref_clean = re.sub(r"[^A-Z0-9]", "", body.ref.strip().upper())
            if ref_clean:
                referrer = db.query(User).filter(User.referral_code == ref_clean).first()
                if referrer:
                    referred_by_id = referrer.id

        user = User(
            phone=full_phone,
            country_code=body.country_code.strip(),
            hashed_password=hash_password(body.password),
            name=body.name.strip()[:100],  # Limit name length
            referred_by=referred_by_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Increment referrer's count
        if referred_by_id:
            referrer = db.query(User).filter(User.id == referred_by_id).first()
            if referrer:
                referrer.referral_count = (referrer.referral_count or 0) + 1
                db.commit()

        token = create_access_token({"sub": str(user.id)})
        return AuthResponse(
            token=token,
            user=UserResponse.model_validate(user),
        ).model_dump()
    except HTTPException:
        raise
    except Exception as e:
        # TEMPORARY: return full error for debugging
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()},
        )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login with phone + password, return JWT."""
    full_phone = normalize_phone(body.country_code, body.phone)
    user = db.query(User).filter(User.phone == full_phone).first()

    # Constant-time comparison: always verify a password even if user not found
    # This prevents timing attacks that enumerate valid phone numbers
    _dummy_hash = "$2b$12$LJ3m4ys3Lg7E.DUMMY.HASH.TO.PREVENT.TIMING.ATTACK"
    stored_hash = user.hashed_password if user else _dummy_hash
    password_ok = verify_password(body.password, stored_hash)

    if not user or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_credentials",
        )

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse.model_validate(current_user)


@router.get("/referral", response_model=ReferralInfoResponse)
async def get_referral_info(request: Request, current_user: User = Depends(get_current_user)):
    """Get user's referral code, count, and shareable link."""
    origin = request.headers.get("origin", "")

    # Validate origin against whitelist to prevent XSS via Origin header
    if origin not in _ALLOWED_ORIGINS and not _ORIGIN_REGEX.match(origin):
        origin = "https://cricketbaazi.com"

    referral_link = f"{origin}/login?ref={current_user.referral_code}"

    return ReferralInfoResponse(
        referral_code=current_user.referral_code,
        referral_count=current_user.referral_count or 0,
        referral_link=referral_link,
    )
