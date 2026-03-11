"""
Support chat endpoint — AI-powered help for confused users.
Explains app features, cricket basics, betting concepts, navigation.
FREE for all users (no premium limits).
"""

from fastapi import APIRouter

from app.models import SupportChatRequest, SupportChatResponse
from app.services.ai_analyzer import support_chat

router = APIRouter(prefix="/support", tags=["support"])


@router.post("/chat", response_model=SupportChatResponse)
async def chat_support(request: SupportChatRequest):
    """Chat with AI support assistant. Free for all users."""
    return await support_chat(request.message)
