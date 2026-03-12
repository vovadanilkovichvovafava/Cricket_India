"""
AI prediction endpoints using Claude API for cricket match analysis.
Server-side AI request limits enforce the free tier (3/day).
Prediction caching: 1h for upcoming, 3min for live matches.
"""

import logging
import re
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import MatchPrediction, MatchStatus, ChatRequest, ChatResponse, PredictionStatsResponse
from app.models.prediction_history import PredictionHistory
from app.models.chat import AIChatMessage
from app.services.cricket_api import cricket_service
from app.services.ai_analyzer import analyze_match, chat_about_cricket
from app.core.database import get_db
from app.core.security import get_current_user, bearer_scheme
from app.core.rate_limiter import limiter
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["predictions"])

# Regex for valid match IDs (alphanumeric + hyphens/underscores)
_MATCH_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,64}$")

# ── Prediction cache ──────────────────────────────
# Key: match_id → (MatchPrediction, timestamp, match_status)
_prediction_cache: dict[str, tuple] = {}

CACHE_TTL_UPCOMING = 3600   # 1 hour for upcoming/not-started matches
CACHE_TTL_LIVE = 180        # 3 minutes for live matches
CACHE_TTL_COMPLETED = 86400 # 24 hours for completed matches


def _get_prediction_ttl(match_status: str) -> int:
    """Get cache TTL based on match status."""
    if match_status == "live":
        return CACHE_TTL_LIVE
    if match_status == "completed":
        return CACHE_TTL_COMPLETED
    return CACHE_TTL_UPCOMING


def _cache_get_prediction(match_id: str, match_status: str) -> Optional[MatchPrediction]:
    """Get cached prediction if fresh enough for the match status."""
    if match_id not in _prediction_cache:
        return None
    prediction, cached_at, cached_status = _prediction_cache[match_id]
    ttl = _get_prediction_ttl(match_status)
    # If match went from upcoming → live, use shorter TTL
    if cached_status != match_status and match_status == "live":
        ttl = CACHE_TTL_LIVE
    if time.time() - cached_at < ttl:
        return prediction
    del _prediction_cache[match_id]
    return None


def _cache_set_prediction(match_id: str, prediction: MatchPrediction, match_status: str):
    """Cache a prediction with current timestamp and match status."""
    _prediction_cache[match_id] = (prediction, time.time(), match_status)


def _cache_stats() -> dict:
    """Get cache statistics for monitoring."""
    now = time.time()
    total = len(_prediction_cache)
    fresh = sum(1 for _, (_, ts, _) in _prediction_cache.items()
                if now - ts < CACHE_TTL_UPCOMING)
    return {"total": total, "fresh": fresh}


def _validate_match_id(match_id: str):
    """Validate match_id format to prevent injection."""
    if not _MATCH_ID_RE.match(match_id):
        raise HTTPException(status_code=400, detail="Invalid match ID format")


