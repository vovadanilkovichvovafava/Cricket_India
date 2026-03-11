"""
Support chat endpoint — AI-powered help for confused users.
Explains app features, cricket basics, betting concepts, navigation.
FREE for all users but rate-limited to prevent abuse.
"""

from fastapi import APIRouter, Request

from app.models import SupportChatRequest, SupportChatResponse
from app.services.ai_analyzer import support_chat
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/support", tags=["support"])


@router.post("/chat", response_model=SupportChatResponse)
@limiter.limit("10/minute")
async def chat_support(request_body: SupportChatRequest, request: Request):
    """Chat with AI support assistant. Free but rate-limited."""
    # Truncate message to prevent abuse
    message = request_body.message[:1000].strip()
    if not message:
        return SupportChatResponse(message="Please provide a message.")

    return await support_chat(message)
