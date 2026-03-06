"""
Standings endpoint — real data from CricAPI series_points.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models import StandingsResponse
from app.services.cricket_api import cricket_service

router = APIRouter(prefix="/cricket", tags=["standings"])


@router.get("/standings/{series_id}", response_model=StandingsResponse)
async def get_series_standings(series_id: str):
    """Get points table / standings for a cricket series."""
    result = await cricket_service.get_series_points(series_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"No standings for series '{series_id}'")
    return result


@router.get("/standings", response_model=StandingsResponse)
async def get_standings(
    series_id: Optional[str] = Query(None, description="Series ID (defaults to latest IPL)"),
):
    """Get standings — if no series_id, search for latest IPL."""
    if series_id:
        result = await cricket_service.get_series_points(series_id)
        if result:
            return result
        raise HTTPException(status_code=404, detail=f"No standings for series '{series_id}'")

    # Auto-find latest IPL series
    series_list = await cricket_service.get_series(search="IPL")
    for s in series_list:
        if "indian premier league" in s.name.lower() or "ipl" in s.name.lower():
            result = await cricket_service.get_series_points(s.id)
            if result and result.standings:
                return result

    raise HTTPException(status_code=404, detail="No IPL standings found")
