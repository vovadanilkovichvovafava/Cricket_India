"""Session replay endpoints — receive rrweb chunks, serve replay data."""

import json
import logging
import random
from datetime import datetime, timezone, timedelta
from typing import List, Any, Optional

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.session_replay import SessionReplay, ReplayChunk

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["replay"])

MAX_TOTAL_SIZE = 2 * 1024 * 1024  # 2MB per session (sum of all chunks)
RETENTION_DAYS = 7


class ReplayChunkRequest(BaseModel):
    session_id: str
    events: List[Any] = []  # raw rrweb event dicts
    is_final: bool = False


def _extract_user_id(request: Request) -> Optional[int]:
    """Try to extract user_id from auth header."""
    from jose import jwt, JWTError
    from app.config import settings
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(auth.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        return int(payload.get("sub", 0)) or None
    except (JWTError, ValueError, TypeError):
        return None


@router.post("/replay")
async def store_replay_chunk(
    body: ReplayChunkRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receive a chunk of rrweb events — append-only, no decompression needed.
    Each flush creates a new ReplayChunk row. Fast O(1) writes.
    """
    if not body.events or not body.session_id:
        return {"ok": True, "events_total": 0, "capped": False}

    try:
        # Find or create session metadata
        replay = db.query(SessionReplay).filter(
            SessionReplay.session_id == body.session_id
        ).first()

        if replay and replay.total_size >= MAX_TOTAL_SIZE:
            return {"ok": True, "events_total": replay.total_events, "capped": True}

        # Serialize this chunk's events
        chunk_json = json.dumps(body.events, separators=(",", ":"))
        chunk_size = len(chunk_json.encode("utf-8"))
        chunk_events = len(body.events)

        # Check cap
        capped = False
        current_size = replay.total_size if replay else 0
        if current_size + chunk_size > MAX_TOTAL_SIZE:
            capped = True

        if not capped:
            # Create chunk row — simple INSERT, no reads needed
            chunk_index = replay.chunks_count if replay else 0
            chunk = ReplayChunk(
                session_id=body.session_id,
                chunk_index=chunk_index,
                events_json=chunk_json,
                events_count=chunk_events,
                size_bytes=chunk_size,
            )
            db.add(chunk)

            # Update or create session metadata
            if replay:
                replay.chunks_count += 1
                replay.total_events += chunk_events
                replay.total_size += chunk_size
                replay.updated_at = datetime.now(timezone.utc)
                if body.is_final or capped:
                    replay.is_complete = True
            else:
                replay = SessionReplay(
                    session_id=body.session_id,
                    user_id=_extract_user_id(request),
                    chunks_count=1,
                    total_events=chunk_events,
                    total_size=chunk_size,
                    is_complete=body.is_final,
                )
                db.add(replay)

            db.commit()

        total = replay.total_events if replay else chunk_events
        return {"ok": True, "events_total": total, "capped": capped}

    except Exception as e:
        logger.warning(f"Failed to store replay chunk: {e}")
        db.rollback()
        return {"ok": False, "error": str(e)}


def cleanup_old_replays(db: Session):
    """Remove replays older than RETENTION_DAYS. Called probabilistically."""
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
        # Delete chunks first
        old_sessions = db.query(SessionReplay.session_id).filter(
            SessionReplay.created_at < cutoff
        ).all()
        old_sids = [s[0] for s in old_sessions]
        if old_sids:
            db.query(ReplayChunk).filter(
                ReplayChunk.session_id.in_(old_sids)
            ).delete(synchronize_session=False)
            db.query(SessionReplay).filter(
                SessionReplay.session_id.in_(old_sids)
            ).delete(synchronize_session=False)
            db.commit()
            logger.info(f"Cleaned up {len(old_sids)} old session replays")
    except Exception as e:
        logger.warning(f"Replay cleanup failed: {e}")
        db.rollback()
