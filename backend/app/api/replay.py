"""Session replay endpoints — receive rrweb chunks, serve replay data."""

import gzip
import json
import logging
import random
from datetime import datetime, timezone, timedelta
from typing import List, Any, Optional

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.session_replay import SessionReplay

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["replay"])

MAX_UNCOMPRESSED_SIZE = 2 * 1024 * 1024  # 2MB per session
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
    """Receive a chunk of rrweb events and append to session replay."""
    if not body.events or not body.session_id:
        return {"ok": True, "events_total": 0, "capped": False}

    try:
        # Find or create replay record
        replay = db.query(SessionReplay).filter(
            SessionReplay.session_id == body.session_id
        ).first()

        if replay and replay.uncompressed_size >= MAX_UNCOMPRESSED_SIZE:
            return {"ok": True, "events_total": replay.events_count, "capped": True}

        # Deserialize existing events
        existing_events = []
        if replay and replay.events_gz:
            try:
                existing_events = json.loads(gzip.decompress(replay.events_gz))
            except Exception:
                existing_events = []

        # Append new events
        all_events = existing_events + body.events
        raw_json = json.dumps(all_events, separators=(",", ":"))
        new_size = len(raw_json.encode("utf-8"))

        # Enforce cap
        capped = False
        if new_size > MAX_UNCOMPRESSED_SIZE:
            # Truncate: keep only what fits
            all_events = existing_events + body.events[:max(1, len(body.events) // 2)]
            raw_json = json.dumps(all_events, separators=(",", ":"))
            new_size = len(raw_json.encode("utf-8"))
            capped = True

        compressed = gzip.compress(raw_json.encode("utf-8"), compresslevel=6)

        if replay:
            replay.events_gz = compressed
            replay.events_count = len(all_events)
            replay.uncompressed_size = new_size
            replay.updated_at = datetime.now(timezone.utc)
            if body.is_final or capped:
                replay.is_complete = True
        else:
            replay = SessionReplay(
                session_id=body.session_id,
                user_id=_extract_user_id(request),
                events_gz=compressed,
                events_count=len(all_events),
                uncompressed_size=new_size,
                is_complete=body.is_final or capped,
            )
            db.add(replay)

        db.commit()

        # Probabilistic cleanup (~1% of requests)
        if random.random() < 0.01:
            _cleanup_old_replays(db)

        return {"ok": True, "events_total": len(all_events), "capped": capped}

    except Exception as e:
        logger.warning(f"Failed to store replay chunk: {e}")
        db.rollback()
        return {"ok": False, "error": str(e)}


def _cleanup_old_replays(db: Session):
    """Remove replays older than RETENTION_DAYS."""
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
        deleted = db.query(SessionReplay).filter(
            SessionReplay.created_at < cutoff
        ).delete()
        if deleted:
            db.commit()
            logger.info(f"Cleaned up {deleted} old session replays")
    except Exception as e:
        logger.warning(f"Replay cleanup failed: {e}")
        db.rollback()
