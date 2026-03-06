"""
Main API router that aggregates all endpoint routers.
"""

from fastapi import APIRouter

from app.api.matches import router as matches_router
from app.api.predictions import router as predictions_router
from app.api.standings import router as standings_router
from app.api.players import router as players_router

api_router = APIRouter()

api_router.include_router(matches_router)
api_router.include_router(predictions_router)
api_router.include_router(standings_router)
api_router.include_router(players_router)


@api_router.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}


@api_router.get("/status", tags=["health"])
async def api_status():
    """Check status of all external API connections."""
    from app.services.cricket_api import cricket_service
    from app.services.odds_service import check_odds_api_status

    cricket = await cricket_service.check_api_status()
    odds = await check_odds_api_status()

    return {
        "cricket_api": cricket,
        "odds_api": odds,
    }
