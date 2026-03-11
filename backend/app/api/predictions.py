"""
AI prediction endpoints using Claude API for cricket match analysis.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models import MatchPrediction, ChatRequest, ChatResponse, PredictionStatsResponse
from app.models.prediction_history import PredictionHistory
from app.services.cricket_api import cricket_service
from app.services.ai_analyzer import analyze_match, chat_about_cricket
from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["predictions"])


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
            if not match or match.get("status") != "completed":
                continue
            # Try to extract winner from status_text (e.g., "CSK won by 5 wickets")
            status_text = (match.get("status_text") or match.get("statusText") or "").lower()
            winner = None
            for team_code in [record.home_team, record.away_team]:
                if team_code.lower() in status_text and "won" in status_text:
                    winner = team_code
                    break
            if not winner:
                # Try team names from match
                home_name = match.get("home_team", {}).get("name", "") if isinstance(match.get("home_team"), dict) else ""
                away_name = match.get("away_team", {}).get("name", "") if isinstance(match.get("away_team"), dict) else ""
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
    """Get an AI-generated prediction for a specific match."""
    match = await cricket_service.get_match_detail(match_id)
    if not match:
        raise HTTPException(status_code=404, detail=f"Match '{match_id}' not found")

    prediction = await analyze_match(match)

    # Save to history for accuracy tracking
    _save_prediction(db, match_id, prediction)

    return prediction


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the AI cricket analyst."""
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
