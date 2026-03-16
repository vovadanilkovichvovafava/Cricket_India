"""
Support chat endpoint — AI-powered help for confused users.
Explains app features, cricket basics, betting concepts, navigation.
FREE for all users but rate-limited to prevent abuse.
"""

import logging
import uuid

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from app.models import SupportChatRequest, SupportChatResponse
from app.models.chat import SupportChatMessage
from app.services.ai_analyzer import support_chat
from app.core.database import get_db
from app.core.rate_limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/support", tags=["support"])


def _log_support_message(db: Session, session_id: str, role: str, message: str, user_id=None):
    """Persist a support chat message."""
    try:
        record = SupportChatMessage(
            user_id=user_id,
            session_id=session_id,
            role=role,
            message=message[:5000],
        )
        db.add(record)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to log support message: {e}")
        db.rollback()


@router.post("/chat", response_model=SupportChatResponse)
@limiter.limit("10/minute")
async def chat_support(
    request_body: SupportChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Chat with AI support assistant. Free but rate-limited."""
    message = request_body.message[:1000].strip()
    if not message:
        return SupportChatResponse(response="Please provide a message.")

    session_id = request_body.session_id or str(uuid.uuid4())

    # Save user message
    _log_support_message(db, session_id, "user", message)

    response = await support_chat(message)

    # Save assistant response
    _log_support_message(db, session_id, "assistant", response.response)

    return response
