"""Postback endpoints — receive affiliate postbacks, activate premium, view logs."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.analytics import PostbackLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/postbacks", tags=["postbacks"])

# Events that qualify for premium activation
QUALIFYING_EVENTS = {"deposit", "ftd", "first_deposit", "qualified", "sale", "confirmed"}

PREMIUM_DAYS = 15


# ── Helpers ────────────────────────────────────────────

def _activate_premium(user: User, db: Session, days: int = PREMIUM_DAYS) -> bool:
    """Activate premium for a user. Returns True if newly activated."""
    now = datetime.utcnow()  # naive UTC to match SQLite storage

    # If already premium and not expired — extend from current expiry
    if user.is_premium and user.premium_until and user.premium_until > now:
        user.premium_until = user.premium_until + timedelta(days=days)
    else:
        user.is_premium = True
        user.premium_until = now + timedelta(days=days)

    db.commit()
    logger.info(f"Premium activated for user {user.id} until {user.premium_until}")
    return True


def _verify_internal_secret(request: Request):
    """Verify X-Internal-Secret header matches POSTBACK_SECRET."""
    secret = request.headers.get("X-Internal-Secret")
    if not secret or secret != settings.POSTBACK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid internal secret")


# ── Schemas ────────────────────────────────────────────

class ActivatePremiumRequest(BaseModel):
    days: int = PREMIUM_DAYS
    source: str = "manual"


class PostbackLogResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    user_db_id: Optional[int] = None
    source: Optional[str] = None
    click_id: Optional[str] = None
    event: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    country: Optional[str] = None
    premium_activated: bool = False
    error: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PostbackListResponse(BaseModel):
    items: list[PostbackLogResponse]
    total: int
    page: int
    pages: int
    summary: dict


# ── Endpoints ──────────────────────────────────────────

@router.get("/receive")
@router.post("/receive")
async def receive_postback(
    request: Request,
    user_id: Optional[str] = Query(None),
    event: Optional[str] = Query(None, description="Event type: deposit, ftd, registration, etc."),
    amount: Optional[float] = Query(None),
    currency: Optional[str] = Query(None),
    click_id: Optional[str] = Query(None),
    transaction_id: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    secret: Optional[str] = Query(None),
    source: Optional[str] = Query("direct"),
    db: Session = Depends(get_db),
):
    """
    Public postback receiver — bookmaker calls this URL when user makes a deposit.
    Always returns 200 OK (postback senders shouldn't see errors).

    Example:
      GET /api/v1/postbacks/receive?user_id=42&event=deposit&amount=1000&currency=INR&secret=xxx
    """
    # Capture all query params for raw logging
    raw_params = dict(request.query_params)

    # Validate secret
    if not secret or secret != settings.POSTBACK_SECRET:
        logger.warning(f"Postback rejected: invalid secret from {request.client.host}")
        # Log with error but still return 200
        log = PostbackLog(
            user_id=user_id,
            source=source,
            click_id=click_id,
            event=event or "unknown",
            amount=amount,
            currency=currency,
            country=country,
            error="Invalid secret",
            raw_params=raw_params,
            ip_address=request.client.host if request.client else None,
        )
        db.add(log)
        db.commit()
        return {"status": "ok"}

    # Find user
    resolved_user = None
    error_msg = None

    if user_id:
        try:
            uid = int(user_id)
            resolved_user = db.query(User).filter(User.id == uid).first()
            if not resolved_user:
                error_msg = f"User not found: {user_id}"
                logger.warning(f"Postback: user not found id={user_id}")
        except (ValueError, TypeError):
            error_msg = f"Invalid user_id format: {user_id}"
            logger.warning(f"Postback: invalid user_id={user_id}")
    else:
        error_msg = "No user_id in postback"
        logger.warning("Postback received without user_id")

    # Activate premium if qualifying event
    premium_activated = False
    event_lower = (event or "").lower().strip()

    if resolved_user and event_lower in QUALIFYING_EVENTS and not error_msg:
        try:
            _activate_premium(resolved_user, db)
            premium_activated = True
            logger.info(f"Postback: premium activated for user {resolved_user.id}, event={event_lower}")
        except Exception as e:
            error_msg = f"Premium activation failed: {str(e)}"
            logger.error(f"Postback: premium activation error for user {user_id}: {e}")

    # Log postback
    log = PostbackLog(
        user_id=user_id,
        user_db_id=resolved_user.id if resolved_user else None,
        source=source,
        click_id=click_id,
        transaction_id=transaction_id,
        event=event_lower or "unknown",
        amount=amount,
        currency=currency,
        country=country,
        premium_activated=premium_activated,
        error=error_msg,
        raw_params=raw_params,
        ip_address=request.client.host if request.client else None,
    )
    db.add(log)
    db.commit()

    return {"status": "ok"}


@router.post("/activate/{user_id}")
async def activate_premium(
    user_id: int,
    body: ActivatePremiumRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Manual premium activation — internal endpoint.
    Auth: X-Internal-Secret header.
    """
    _verify_internal_secret(request)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    _activate_premium(user, db, days=body.days)

    # Log it
    log = PostbackLog(
        user_id=str(user_id),
        user_db_id=user_id,
        source=body.source,
        event="manual_activation",
        premium_activated=True,
        ip_address=request.client.host if request.client else None,
    )
    db.add(log)
    db.commit()

    return {
        "status": "ok",
        "user_id": user_id,
        "is_premium": user.is_premium,
        "premium_until": user.premium_until.isoformat() if user.premium_until else None,
    }


@router.get("/", response_model=PostbackListResponse)
async def list_postbacks(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    event: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List postback logs — admin endpoint.
    Auth: admin JWT or X-Internal-Secret.
    """
    # Accept either admin JWT or internal secret
    internal_secret = request.headers.get("X-Internal-Secret")
    auth_header = request.headers.get("Authorization")

    if internal_secret and internal_secret == settings.POSTBACK_SECRET:
        pass  # authorized via internal secret
    elif auth_header:
        # Verify admin JWT
        from app.api.admin_auth import get_current_admin
        from fastapi.security import HTTPAuthorizationCredentials
        try:
            creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=auth_header.replace("Bearer ", ""))
            await get_current_admin(credentials=creds, db=db)
        except Exception:
            raise HTTPException(status_code=403, detail="Admin authentication required")
    else:
        raise HTTPException(status_code=403, detail="Authentication required")

    # Build query
    query = db.query(PostbackLog)

    if event:
        query = query.filter(PostbackLog.event == event.lower())
    if source:
        query = query.filter(PostbackLog.source == source)
    if user_id:
        query = query.filter(
            (PostbackLog.user_id == user_id) |
            (PostbackLog.user_db_id == int(user_id) if user_id.isdigit() else False)
        )

    total = query.count()
    pages = max(1, (total + limit - 1) // limit)

    items = query.order_by(desc(PostbackLog.created_at)).offset((page - 1) * limit).limit(limit).all()

    # Summary stats
    total_postbacks = db.query(func.count(PostbackLog.id)).scalar() or 0
    premium_count = db.query(func.count(PostbackLog.id)).filter(PostbackLog.premium_activated == True).scalar() or 0
    unique_users = db.query(func.count(func.distinct(PostbackLog.user_db_id))).filter(PostbackLog.user_db_id.isnot(None)).scalar() or 0

    return PostbackListResponse(
        items=[PostbackLogResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        pages=pages,
        summary={
            "total_postbacks": total_postbacks,
            "premium_activated": premium_count,
            "unique_users": unique_users,
        },
    )