def _get_user_ai_requests_today(db: Session, user_id: int) -> int:
    """Count AI chat requests by this user today (server-side limit)."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = db.query(func.count(AIChatMessage.id)).filter(
        AIChatMessage.user_id == user_id,
        AIChatMessage.role == "user",
        AIChatMessage.created_at >= today_start,
    ).scalar() or 0
    return count


def _check_ai_limit(db: Session, user_id: int):
    """Check if user has exceeded their daily AI request limit. Raises 429 if exceeded."""
    from app.models.user import User

    # Check if user is premium — skip limit for Pro users
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.is_premium:
        now = datetime.utcnow()  # naive UTC to match SQLite storage
        if user.premium_until is None or user.premium_until > now:
            return  # Premium user — unlimited AI requests

        # Premium expired — auto-downgrade
        user.is_premium = False
        user.premium_until = None
        db.commit()

    used = _get_user_ai_requests_today(db, user_id)
    limit = settings.FREE_AI_LIMIT

    if used >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "daily_limit_exceeded",
                "used": used,
                "limit": limit,
                "resets_at": (datetime.now(timezone.utc).replace(
                    hour=0, minute=0, second=0, microsecond=0
                ) + timedelta(days=1)).isoformat(),
            },
        )


def _log_ai_request(db: Session, user_id: Optional[int], message: str):
    """Log an AI chat request for tracking and limiting."""
    try:
        record = AIChatMessage(
            user_id=user_id,
            role="user",
            message=message[:1000],  # Truncate long messages
        )
        db.add(record)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to log AI request: {e}")
        db.rollback()


def _save_prediction(db: Session, match_id: str, prediction: MatchPrediction):
    """Save prediction to DB for accuracy tracking (upsert by match_id)."""
    try:
        existing = db.query(PredictionHistory).filter(
            PredictionHistory.match_id == match_id
        ).first()
        if existing:
            existing.predicted_winner = prediction.predicted_winner
            existing.confidence = prediction.confidence
        else:
            record = PredictionHistory(
                match_id=match_id,
                home_team=prediction.home_team,
                away_team=prediction.away_team,
                predicted_winner=prediction.predicted_winner,
                confidence=prediction.confidence,
            )
            db.add(record)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to save prediction history: {e}")
        db.rollback()


async def _verify_pending(db: Session):
    """Check pending predictions against completed match results."""
    pending = db.query(PredictionHistory).filter(
        PredictionHistory.is_correct.is_(None)
    ).limit(20).all()

    if not pending:
        return

    for record in pending:
        try:
            match = await cricket_service.get_match_detail(record.match_id)
            if not match or match.status != MatchStatus.COMPLETED:
                continue
            # Try to extract winner from status_text (e.g., "CSK won by 5 wickets")
            status_text = (match.status_text or "").lower()
            winner = None
            for team_code in [record.home_team, record.away_team]:
                if team_code.lower() in status_text and "won" in status_text:
                    winner = team_code
                    break
            if not winner:
                # Try team names from match object
                home_name = match.home_team.name if match.home_team else ""
                away_name = match.away_team.name if match.away_team else ""
                if home_name.lower() in status_text and "won" in status_text:
                    winner = record.home_team
                elif away_name.lower() in status_text and "won" in status_text:
                    winner = record.away_team

            if winner:
                record.actual_winner = winner
                record.is_correct = (record.predicted_winner.upper() == winner.upper())
                record.verified_at = datetime.now(timezone.utc)
        except Exception as e:
            logger.debug(f"Verify skip {record.match_id}: {e}")
            continue

    try:
        db.commit()
    except Exception:
        db.rollback()


@router.get("/chat-limit")
async def get_chat_limit(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's AI chat usage and limit."""
    used = _get_user_ai_requests_today(db, current_user.id)
    limit = settings.FREE_AI_LIMIT
    return {
        "used": used,
        "limit": limit,
        "remaining": max(0, limit - used),
        "is_pro": False,  # TODO: premium check
    }


@router.get("/stats/accuracy", response_model=PredictionStatsResponse)
async def get_accuracy_stats(db: Session = Depends(get_db)):
    """Get AI prediction accuracy statistics."""
    # Try to verify any pending predictions
    await _verify_pending(db)

    all_preds = db.query(PredictionHistory).order_by(
        PredictionHistory.created_at.desc()
    ).all()

    total = len(all_preds)
    correct = sum(1 for p in all_preds if p.is_correct is True)
    incorrect = sum(1 for p in all_preds if p.is_correct is False)
    pending = sum(1 for p in all_preds if p.is_correct is None)
    verified = correct + incorrect
    accuracy = round((correct / verified * 100) if verified > 0 else 0, 1)

    recent = []
    for p in all_preds[:10]:
        recent.append({
            "match_id": p.match_id,
            "home": p.home_team,
            "away": p.away_team,
            "pick": p.predicted_winner,
            "confidence": round((p.confidence or 0.5) * 100),
            "result": "correct" if p.is_correct is True else "incorrect" if p.is_correct is False else "pending",
            "actual_winner": p.actual_winner,
        })

    return PredictionStatsResponse(
        total_predictions=total,
        correct=correct,
        incorrect=incorrect,
        pending=pending,
        accuracy_pct=accuracy,
        recent=recent,
    )


@router.get("/{match_id}", response_model=MatchPrediction)
async def get_prediction(match_id: str, db: Session = Depends(get_db)):
    """Get an AI-generated prediction for a specific match.
    Cached: 1h upcoming, 3min live, 24h completed.
    """
    _validate_match_id(match_id)

    match = await cricket_service.get_match_detail(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match_status = match.status.value if hasattr(match.status, 'value') else str(match.status)

    # Check cache first — saves Claude API calls
    cached = _cache_get_prediction(match_id, match_status)
    if cached:
        logger.debug(f"Prediction cache HIT for {match_id} (status={match_status})")
        return cached

    logger.info(f"Prediction cache MISS for {match_id} (status={match_status}) — calling Claude")
    prediction = await analyze_match(match)

    # Cache the prediction
    _cache_set_prediction(match_id, prediction, match_status)

    # Save to history for accuracy tracking
    _save_prediction(db, match_id, prediction)

    return prediction


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    chat_request: ChatRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Chat with the AI cricket analyst. Requires auth + daily limit."""
    # Server-side AI limit enforcement
    _check_ai_limit(db, current_user.id)

    # Log the request (for tracking + limit counting)
    _log_ai_request(db, current_user.id, chat_request.message)

    match = None
    if chat_request.match_id:
        _validate_match_id(chat_request.match_id)
        match = await cricket_service.get_match_detail(chat_request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

    response = await chat_about_cricket(chat_request.message, match)
    return response
