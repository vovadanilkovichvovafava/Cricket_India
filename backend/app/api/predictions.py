"""
AI prediction endpoints using Claude API for cricket match analysis.
"""

from fastapi import APIRouter, HTTPException

from app.models import MatchPrediction, ChatRequest, ChatResponse
from app.services.cricket_api import cricket_service
from app.services.ai_analyzer import analyze_match, chat_about_cricket

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/{match_id}", response_model=MatchPrediction)
async def get_prediction(match_id: str):
    """
    Get an AI-generated prediction for a specific match.

    Returns:
    - Predicted winner with probability and confidence
    - Key factors influencing the prediction
    - Value bets identified by the AI
    - Detailed analysis text

    Uses Claude API when CLAUDE_API_KEY is configured,
    otherwise returns mock predictions.
    """
    match = await cricket_service.get_match_detail(match_id)
    if not match:
        raise HTTPException(status_code=404, detail=f"Match '{match_id}' not found")

    prediction = await analyze_match(match)
    return prediction


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the AI cricket analyst.

    Send a message about cricket, IPL, betting strategy, or
    ask about a specific match by including match_id.

    The AI is specialized in:
    - Match predictions and analysis
    - Odds comparison and value identification
    - Player and team statistics
    - Venue and pitch analysis
    - Betting strategy advice

    Uses Claude API when CLAUDE_API_KEY is configured,
    otherwise returns mock responses.
    """
    match = None
    if request.match_id:
        match = await cricket_service.get_match_detail(request.match_id)
        if not match:
            raise HTTPException(
                status_code=404,
                detail=f"Match '{request.match_id}' not found",
            )

    response = await chat_about_cricket(request.message, match)
    return response
