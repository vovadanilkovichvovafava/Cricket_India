"""Auth endpoints: register, login, me, referral — phone-based."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models import RegisterRequest, LoginRequest, AuthResponse, UserResponse, ReferralInfoResponse
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


def normalize_phone(country_code: str, phone: str) -> str:
    """Normalize phone: strip spaces/dashes, prepend country code → unique key."""
    digits = "".join(c for c in phone if c.isdigit())
    cc = country_code.strip().lstrip("+")
    return f"+{cc}{digits}"


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new user with phone + password. Optionally pass ref code."""
    full_phone = normalize_phone(body.country_code, body.phone)

    # Check if phone already taken
    existing = db.query(User).filter(User.phone == full_phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already registered",
        )

    # Resolve referral
    referred_by_id = None
    if body.ref:
        referrer = db.query(User).filter(User.referral_code == body.ref.strip().upper()).first()
        if referrer:
            referred_by_id = referrer.id

    user = User(
        phone=full_phone,
        country_code=body.country_code.strip(),
        hashed_password=hash_password(body.password),
        name=body.name.strip(),
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

    token = create_access_token({"sub": user.id})
    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone + password, return JWT."""
    full_phone = normalize_phone(body.country_code, body.phone)
    user = db.query(User).filter(User.phone == full_phone).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
        )

    token = create_access_token({"sub": user.id})
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
    origin = request.headers.get("origin", "https://cricketbaazi.com")
    referral_link = f"{origin}/login?ref={current_user.referral_code}"

    return ReferralInfoResponse(
        referral_code=current_user.referral_code,
        referral_count=current_user.referral_count or 0,
        referral_link=referral_link,
    )
