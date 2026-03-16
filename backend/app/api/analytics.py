"""Analytics endpoints — banner clicks, UTM tracking."""

import logging
from typing import Optional

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.database import get_db
from app.config import settings
from app.models.analytics import BannerClick, TrackingParameter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _extract_user_id(request: Request) -> Optional[int]:
    """Try to extract user_id from auth header. Returns None if not authenticated."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(auth.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        return int(payload.get("sub", 0)) or None
    except (JWTError, ValueError, TypeError):
        return None


class BannerClickRequest(BaseModel):
    banner_id: Optional[str] = None
    bookmaker: str = "partner"
    page: Optional[str] = None
    match_id: Optional[str] = None


class UTMTrackRequest(BaseModel):
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    referrer: Optional[str] = None
    landing_page: Optional[str] = None


@router.post("/banner-click")
async def track_banner_click(
    body: BannerClickRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Track a banner/affiliate link click."""
    try:
        record = BannerClick(
            user_id=_extract_user_id(request),
            banner_id=body.banner_id,
            bookmaker=body.bookmaker,
            page=body.page,
            match_id=body.match_id,
            ip_address=request.client.host if request.client else None,
        )
        db.add(record)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to track banner click: {e}")
        db.rollback()

    return {"ok": True}


@router.post("/utm")
async def track_utm(
    body: UTMTrackRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Track UTM parameters for traffic attribution."""
    try:
        record = TrackingParameter(
            user_id=_extract_user_id(request),
            utm_source=body.utm_source,
            utm_medium=body.utm_medium,
            utm_campaign=body.utm_campaign,
            referrer=body.referrer,
            landing_page=body.landing_page,
        )
        db.add(record)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to track UTM: {e}")
        db.rollback()

    return {"ok": True}
