"""
Cricket match endpoints — all cricket, powered by CricAPI + The Odds API.
"""
from __future__ import annotations

import asyncio
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models import MatchSummary, MatchDetail, Series
from app.services.cricket_api import cricket_service
from app.services.odds_service import get_odds_for_teams

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cricket", tags=["cricket"])


async def _enrich_with_odds(matches: list[MatchSummary]) -> list[MatchSummary]:
    """Enrich matches with odds from The Odds API (best-effort, non-blocking)."""
    # Only enrich upcoming/live matches (no point for completed)
    to_enrich = [m for m in matches if m.status != "completed" and m.odds is None]
    if not to_enrich:
        return matches

    tasks = [get_odds_for_teams(m.home_team.name, m.away_team.name) for m in to_enrich]
    try:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for match, odds in zip(to_enrich, results):
            if odds and not isinstance(odds, Exception):
                match.odds = odds
    except Exception as e:
        logger.warning(f"Odds enrichment failed: {e}")

    return matches


@router.get("/matches", response_model=List[MatchSummary])
async def get_matches(
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """Get upcoming/recent cricket matches from all series."""
    matches = await cricket_service.get_matches(offset=offset)
    return await _enrich_with_odds(matches)


@router.get("/matches/live", response_model=List[MatchSummary])
async def get_live_matches():
    """Get currently active cricket matches (live + recently completed)."""
    matches = await cricket_service.get_current_matches()
    return await _enrich_with_odds(matches)


@router.get("/matches/{match_id}", response_model=MatchDetail)
async def get_match_detail(match_id: str):
    """Get detailed info for a specific match."""
    match = await cricket_service.get_match_detail(match_id)
    if not match:
        raise HTTPException(status_code=404, detail=f"Match '{match_id}' not found")
    # Enrich single match with odds
    if match.status != "completed" and match.odds is None:
        try:
            odds = await get_odds_for_teams(match.home_team.name, match.away_team.name)
            if odds:
                match.odds = odds
        except Exception as e:
            logger.warning(f"Odds for {match_id}: {e}")
    return match


@router.get("/series", response_model=List[Series])
async def get_series(
    search: Optional[str] = Query(None, description="Search by name, e.g. 'IPL'"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """Get list of cricket series/events."""
    return await cricket_service.get_series(search=search, offset=offset)


@router.get("/series/{series_id}/matches", response_model=List[MatchSummary])
async def get_series_matches(series_id: str):
    """Get all matches in a specific series/event."""
    matches = await cricket_service.get_series_matches(series_id)
    if not matches:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found or has no matches")
    return await _enrich_with_odds(matches)
