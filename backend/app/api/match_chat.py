"""
Match Chat & Poll API — live chat and "Pick the Winner" voting per match.
Uses in-memory storage with periodic JSON persistence.
"""

import logging
import json
import time
import os
from datetime import datetime, timezone
from typing import Optional, List
from collections import defaultdict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/matches", tags=["match-chat"])

# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────

class ChatMessage(BaseModel):
    id: Optional[str] = None
    user_name: str
    message: str
    timestamp: Optional[str] = None

class ChatMessageRequest(BaseModel):
    user_name: str
    message: str

class VoteRequest(BaseModel):
    user_id: str  # device fingerprint or anonymous ID
    vote: str     # "home", "draw", "away"

class VoteResult(BaseModel):
    home: int = 0
    draw: int = 0
    away: int = 0
    total: int = 0
    home_pct: int = 33
    draw_pct: int = 34
    away_pct: int = 33
    user_vote: Optional[str] = None

# ──────────────────────────────────────────────
# In-memory storage
# ──────────────────────────────────────────────

# { match_id: [ChatMessage, ...] }
_chat_messages: dict = defaultdict(list)

# { match_id: { user_id: "home"|"draw"|"away" } }
_votes: dict = defaultdict(dict)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'chat')

def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def _load_chat(match_id: str):
    """Load chat messages from disk if not in memory."""
    if match_id in _chat_messages:
        return
    _ensure_data_dir()
    path = os.path.join(DATA_DIR, f"{match_id}_chat.json")
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                data = json.load(f)
                _chat_messages[match_id] = [ChatMessage(**m) for m in data]
        except Exception as e:
            logger.warning(f"Failed to load chat for {match_id}: {e}")

def _save_chat(match_id: str):
    """Persist chat messages to disk."""
    _ensure_data_dir()
    path = os.path.join(DATA_DIR, f"{match_id}_chat.json")
    try:
        data = [m.model_dump() for m in _chat_messages[match_id][-200:]]  # Keep last 200
        with open(path, 'w') as f:
            json.dump(data, f)
    except Exception as e:
        logger.warning(f"Failed to save chat for {match_id}: {e}")

def _load_votes(match_id: str):
    """Load votes from disk if not in memory."""
    if match_id in _votes:
        return
    _ensure_data_dir()
    path = os.path.join(DATA_DIR, f"{match_id}_votes.json")
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                _votes[match_id] = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load votes for {match_id}: {e}")

def _save_votes(match_id: str):
    """Persist votes to disk."""
    _ensure_data_dir()
    path = os.path.join(DATA_DIR, f"{match_id}_votes.json")
    try:
        with open(path, 'w') as f:
            json.dump(_votes[match_id], f)
    except Exception as e:
        logger.warning(f"Failed to save votes for {match_id}: {e}")


def _calc_vote_result(match_id: str, user_id: Optional[str] = None) -> VoteResult:
    """Calculate vote percentages."""
    votes = _votes.get(match_id, {})
    home = sum(1 for v in votes.values() if v == "home")
    draw = sum(1 for v in votes.values() if v == "draw")
    away = sum(1 for v in votes.values() if v == "away")
    total = home + draw + away

    if total == 0:
        return VoteResult(home=0, draw=0, away=0, total=0,
                          home_pct=33, draw_pct=34, away_pct=33,
                          user_vote=votes.get(user_id))

    home_pct = round(home / total * 100)
    away_pct = round(away / total * 100)
    draw_pct = 100 - home_pct - away_pct  # Ensure 100%

    return VoteResult(
        home=home, draw=draw, away=away, total=total,
        home_pct=home_pct, draw_pct=draw_pct, away_pct=away_pct,
        user_vote=votes.get(user_id),
    )


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.get("/{match_id}/chat")
async def get_chat_messages(match_id: str, after: Optional[str] = None):
    """Get chat messages for a match, optionally after a timestamp."""
    _load_chat(match_id)
    messages = _chat_messages.get(match_id, [])

    if after:
        messages = [m for m in messages if m.timestamp and m.timestamp > after]

    # Return last 50 messages
    return {"messages": [m.model_dump() for m in messages[-50:]]}


@router.post("/{match_id}/chat")
async def post_chat_message(match_id: str, req: ChatMessageRequest):
    """Post a new chat message."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(req.message) > 500:
        raise HTTPException(status_code=400, detail="Message too long (max 500 chars)")

    _load_chat(match_id)

    msg = ChatMessage(
        id=f"{int(time.time() * 1000)}_{len(_chat_messages[match_id])}",
        user_name=req.user_name[:20],  # Limit username length
        message=req.message.strip()[:500],
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    _chat_messages[match_id].append(msg)

    # Keep only last 200 messages in memory
    if len(_chat_messages[match_id]) > 200:
        _chat_messages[match_id] = _chat_messages[match_id][-200:]

    _save_chat(match_id)

    return msg.model_dump()


@router.get("/{match_id}/vote")
async def get_votes(match_id: str, user_id: Optional[str] = None):
    """Get current vote results for a match."""
    _load_votes(match_id)
    return _calc_vote_result(match_id, user_id).model_dump()


@router.post("/{match_id}/vote")
async def cast_vote(match_id: str, req: VoteRequest):
    """Cast or change a vote."""
    if req.vote not in ("home", "draw", "away"):
        raise HTTPException(status_code=400, detail="Vote must be 'home', 'draw', or 'away'")

    _load_votes(match_id)
    _votes[match_id][req.user_id] = req.vote
    _save_votes(match_id)

    return _calc_vote_result(match_id, req.user_id).model_dump()
