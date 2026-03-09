"""
Odds service — The Odds API integration.
Fetches real bookmaker odds from the-odds-api.com when API key is active.
Returns None when API is unavailable.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Optional

import httpx

from app.config import settings
from app.models import MatchOdds, BookmakerOdds, MatchTotals, TotalsOdds

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

ODDS_API_BASE = "https://api.the-odds-api.com/v4"
CACHE_TTL = 600  # 10 min

_cache: dict[str, tuple] = {}


def _cache_get(key: str):
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
        del _cache[key]
    return None


def _cache_set(key: str, data):
    _cache[key] = (data, time.time())


# ──────────────────────────────────────────────
# Available cricket sport keys on The Odds API
# ──────────────────────────────────────────────

CRICKET_SPORT_KEYS = [
    "cricket_t20_world_cup",
    "cricket_ipl",
    "cricket_test_match",
    "cricket_odi",
    "cricket_t20_intl",
    "cricket_big_bash",
    "cricket_psl",
    "cricket_caribbean_premier_league",
]


async def _odds_api_request(endpoint: str, params: dict = None) -> Optional[dict | list]:
    """Make a request to The Odds API."""
    if not settings.THE_ODDS_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{ODDS_API_BASE}/{endpoint}",
                params={"apiKey": settings.THE_ODDS_API_KEY, **(params or {})},
            )
            if resp.status_code != 200:
                logger.warning(f"Odds API {endpoint} returned {resp.status_code}")
                return None

            remaining = resp.headers.get("x-requests-remaining")
            if remaining:
                logger.info(f"Odds API quota: {remaining} remaining")

            return resp.json()
    except Exception as e:
        logger.warning(f"Odds API error: {e}")
        return None


async def fetch_cricket_odds(sport_key: str = "cricket_ipl") -> Optional[list[dict]]:
    """Fetch odds for a cricket sport from The Odds API."""
    cached = _cache_get(f"odds_{sport_key}")
    if cached is not None:
        return cached

    data = await _odds_api_request(
        f"sports/{sport_key}/odds",
        {
            "regions": "uk,eu,au",
            "markets": "h2h",
            "oddsFormat": "decimal",
        },
    )

    if data and isinstance(data, list):
        _cache_set(f"odds_{sport_key}", data)
        return data

    return None


async def get_odds_for_teams(home_name: str, away_name: str) -> Optional[MatchOdds]:
    """Try to find odds for a specific match by team names."""
    # Try each cricket sport key
    for sport_key in CRICKET_SPORT_KEYS:
        events = await fetch_cricket_odds(sport_key)
        if not events:
            continue

        home_low = home_name.lower()
        away_low = away_name.lower()

        for event in events:
            eh = event.get("home_team", "").lower()
            ea = event.get("away_team", "").lower()

            # Match if team names overlap
            if (home_low in eh or eh in home_low or away_low in ea or ea in away_low) and \
               (away_low in ea or ea in away_low or home_low in eh or eh in home_low):

                bookmakers = []
                for bm in event.get("bookmakers", []):
                    h2h = next((m for m in bm.get("markets", []) if m["key"] == "h2h"), None)
                    if not h2h:
                        continue

                    outcomes = {o["name"].lower(): o["price"] for o in h2h.get("outcomes", [])}
                    h_odds = outcomes.get(eh, outcomes.get(home_low, 1.90))
                    a_odds = outcomes.get(ea, outcomes.get(away_low, 1.90))

                    bookmakers.append(BookmakerOdds(
                        bookmaker=bm.get("title", bm.get("key", "Unknown")),
                        home_odds=float(h_odds),
                        away_odds=float(a_odds),
                        draw_odds=None,
                        last_updated=datetime.fromisoformat(
                            bm.get("last_update", datetime.utcnow().isoformat()).replace("Z", "+00:00")
                        ),
                    ))

                if bookmakers:
                    return MatchOdds(
                        home_team=home_name,
                        away_team=away_name,
                        bookmakers=bookmakers,
                        best_home_odds=max(b.home_odds for b in bookmakers),
                        best_away_odds=max(b.away_odds for b in bookmakers),
                    )

    return None


async def fetch_cricket_totals(sport_key: str = "cricket_ipl") -> Optional[list[dict]]:
    """Fetch totals (over/under) odds for a cricket sport."""
    cached = _cache_get(f"totals_{sport_key}")
    if cached is not None:
        return cached

    data = await _odds_api_request(
        f"sports/{sport_key}/odds",
        {
            "regions": "uk,eu,au",
            "markets": "totals",
            "oddsFormat": "decimal",
        },
    )

    if data and isinstance(data, list):
        _cache_set(f"totals_{sport_key}", data)
        return data

    return None


async def get_totals_for_teams(home_name: str, away_name: str) -> Optional[MatchTotals]:
    """Try to find totals (over/under) odds for a specific match by team names."""
    for sport_key in CRICKET_SPORT_KEYS:
        events = await fetch_cricket_totals(sport_key)
        if not events:
            continue

        home_low = home_name.lower()
        away_low = away_name.lower()

        for event in events:
            eh = event.get("home_team", "").lower()
            ea = event.get("away_team", "").lower()

            if (home_low in eh or eh in home_low) and (away_low in ea or ea in away_low):
                totals_list = []
                for bm in event.get("bookmakers", []):
                    totals_market = next(
                        (m for m in bm.get("markets", []) if m["key"] == "totals"), None
                    )
                    if not totals_market:
                        continue

                    outcomes = totals_market.get("outcomes", [])
                    over = next((o for o in outcomes if o.get("name") == "Over"), None)
                    under = next((o for o in outcomes if o.get("name") == "Under"), None)

                    if over and under:
                        totals_list.append(TotalsOdds(
                            bookmaker=bm.get("title", bm.get("key", "Unknown")),
                            point=float(over.get("point", 0)),
                            over_odds=float(over.get("price", 1.90)),
                            under_odds=float(under.get("price", 1.90)),
                            last_updated=datetime.fromisoformat(
                                bm.get("last_update", datetime.utcnow().isoformat()).replace("Z", "+00:00")
                            ),
                        ))

                if totals_list:
                    return MatchTotals(
                        home_team=home_name,
                        away_team=away_name,
                        totals=totals_list,
                    )

    return None


async def check_odds_api_status() -> dict:
    """Check if The Odds API is accessible."""
    if not settings.THE_ODDS_API_KEY:
        return {"status": "no_key", "message": "THE_ODDS_API_KEY not configured"}

    data = await _odds_api_request("sports")
    if data and isinstance(data, list):
        cricket = [s for s in data if "cricket" in s.get("key", "")]
        return {
            "status": "connected",
            "cricket_sports": [{"key": s["key"], "title": s.get("title", "")} for s in cricket],
            "requests_remaining": None,  # only in odds response headers
        }

    return {"status": "error", "message": "Failed to connect"}
