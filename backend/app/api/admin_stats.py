"""Admin stats endpoints — dashboard data, user analytics, predictions, chats, ML."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, text, desc, case
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.admin_auth import get_current_admin

router = APIRouter(tags=["admin-stats"])


# ── Overview (main dashboard) ──────────────────────

@router.get("/overview")
async def get_overview(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.user import User
    from app.models.prediction_history import PredictionHistory
    from app.models.chat import SupportChatMessage, AIChatMessage
    from app.models.analytics import AnalyticsEvent

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    fifteen_min_ago = now - timedelta(minutes=15)

    # Users
    total_users = db.query(func.count(User.id)).scalar() or 0
    new_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0

    # Online (users with analytics events in last 15 min)
    online = db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
        AnalyticsEvent.created_at >= fifteen_min_ago,
        AnalyticsEvent.user_id.isnot(None),
    ).scalar() or 0

    # Predictions
    total_predictions = db.query(func.count(PredictionHistory.id)).scalar() or 0
    preds_today = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.created_at >= today_start,
    ).scalar() or 0

    verified = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.is_correct.isnot(None),
    ).scalar() or 0
    correct = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.is_correct == True,
    ).scalar() or 0
    accuracy = round(correct / verified * 100, 1) if verified > 0 else 0

    # Support sessions
    support_sessions = db.query(func.count(func.distinct(SupportChatMessage.session_id))).scalar() or 0
    support_today = db.query(func.count(func.distinct(SupportChatMessage.session_id))).filter(
        SupportChatMessage.created_at >= today_start,
    ).scalar() or 0

    # AI chats today
    ai_chats_today = db.query(func.count(AIChatMessage.id)).filter(
        AIChatMessage.created_at >= today_start,
        AIChatMessage.role == "user",
    ).scalar() or 0

    return {
        "users": {
            "total": total_users,
            "new_today": new_today,
            "pro": 0,  # TODO: premium tracking
            "pro_new_today": 0,
            "online": online,
        },
        "predictions": {
            "total": total_predictions,
            "today": preds_today,
            "verified": verified,
            "correct": correct,
            "accuracy": accuracy,
        },
        "support_sessions": support_sessions,
        "support_sessions_today": support_today,
        "ai_chats_today": ai_chats_today,
        "cricket_api": {
            "used": 0,  # TODO: track API usage
            "limit": 100,
        },
    }


# ── Online history (24h) ───────────────────────────

@router.get("/online-history")
async def get_online_history(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.analytics import AnalyticsEvent

    now = datetime.now(timezone.utc)
    start = now - timedelta(hours=24)

    # SQLite-compatible hour extraction
    rows = db.execute(text("""
        SELECT strftime('%H:00', created_at) as hour,
               COUNT(DISTINCT user_id) as unique_users,
               COUNT(*) as total_events
        FROM analytics_events
        WHERE created_at >= :start AND user_id IS NOT NULL
        GROUP BY strftime('%H', created_at)
        ORDER BY hour
    """), {"start": start}).fetchall()

    hours = [{"hour": r[0], "unique_users": r[1], "total_events": r[2]} for r in rows]

    peak_users = max((h["unique_users"] for h in hours), default=0)
    peak_hour = next((h["hour"] for h in hours if h["unique_users"] == peak_users), "—")

    # Current online (last 15 min)
    fifteen_min_ago = now - timedelta(minutes=15)
    current_online = db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
        AnalyticsEvent.created_at >= fifteen_min_ago,
        AnalyticsEvent.user_id.isnot(None),
    ).scalar() or 0

    return {
        "hours": hours,
        "peak_users": peak_users,
        "peak_hour": peak_hour,
        "current_online": current_online,
    }


# ── Users stats ────────────────────────────────────

@router.get("/users")
async def get_users_stats(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.user import User

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Daily registrations (30 days)
    daily_rows = db.execute(text("""
        SELECT date(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= :start
        GROUP BY date(created_at)
        ORDER BY date
    """), {"start": thirty_days_ago}).fetchall()
    daily_registrations = [{"date": r[0], "count": r[1]} for r in daily_rows]

    # By country
    country_rows = db.execute(text("""
        SELECT country_code, COUNT(*) as count
        FROM users
        GROUP BY country_code
        ORDER BY count DESC
        LIMIT 10
    """)).fetchall()
    by_country = [{"country": r[0] or "Unknown", "count": r[1]} for r in country_rows]

    # Total referred
    total_referred = db.query(func.count(User.id)).filter(User.referral_count > 0).scalar() or 0

    # Recent users
    recent = db.query(User).order_by(desc(User.created_at)).limit(20).all()
    recent_users = [
        {
            "id": u.id,
            "phone": u.phone,
            "name": u.name,
            "country_code": u.country_code,
            "referral_count": u.referral_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in recent
    ]

    return {
        "daily_registrations": daily_registrations,
        "by_country": by_country,
        "by_language": [],  # TODO: add language tracking
        "total_referred": total_referred,
        "recent_users": recent_users,
    }


@router.get("/users/search")
async def search_users(
    q: str = Query("", description="Search phone, name"),
    status: str = Query("", description="Filter: pro, free"),
    sort: str = Query("created_at", description="Sort field"),
    page: int = Query(1, ge=1),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.user import User

    per_page = 25
    query = db.query(User)

    if q:
        query = query.filter(
            (User.phone.contains(q)) | (User.name.contains(q))
        )

    # Sort
    if sort == "created_at":
        query = query.order_by(desc(User.created_at))
    else:
        query = query.order_by(desc(User.created_at))

    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "per_page": per_page,
        "page": page,
        "users": [
            {
                "id": u.id,
                "phone": u.phone,
                "name": u.name,
                "country_code": u.country_code,
                "referral_count": u.referral_count,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@router.get("/users/{user_id}/profile")
async def get_user_profile(
    user_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.user import User
    from app.models.prediction_history import PredictionHistory
    from app.models.chat import AIChatMessage, SupportChatMessage

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Stats
    total_predictions = db.query(func.count(PredictionHistory.id)).scalar() or 0
    ai_sessions = db.query(func.count(AIChatMessage.id)).filter(
        AIChatMessage.user_id == user_id, AIChatMessage.role == "user",
    ).scalar() or 0
    support_sessions = db.query(func.count(func.distinct(SupportChatMessage.session_id))).filter(
        SupportChatMessage.user_id == user_id,
    ).scalar() or 0

    # Recent predictions
    recent_preds = db.query(PredictionHistory).order_by(
        desc(PredictionHistory.created_at)
    ).limit(10).all()

    return {
        "user": {
            "id": user.id,
            "phone": user.phone,
            "name": user.name,
            "country_code": user.country_code,
            "referral_code": user.referral_code,
            "referral_count": user.referral_count,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
        "stats": {
            "total_predictions": total_predictions,
            "ai_sessions": ai_sessions,
            "support_sessions": support_sessions,
            "referrals_count": user.referral_count,
        },
        "recent_predictions": [
            {
                "id": p.id,
                "home_team": p.home_team,
                "away_team": p.away_team,
                "predicted_winner": p.predicted_winner,
                "confidence": p.confidence,
                "is_correct": p.is_correct,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in recent_preds
        ],
    }


# ── Predictions stats ──────────────────────────────

@router.get("/predictions")
async def get_predictions_stats(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.prediction_history import PredictionHistory

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Daily predictions
    daily_rows = db.execute(text("""
        SELECT date(created_at) as date, COUNT(*) as count
        FROM prediction_history
        WHERE created_at >= :start
        GROUP BY date(created_at)
        ORDER BY date
    """), {"start": thirty_days_ago}).fetchall()
    daily_predictions = [{"date": r[0], "count": r[1]} for r in daily_rows]

    # Overall accuracy
    total = db.query(func.count(PredictionHistory.id)).scalar() or 0
    verified = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.is_correct.isnot(None)
    ).scalar() or 0
    correct = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.is_correct == True
    ).scalar() or 0

    # Confidence distribution
    high_conf = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.confidence >= 0.7
    ).scalar() or 0
    med_conf = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.confidence >= 0.5,
        PredictionHistory.confidence < 0.7,
    ).scalar() or 0
    low_conf = db.query(func.count(PredictionHistory.id)).filter(
        PredictionHistory.confidence < 0.5
    ).scalar() or 0

    return {
        "daily_predictions": daily_predictions,
        "total": total,
        "verified": verified,
        "correct": correct,
        "accuracy": round(correct / verified * 100, 1) if verified > 0 else 0,
        "confidence_distribution": {
            "high": high_conf,
            "medium": med_conf,
            "low": low_conf,
        },
        "by_bet_type": [],  # TODO: track by market type
    }


# ── Support stats ──────────────────────────────────

@router.get("/support")
async def get_support_stats(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.chat import SupportChatMessage

    total_messages = db.query(func.count(SupportChatMessage.id)).scalar() or 0
    total_sessions = db.query(func.count(func.distinct(SupportChatMessage.session_id))).scalar() or 0
    unique_users = db.query(func.count(func.distinct(SupportChatMessage.user_id))).filter(
        SupportChatMessage.user_id.isnot(None)
    ).scalar() or 0

    # Recent sessions
    recent_rows = db.execute(text("""
        SELECT session_id, user_id,
               COUNT(*) as msg_count,
               MAX(created_at) as last_msg_at
        FROM support_chat_messages
        GROUP BY session_id
        ORDER BY last_msg_at DESC
        LIMIT 20
    """)).fetchall()

    recent_sessions = [
        {
            "session_id": r[0],
            "user_id": r[1],
            "message_count": r[2],
            "last_message_at": r[3],
        }
        for r in recent_rows
    ]

    return {
        "total_messages": total_messages,
        "total_sessions": total_sessions,
        "unique_users": unique_users,
        "recent_sessions": recent_sessions,
    }


@router.get("/chats/support-sessions")
async def get_support_sessions(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    q: str = Query(""),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.chat import SupportChatMessage

    rows = db.execute(text("""
        SELECT session_id, user_id,
               COUNT(*) as msg_count,
               MIN(created_at) as first_msg,
               MAX(created_at) as last_msg
        FROM support_chat_messages
        GROUP BY session_id
        ORDER BY last_msg DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset}).fetchall()

    return [
        {
            "session_id": r[0],
            "user_id": r[1],
            "message_count": r[2],
            "first_message_at": r[3],
            "last_message_at": r[4],
        }
        for r in rows
    ]


