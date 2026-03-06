"""
Player endpoints — search and stats from CricAPI.
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.models import PlayerSearchResult, PlayerProfile
from app.services.cricket_api import cricket_service

router = APIRouter(prefix="/cricket/players", tags=["players"])


@router.get("/search", response_model=List[PlayerSearchResult])
async def search_players(
    q: str = Query(..., min_length=2, description="Player name to search"),
    offset: int = Query(0, ge=0),
):
    """Search for cricket players by name."""
    return await cricket_service.search_players(q, offset=offset)


@router.get("/{player_id}", response_model=PlayerProfile)
async def get_player(player_id: str):
    """Get full player profile with career statistics."""
    player = await cricket_service.get_player_info(player_id)
    if not player:
        raise HTTPException(status_code=404, detail=f"Player '{player_id}' not found")
    return player
