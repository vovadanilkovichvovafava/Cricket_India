"""Admin stats endpoints — dashboard data, user analytics, predictions, chats, ML."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, text, desc, case
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.admin_auth import get_current_admin
from app.config import settings
from app.services.cricket_api import get_api_usage as _get_cricket_api_usage

_is_pg = settings.DATABASE_URL.startswith("postgresql")

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
            "used": _get_cricket_api_usage(),
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

    # DB-agnostic hour extraction
    if _is_pg:
        sql = """
            SELECT to_char(created_at, 'HH24:00') as hour,
                   COUNT(DISTINCT user_id) as unique_users,
                   COUNT(*) as total_events
            FROM analytics_events
            WHERE created_at >= :start AND user_id IS NOT NULL
            GROUP BY to_char(created_at, 'HH24:00')
            ORDER BY hour
        """
    else:
        sql = """
            SELECT strftime('%H:00', created_at) as hour,
                   COUNT(DISTINCT user_id) as unique_users,
                   COUNT(*) as total_events
            FROM analytics_events
            WHERE created_at >= :start AND user_id IS NOT NULL
            GROUP BY strftime('%H', created_at)
            ORDER BY hour
        """
    rows = db.execute(text(sql), {"start": start}).fetchall()

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
        SELECT CAST(created_at AS DATE) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= :start
        GROUP BY CAST(created_at AS DATE)
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
    from app.models.chat import AIChatMessage

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Daily predictions
    daily_rows = db.execute(text("""
        SELECT CAST(created_at AS DATE) as date, COUNT(*) as count
        FROM prediction_history
        WHERE created_at >= :start
        GROUP BY CAST(created_at AS DATE)
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

    # AI Chat stats
    ai_chat_total = db.query(func.count(AIChatMessage.id)).filter(
        AIChatMessage.role == "user"
    ).scalar() or 0
    ai_chat_today = db.query(func.count(AIChatMessage.id)).filter(
        AIChatMessage.role == "user",
        AIChatMessage.created_at >= today_start,
    ).scalar() or 0
    ai_with_bets = db.query(func.count(AIChatMessage.id)).filter(
        AIChatMessage.role == "assistant",
        AIChatMessage.value_bets.isnot(None),
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
        "ai_chat": {
            "total_requests": ai_chat_total,
            "today": ai_chat_today,
            "with_value_bets": ai_with_bets,
        },
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


# ── AI Chat stats ──────────────────────────────────

@router.get("/chats/ai-stats")
async def get_ai_chat_stats(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.chat import AIChatMessage

    total_messages = db.query(func.count(AIChatMessage.id)).scalar() or 0
    total_user_msgs = db.query(func.count(AIChatMessage.id)).filter(
        AIChatMessage.role == "user"
    ).scalar() or 0
    unique_users = db.query(func.count(func.distinct(AIChatMessage.user_id))).scalar() or 0

    return {
        "total_messages": total_messages,
        "total_conversations": total_user_msgs,
        "unique_users": unique_users,
    }


@router.get("/chats/ai-sessions")
async def get_ai_sessions(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List AI chat sessions grouped by user."""
    rows = db.execute(text("""
        SELECT a.user_id,
               COALESCE(u.phone, CAST(a.user_id AS VARCHAR)) as user_phone,
               COALESCE(u.name, '') as user_name,
               COUNT(*) as msg_count,
               SUM(CASE WHEN a.role = 'user' THEN 1 ELSE 0 END) as user_msgs,
               MIN(a.created_at) as first_msg,
               MAX(a.created_at) as last_msg
        FROM ai_chat_messages a
        LEFT JOIN users u ON u.id = a.user_id
        GROUP BY a.user_id, u.phone, u.name
        ORDER BY last_msg DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset}).fetchall()

    return [
        {
            "user_id": r[0],
            "phone": r[1],
            "name": r[2],
            "message_count": r[3],
            "user_messages": r[4],
            "first_message_at": r[5],
            "last_message_at": r[6],
        }
        for r in rows
    ]


@router.get("/chats/ai-sessions/{user_id}")
async def get_ai_session_messages(
    user_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all AI chat messages for a specific user."""
    from app.models.chat import AIChatMessage

    messages = db.query(AIChatMessage).filter(
        AIChatMessage.user_id == user_id
    ).order_by(AIChatMessage.created_at).limit(200).all()

    return [
        {
            "id": m.id,
            "role": m.role,
            "message": m.message,
            "match_context": m.match_context,
            "value_bets": m.value_bets,
            "model_used": m.model_used,
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
    from app.models.analytics import TrackingParameter, BannerClick, AnalyticsEvent
    from app.models.user import User

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

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

    # --- Sessions (from analytics_events) ---
    sessions_today = db.execute(text("""
        SELECT COUNT(DISTINCT session_id)
        FROM analytics_events
        WHERE event_type = 'session_start' AND created_at >= :today
    """), {"today": today_start}).scalar() or 0

    # Avg session duration from session_end events
    if _is_pg:
        avg_duration_row = db.execute(text("""
            SELECT AVG((event_data->>'duration_ms')::float),
                   AVG((event_data->>'pages_visited')::float)
            FROM analytics_events
            WHERE event_type = 'session_end' AND created_at >= :today
        """), {"today": today_start}).fetchone()
    else:
        avg_duration_row = db.execute(text("""
            SELECT AVG(CAST(json_extract(event_data, '$.duration_ms') AS REAL)),
                   AVG(CAST(json_extract(event_data, '$.pages_visited') AS REAL))
            FROM analytics_events
            WHERE event_type = 'session_end' AND created_at >= :today
        """), {"today": today_start}).fetchone()

    avg_duration_ms = round(avg_duration_row[0] or 0) if avg_duration_row else 0
    avg_pages = round(avg_duration_row[1] or 0, 1) if avg_duration_row else 0

    # --- Top pages ---
    if _is_pg:
        top_pages_rows = db.execute(text("""
            SELECT event_data->>'path' as path,
                   COUNT(*) as views,
                   AVG((event_data->>'duration_ms')::float) as avg_duration
            FROM analytics_events
            WHERE event_type = 'page_view'
              AND event_data->>'path' IS NOT NULL
              AND created_at >= :start
            GROUP BY event_data->>'path'
            ORDER BY views DESC
            LIMIT 15
        """), {"start": today_start - timedelta(days=7)}).fetchall()
    else:
        top_pages_rows = db.execute(text("""
            SELECT json_extract(event_data, '$.path') as path,
                   COUNT(*) as views,
                   AVG(CAST(json_extract(event_data, '$.duration_ms') AS REAL)) as avg_duration
            FROM analytics_events
            WHERE event_type = 'page_view'
              AND json_extract(event_data, '$.path') IS NOT NULL
              AND created_at >= :start
            GROUP BY json_extract(event_data, '$.path')
            ORDER BY views DESC
            LIMIT 15
        """), {"start": today_start - timedelta(days=7)}).fetchall()

    top_pages = [
        {"path": r[0], "views": r[1], "avg_duration_ms": round(r[2] or 0)}
        for r in top_pages_rows
    ]

    # --- Banner funnel ---
    sessions_with_click = db.execute(text("""
        SELECT COUNT(DISTINCT session_id)
        FROM analytics_events
        WHERE event_type = 'banner_click' AND created_at >= :today
    """), {"today": today_start}).scalar() or 0

    if _is_pg:
        avg_time_to_click_row = db.execute(text("""
            SELECT AVG((event_data->>'session_duration_ms')::float)
            FROM analytics_events
            WHERE event_type = 'banner_click' AND created_at >= :today
        """), {"today": today_start}).scalar()
    else:
        avg_time_to_click_row = db.execute(text("""
            SELECT AVG(CAST(json_extract(event_data, '$.session_duration_ms') AS REAL))
            FROM analytics_events
            WHERE event_type = 'banner_click' AND created_at >= :today
        """), {"today": today_start}).scalar()

    banner_funnel = {
        "total_sessions": sessions_today,
        "with_banner_click": sessions_with_click,
        "avg_time_to_click_ms": round(avg_time_to_click_row or 0),
        "conversion_pct": round(sessions_with_click / sessions_today * 100, 1) if sessions_today > 0 else 0,
    }

    # --- Referrals ---
    total_referrers = db.query(func.count(User.id)).filter(User.referral_count > 0).scalar() or 0
    total_referred = db.query(func.coalesce(func.sum(User.referral_count), 0)).scalar() or 0

    top_referrers_rows = db.query(
        User.id, User.name, User.phone, User.referral_count
    ).filter(User.referral_count > 0).order_by(desc(User.referral_count)).limit(10).all()

    top_referrers = [
        {"name": r[1] or "—", "phone": r[2], "count": r[3]}
        for r in top_referrers_rows
    ]

    # --- Referral shares by channel ---
    if _is_pg:
        share_rows = db.execute(text("""
            SELECT event_data->>'channel' as channel, COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'share_referral'
            GROUP BY event_data->>'channel'
            ORDER BY count DESC
        """)).fetchall()
    else:
        share_rows = db.execute(text("""
            SELECT json_extract(event_data, '$.channel') as channel, COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'share_referral'
            GROUP BY json_extract(event_data, '$.channel')
            ORDER BY count DESC
        """)).fetchall()

    referral_shares_total = sum(r[1] for r in share_rows)
    referral_shares_by_channel = [{"channel": r[0] or "unknown", "count": r[1]} for r in share_rows]

    # --- Prediction shares ---
    if _is_pg:
        pred_share_rows = db.execute(text("""
            SELECT event_data->>'channel' as channel, COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'share_prediction'
            GROUP BY event_data->>'channel'
            ORDER BY count DESC
        """)).fetchall()
    else:
        pred_share_rows = db.execute(text("""
            SELECT json_extract(event_data, '$.channel') as channel, COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'share_prediction'
            GROUP BY json_extract(event_data, '$.channel')
            ORDER BY count DESC
        """)).fetchall()

    prediction_shares_total = sum(r[1] for r in pred_share_rows)

    # --- User journeys to banner click (top paths) ---
    if _is_pg:
        journey_rows = db.execute(text("""
            SELECT event_data->>'referrer_page' as page, COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'banner_click'
              AND event_data->>'referrer_page' IS NOT NULL
            GROUP BY event_data->>'referrer_page'
            ORDER BY count DESC
            LIMIT 10
        """)).fetchall()
    else:
        journey_rows = db.execute(text("""
            SELECT json_extract(event_data, '$.referrer_page') as page, COUNT(*) as count
            FROM analytics_events
            WHERE event_type = 'banner_click'
              AND json_extract(event_data, '$.referrer_page') IS NOT NULL
            GROUP BY json_extract(event_data, '$.referrer_page')
            ORDER BY count DESC
            LIMIT 10
        """)).fetchall()

    user_journeys = [{"path": r[0], "count": r[1]} for r in journey_rows]

    return {
        "sessions": {
            "total_today": sessions_today,
            "avg_duration_ms": avg_duration_ms,
            "avg_pages_per_session": avg_pages,
        },
        "top_pages": top_pages,
        "banner_funnel": banner_funnel,
        "referrals": {
            "total_referrers": total_referrers,
            "total_referred": total_referred,
            "top_referrers": top_referrers,
        },
        "referral_shares": {
            "total": referral_shares_total,
            "by_channel": referral_shares_by_channel,
        },
        "prediction_shares": {
            "total": prediction_shares_total,
            "by_channel": [{"channel": r[0] or "unknown", "count": r[1]} for r in pred_share_rows],
        },
        "user_journeys": user_journeys,
        "by_source": by_source,
        "total_banner_clicks": total_banner_clicks,
    }


# ── Session Replay (rrweb) ───

@router.get("/replay/{session_id}")
async def get_session_replay(
    session_id: str,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Merge all replay chunks and return rrweb events for admin playback."""
    import json as _json
    from app.models.session_replay import SessionReplay, ReplayChunk

    replay = db.query(SessionReplay).filter(
        SessionReplay.session_id == session_id
    ).first()

    if not replay:
        raise HTTPException(status_code=404, detail="No replay data for this session")

    # Fetch all chunks in order and merge events
    chunks = db.query(ReplayChunk).filter(
        ReplayChunk.session_id == session_id
    ).order_by(ReplayChunk.chunk_index.asc(), ReplayChunk.id.asc()).all()

    if not chunks:
        raise HTTPException(status_code=404, detail="No replay chunks found")

    all_events = []
    for chunk in chunks:
        try:
            events = _json.loads(chunk.events_json)
            if isinstance(events, list):
                all_events.extend(events)
        except Exception:
            continue

    if not all_events:
        raise HTTPException(status_code=404, detail="No valid replay events")

    return {
        "session_id": session_id,
        "events": all_events,
        "events_count": len(all_events),
        "chunks": len(chunks),
        "size_bytes": replay.total_size,
        "is_complete": replay.is_complete,
    }


# ── Recent visits (Yandex Metrika-style table) ───

# Own domains to filter from referrer display
_OWN_DOMAINS = {"prescoreai.app", "www.prescoreai.app", "cricketbaazi.com",
                "www.cricketbaazi.com", "localhost"}


def _is_own_referrer(ref: str) -> bool:
    """Check if referrer is from own domain or Cloudflare Tunnel."""
    if not ref:
        return False
    try:
        from urllib.parse import urlparse
        host = urlparse(ref).hostname or ""
        if host in _OWN_DOMAINS:
            return True
        if host.endswith(".trycloudflare.com") or host.endswith(".cloudflare.com"):
            return True
    except Exception:
        pass
    return False


@router.get("/recent-visits")
async def get_recent_visits(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Return recent visit sessions with aggregated data:
    time, activity, duration, page views, referrer, country, device, goals.
    Similar to Yandex Metrika's visitor table.
    """
    from app.models.analytics import AnalyticsEvent
    import json as _json

    now = datetime.now(timezone.utc)
    live_threshold = now - timedelta(minutes=30)

    # Get distinct recent sessions from session_start events
    if _is_pg:
        sessions_sql = """
            SELECT
                s.session_id,
                s.created_at as visit_time,
                s.user_id,
                s.ip_address,
                s.user_agent,
                s.country,
                s.event_data->>'landing_page' as landing_page,
                s.event_data->>'referrer' as referrer,
                s.event_data->>'utm_source' as utm_source,

                -- Duration from session_end event (NULL if still live)
                (SELECT (e2.event_data->>'duration_ms')::int
                 FROM analytics_events e2
                 WHERE e2.session_id = s.session_id AND e2.event_type = 'session_end'
                 ORDER BY e2.created_at DESC LIMIT 1) as duration_ms,

                -- Page views count
                (SELECT COUNT(*) FROM analytics_events e3
                 WHERE e3.session_id = s.session_id AND e3.event_type = 'page_view') as page_views,

                -- Banner clicks (goals)
                (SELECT COUNT(*) FROM analytics_events e4
                 WHERE e4.session_id = s.session_id AND e4.event_type = 'banner_click') as goals,

                -- Total events (for activity indicator)
                (SELECT COUNT(*) FROM analytics_events e5
                 WHERE e5.session_id = s.session_id) as total_events,

                -- Has session_end? (for is_live detection)
                (SELECT COUNT(*) FROM analytics_events e_end
                 WHERE e_end.session_id = s.session_id AND e_end.event_type = 'session_end') as has_end,

                -- Pages list (for expandable detail)
                (SELECT json_agg(json_build_object(
                    'path', e7.event_data->>'path',
                    'duration_ms', (e7.event_data->>'duration_ms')::int
                 ) ORDER BY e7.created_at)
                 FROM analytics_events e7
                 WHERE e7.session_id = s.session_id AND e7.event_type = 'page_view') as pages_json,

                -- Last activity time (most recent event in session)
                (SELECT MAX(e8.created_at)
                 FROM analytics_events e8
                 WHERE e8.session_id = s.session_id) as last_activity

            FROM analytics_events s
            WHERE s.event_type = 'session_start'
            ORDER BY s.created_at DESC
            LIMIT :limit OFFSET :offset
        """
    else:
        sessions_sql = """
            SELECT
                s.session_id,
                s.created_at as visit_time,
                s.user_id,
                s.ip_address,
                s.user_agent,
                s.country,
                json_extract(s.event_data, '$.landing_page') as landing_page,
                json_extract(s.event_data, '$.referrer') as referrer,
                json_extract(s.event_data, '$.utm_source') as utm_source,

                (SELECT CAST(json_extract(e2.event_data, '$.duration_ms') AS INTEGER)
                 FROM analytics_events e2
                 WHERE e2.session_id = s.session_id AND e2.event_type = 'session_end'
                 ORDER BY e2.created_at DESC LIMIT 1) as duration_ms,

                (SELECT COUNT(*) FROM analytics_events e3
                 WHERE e3.session_id = s.session_id AND e3.event_type = 'page_view') as page_views,

                (SELECT COUNT(*) FROM analytics_events e4
                 WHERE e4.session_id = s.session_id AND e4.event_type = 'banner_click') as goals,

                (SELECT COUNT(*) FROM analytics_events e5
                 WHERE e5.session_id = s.session_id) as total_events,

                (SELECT COUNT(*) FROM analytics_events e_end
                 WHERE e_end.session_id = s.session_id AND e_end.event_type = 'session_end') as has_end,

                (SELECT json_group_array(json_object(
                    'path', json_extract(e7.event_data, '$.path'),
                    'duration_ms', CAST(json_extract(e7.event_data, '$.duration_ms') AS INTEGER)
                 ))
                 FROM analytics_events e7
                 WHERE e7.session_id = s.session_id AND e7.event_type = 'page_view'
                 ORDER BY e7.created_at) as pages_json,

                (SELECT MAX(e8.created_at)
                 FROM analytics_events e8
                 WHERE e8.session_id = s.session_id) as last_activity

            FROM analytics_events s
            WHERE s.event_type = 'session_start'
            ORDER BY s.created_at DESC
            LIMIT :limit OFFSET :offset
        """

    rows = db.execute(text(sessions_sql), {"limit": limit, "offset": offset}).fetchall()

    # Total count
    total = db.execute(text(
        "SELECT COUNT(*) FROM analytics_events WHERE event_type = 'session_start'"
    )).scalar() or 0

    # --- Compute visit numbers with 30-min gap logic ---
    # Group all user_id/ip combos, then count distinct "real visits"
    # by checking time gaps between session_starts (>30min = new visit).
    # We do this in Python to avoid complex SQL window functions.
    visitor_sessions = {}  # key: (user_id or ip) -> list of (session_id, created_at)
    for r in rows:
        key = f"u:{r[2]}" if r[2] else f"ip:{r[3]}"
        visitor_sessions.setdefault(key, [])

    # Fetch ALL session_starts for these visitors (to count real visits)
    visitor_keys_user = [r[2] for r in rows if r[2]]
    visitor_keys_ip = [r[3] for r in rows if not r[2] and r[3]]

    # Build visit_number cache: session_id -> visit_number
    visit_number_cache = {}

    if visitor_keys_user or visitor_keys_ip:
        # Fetch historical session starts for these visitors
        conditions = []
        params = {}
        if visitor_keys_user:
            # Use IN with individual params for PG compatibility
            user_placeholders = ", ".join(f":uid_{i}" for i in range(len(visitor_keys_user)))
            conditions.append(f"(user_id IN ({user_placeholders}))")
            for i, uid in enumerate(visitor_keys_user):
                params[f"uid_{i}"] = uid
        if visitor_keys_ip:
            ip_placeholders = ", ".join(f":ip_{i}" for i in range(len(visitor_keys_ip)))
            conditions.append(f"(user_id IS NULL AND ip_address IN ({ip_placeholders}))")
            for i, ip in enumerate(visitor_keys_ip):
                params[f"ip_{i}"] = ip

        where_clause = " OR ".join(conditions)
        hist_sql = f"""
            SELECT session_id, user_id, ip_address, created_at
            FROM analytics_events
            WHERE event_type = 'session_start' AND ({where_clause})
            ORDER BY created_at ASC
        """
        hist_rows = db.execute(text(hist_sql), params).fetchall()

        # Group by visitor key
        visitor_history = {}
        for hr in hist_rows:
            key = f"u:{hr[1]}" if hr[1] else f"ip:{hr[2]}"
            visitor_history.setdefault(key, []).append((hr[0], hr[3]))

        # Assign visit numbers: each session >30min after previous = new visit
        GAP_MINUTES = 30
        for key, sessions in visitor_history.items():
            visit_num = 1
            prev_time = None
            for sid, created_at in sessions:
                if prev_time:
                    # Parse if string
                    if isinstance(created_at, str):
                        try:
                            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                        except Exception:
                            pass
                    if isinstance(prev_time, str):
                        try:
                            prev_time = datetime.fromisoformat(prev_time.replace("Z", "+00:00"))
                        except Exception:
                            pass
                    try:
                        if (created_at - prev_time).total_seconds() > GAP_MINUTES * 60:
                            visit_num += 1
                    except Exception:
                        visit_num += 1
                visit_number_cache[sid] = visit_num
                prev_time = created_at

    visits = []
    for r in rows:
        # Parse user-agent for OS / browser
        ua = r[4] or ""
        os_name = "Unknown"
        browser = "Unknown"
        if "Android" in ua:
            os_name = "Android"
        elif "iPhone" in ua or "iPad" in ua:
            os_name = "iOS"
        elif "Windows" in ua:
            os_name = "Windows"
        elif "Mac" in ua:
            os_name = "macOS"
        elif "Linux" in ua:
            os_name = "Linux"

        if "Chrome" in ua and "Edg" not in ua:
            browser = "Chrome"
        elif "Safari" in ua and "Chrome" not in ua:
            browser = "Safari"
        elif "Firefox" in ua:
            browser = "Firefox"
        elif "Edg" in ua:
            browser = "Edge"

        # Parse pages json (index 14 in old query, now 14 = pages_json)
        pages = []
        if r[14]:
            try:
                pages = _json.loads(r[14]) if isinstance(r[14], str) else r[14]
                if not isinstance(pages, list):
                    pages = []
            except Exception:
                pages = []

        # Activity level (1-5 dots based on total events)
        events_count = r[12] or 0
        if events_count <= 2:
            activity = 1
        elif events_count <= 5:
            activity = 2
        elif events_count <= 10:
            activity = 3
        elif events_count <= 20:
            activity = 4
        else:
            activity = 5

        # Detect "live" session: no session_end AND last activity within 30 min
        has_end = (r[13] or 0) > 0  # has_end count
        last_activity = r[15]  # last_activity timestamp
        is_live = False
        if not has_end:
            try:
                if isinstance(last_activity, str):
                    last_activity_dt = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
                else:
                    last_activity_dt = last_activity
                if last_activity_dt and last_activity_dt >= live_threshold:
                    is_live = True
            except Exception:
                pass

        # For live sessions without duration, calculate from session_start to now
        duration_ms = r[9] or 0
        if is_live and not duration_ms:
            try:
                visit_time = r[1]
                if isinstance(visit_time, str):
                    visit_time = datetime.fromisoformat(visit_time.replace("Z", "+00:00"))
                if visit_time:
                    duration_ms = int((now - visit_time).total_seconds() * 1000)
            except Exception:
                pass

        # Filter own-domain referrer
        referrer = r[7] or ""
        if _is_own_referrer(referrer):
            referrer = ""

        visits.append({
            "session_id": r[0],
            "visit_time": r[1].isoformat() if hasattr(r[1], 'isoformat') else str(r[1]),
            "user_id": r[2],
            "country": r[5] or "—",
            "os": os_name,
            "browser": browser,
            "landing_page": r[6] or "/",
            "referrer": referrer,
            "utm_source": r[8] or "",
            "duration_ms": duration_ms,
            "page_views": r[10] or 0,
            "goals": r[11] or 0,
            "activity": activity,
            "visit_number": visit_number_cache.get(r[0], 1),
            "is_live": is_live,
            "pages": pages,
        })

    return {
        "total": total,
        "visits": visits,
    }


# ── Traffic Sources (registrations by source) ──────────────────────

@router.get("/traffic-sources")
async def get_traffic_sources(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Registrations breakdown by traffic_source: totals, today, premium, 14-day trend."""
    from app.models.user import User

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # --- Summary per source ---
    rows = db.query(
        func.coalesce(User.traffic_source, "unknown"),
        func.count(User.id),
        func.sum(case((User.created_at >= today_start, 1), else_=0)),
        func.sum(case((User.is_premium == True, 1), else_=0)),
    ).group_by(func.coalesce(User.traffic_source, "unknown")).all()

    sources = []
    for source, total, today, premium in rows:
        sources.append({
            "source": source,
            "total": total or 0,
            "today": int(today or 0),
            "premium": int(premium or 0),
        })

    # Sort: most users first
    sources.sort(key=lambda s: s["total"], reverse=True)

    # --- 14-day trend per source ---
    fourteen_days_ago = now - timedelta(days=14)

    if _is_pg:
        trend_sql = """
            SELECT
                DATE(created_at) as day,
                COALESCE(traffic_source, 'unknown') as src,
                COUNT(*) as cnt
            FROM users
            WHERE created_at >= :since
            GROUP BY DATE(created_at), COALESCE(traffic_source, 'unknown')
            ORDER BY day
        """
    else:
        trend_sql = """
            SELECT
                DATE(created_at) as day,
                COALESCE(traffic_source, 'unknown') as src,
                COUNT(*) as cnt
            FROM users
            WHERE created_at >= :since
            GROUP BY DATE(created_at), COALESCE(traffic_source, 'unknown')
            ORDER BY day
        """

    trend_rows = db.execute(text(trend_sql), {"since": fourteen_days_ago}).fetchall()

    # Build day -> {source: count} map
    all_sources = {s["source"] for s in sources}
    trend = []
    day_map = {}
    for day, src, cnt in trend_rows:
        day_str = str(day)
        if day_str not in day_map:
            day_map[day_str] = {"date": day_str}
        day_map[day_str][src] = cnt

    # Fill missing days
    for i in range(14):
        d = (now - timedelta(days=13 - i)).strftime("%Y-%m-%d")
        entry = day_map.get(d, {"date": d})
        for s in all_sources:
            entry.setdefault(s, 0)
        trend.append(entry)

    return {
        "sources": sources,
        "trend": trend,
    }
