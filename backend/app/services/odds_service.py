"""
Odds service — The Odds API integration.
Fetches real bookmaker odds from the-odds-api.com when API key is active.
Features:
  - Circuit breaker: stops all calls for 1h after quota/auth errors
  - Active sports caching: only queries sports that actually exist
  - Graceful degradation: returns None when API unavailable
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
CACHE_TTL = 600       # 10 min for odds data
SPORTS_CACHE_TTL = 3600  # 1h for available sports list

# Circuit breaker: stop all calls after quota/auth error
_circuit_breaker = {
    "open": False,
    "opened_at": 0.0,
    "cooldown": 3600,  # 1 hour
    "reason": "",
}

_cache: dict[str, tuple] = {}
_active_cricket_sports: list[str] = []
_sports_fetched_at: float = 0.0


def _is_circuit_open() -> bool:
    """Check if circuit breaker is open (API calls blocked)."""
    if not _circuit_breaker["open"]:
        return False
    elapsed = time.time() - _circuit_breaker["opened_at"]
    if elapsed > _circuit_breaker["cooldown"]:
        # Auto-reset after cooldown
        _circuit_breaker["open"] = False
        _circuit_breaker["reason"] = ""
        logger.info("Odds API circuit breaker reset — will retry")
        return False
    return True


def _trip_circuit(reason: str):
    """Open the circuit breaker to stop all API calls."""
    _circuit_breaker["open"] = True
    _circuit_breaker["opened_at"] = time.time()
    _circuit_breaker["reason"] = reason
    logger.warning(f"Odds API circuit breaker OPEN: {reason}. No calls for {_circuit_breaker['cooldown']}s")


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
# Active sports discovery (only query what exists)
# ──────────────────────────────────────────────

CRICKET_SPORT_KEYS_FALLBACK = [
    "cricket_ipl",
    "cricket_t20_world_cup",
    "cricket_odi",
    "cricket_t20_intl",
    "cricket_test_match",
    "cricket_big_bash",
    "cricket_psl",
    "cricket_caribbean_premier_league",
]


async def _get_active_cricket_sports() -> list[str]:
    """Fetch list of active cricket sports from API. Cached for 1 hour."""
    global _active_cricket_sports, _sports_fetched_at

    if _active_cricket_sports and (time.time() - _sports_fetched_at < SPORTS_CACHE_TTL):
        return _active_cricket_sports

    data = await _odds_api_request("sports", skip_circuit=True)
    if data and isinstance(data, list):
        cricket = [
            s["key"] for s in data
            if "cricket" in s.get("key", "") and s.get("active", False)
        ]
        _active_cricket_sports = cricket
        _sports_fetched_at = time.time()
        logger.info(f"Active cricket sports: {cricket}")
        return cricket

    # Fallback to hardcoded list if we can't fetch
    return CRICKET_SPORT_KEYS_FALLBACK


# ──────────────────────────────────────────────
# API request with circuit breaker
# ──────────────────────────────────────────────

async def _odds_api_request(
    endpoint: str,
    params: dict = None,
    skip_circuit: bool = False,
) -> Optional[dict | list]:
    """Make a request to The Odds API with circuit breaker protection."""
    if not settings.THE_ODDS_API_KEY:
        return None

    if not skip_circuit and _is_circuit_open():
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{ODDS_API_BASE}/{endpoint}",
                params={"apiKey": settings.THE_ODDS_API_KEY, **(params or {})},
            )

            if resp.status_code == 401:
                # Parse error body for details
                try:
                    err = resp.json()
                    error_code = err.get("error_code", "")
                    msg = err.get("message", "Unauthorized")
                except Exception:
                    error_code = "UNKNOWN"
                    msg = "401 Unauthorized"

                if error_code == "OUT_OF_USAGE_CREDITS":
                    _trip_circuit(f"Usage quota exhausted: {msg}")
                else:
                    _trip_circuit(f"Auth error: {msg}")
                return None

            if resp.status_code == 422:
                # Sport key doesn't exist or invalid params
                logger.info(f"Odds API {endpoint}: sport not available (422)")
                return None

            if resp.status_code != 200:
                logger.warning(f"Odds API {endpoint} returned {resp.status_code}")
                return None

            # Log remaining quota
            remaining = resp.headers.get("x-requests-remaining")
            used = resp.headers.get("x-requests-used")
            if remaining:
                logger.info(f"Odds API quota: {remaining} remaining, {used or '?'} used")
                # Pre-emptive circuit break if quota is very low
                try:
                    if int(remaining) <= 5:
                        _trip_circuit(f"Quota critically low: {remaining} requests left")
                except ValueError:
                    pass

            return resp.json()

    except httpx.TimeoutException:
        logger.warning(f"Odds API timeout: {endpoint}")
        return None
    except Exception as e:
        logger.warning(f"Odds API error: {e}")
        return None


# ──────────────────────────────────────────────
# Fetch odds
# ──────────────────────────────────────────────

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
    """Try to find odds for a specific match by team names.
    Only queries active cricket sports to save API quota."""

    if _is_circuit_open():
        return None

    active_sports = await _get_active_cricket_sports()
    if not active_sports:
        return None

    for sport_key in active_sports:
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
    if _is_circuit_open():
        return None

    active_sports = await _get_active_cricket_sports()
    if not active_sports:
        return None

    for sport_key in active_sports:
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
    """Check if The Odds API is accessible and return status."""
    if not settings.THE_ODDS_API_KEY:
        return {"status": "no_key", "message": "THE_ODDS_API_KEY not configured"}

    if _is_circuit_open():
        return {
            "status": "circuit_open",
            "message": _circuit_breaker["reason"],
            "resets_in": int(_circuit_breaker["cooldown"] - (time.time() - _circuit_breaker["opened_at"])),
        }

    data = await _odds_api_request("sports", skip_circuit=True)
    if data and isinstance(data, list):
        cricket = [s for s in data if "cricket" in s.get("key", "") and s.get("active", False)]
        return {
            "status": "connected",
            "cricket_sports": [{"key": s["key"], "title": s.get("title", "")} for s in cricket],
            "requests_remaining": None,
        }

    return {"status": "error", "message": "Failed to connect"}