@router.get("/chats/support-sessions/{session_id}")
async def get_support_session_messages(
    session_id: str,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.chat import SupportChatMessage

    messages = db.query(SupportChatMessage).filter(
        SupportChatMessage.session_id == session_id
    ).order_by(SupportChatMessage.created_at).all()

    return [
        {
            "id": m.id,
            "role": m.role,
            "message": m.message,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


# ── ML stats ──────────────────────────────────────

@router.get("/ml")
async def get_ml_stats(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.ml import MLModel, MLTrainingData, LearningLog

    models = db.query(MLModel).order_by(desc(MLModel.created_at)).limit(10).all()
    total_training = db.query(func.count(MLTrainingData.id)).scalar() or 0

    recent_logs = db.query(LearningLog).order_by(desc(LearningLog.created_at)).limit(20).all()

    return {
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "model_type": m.model_type,
                "accuracy": m.accuracy,
                "is_active": m.is_active,
                "training_samples": m.training_samples,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in models
        ],
        "total_training_data": total_training,
        "learning_log": [
            {
                "id": l.id,
                "event_type": l.event_type,
                "description": l.description,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in recent_logs
        ],
    }


# ── Traffic stats ──────────────────────────────────

@router.get("/traffic")
async def get_traffic_stats(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.analytics import TrackingParameter, BannerClick

    # Traffic by UTM source
    source_rows = db.execute(text("""
        SELECT utm_source, COUNT(*) as count
        FROM tracking_parameters
        WHERE utm_source IS NOT NULL AND utm_source != ''
        GROUP BY utm_source
        ORDER BY count DESC
        LIMIT 15
    """)).fetchall()

    by_source = [{"source": r[0], "count": r[1]} for r in source_rows]

    # Banner clicks
    total_banner_clicks = db.query(func.count(BannerClick.id)).scalar() or 0

    return {
        "by_source": by_source,
        "total_banner_clicks": total_banner_clicks,
    }
