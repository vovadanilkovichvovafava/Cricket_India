"""
Cricket data service — pure CricAPI integration (cricketdata.org / api.cricapi.com).
All match data comes from the API. No mock data.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Optional

import httpx

from app.config import settings
from app.models import (
    MatchSummary,
    MatchDetail,
    TeamInfo,
    MatchStatus,
    InningsScore,
    Series,
    TeamStanding,
    StandingsResponse,
    PlayerSearchResult,
    PlayerProfile,
    PlayerStat,
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# CricAPI configuration
# ──────────────────────────────────────────────

CRICAPI_BASE = "https://api.cricapi.com/v1"
CACHE_TTL = 300  # 5 min cache (free tier: 100 hits/day)

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
# Known IPL team metadata (for color enrichment)
# ──────────────────────────────────────────────

IPL_TEAM_META = {
    "CSK": {"name": "Chennai Super Kings", "color": "#FCCA06"},
    "MI": {"name": "Mumbai Indians", "color": "#004BA0"},
    "RCB": {"name": "Royal Challengers Bengaluru", "color": "#EC1C24"},
    "KKR": {"name": "Kolkata Knight Riders", "color": "#3A225D"},
    "DC": {"name": "Delhi Capitals", "color": "#004C93"},
    "SRH": {"name": "Sunrisers Hyderabad", "color": "#F7A721"},
    "RR": {"name": "Rajasthan Royals", "color": "#EA1A85"},
    "PBKS": {"name": "Punjab Kings", "color": "#ED1B24"},
    "LSG": {"name": "Lucknow Super Giants", "color": "#A72056"},
    "GT": {"name": "Gujarat Titans", "color": "#1C1C1C"},
}

# Map full team names → IPL codes (for enrichment)
_NAME_TO_IPL_CODE = {
    "chennai super kings": "CSK",
    "mumbai indians": "MI",
    "royal challengers bengaluru": "RCB",
    "royal challengers bangalore": "RCB",
    "kolkata knight riders": "KKR",
    "delhi capitals": "DC",
    "sunrisers hyderabad": "SRH",
    "rajasthan royals": "RR",
    "punjab kings": "PBKS",
    "kings xi punjab": "PBKS",
    "lucknow super giants": "LSG",
    "gujarat titans": "GT",
}


def _resolve_ipl_code(name: str) -> Optional[str]:
    """Try to resolve a team name to an IPL code. Returns None for non-IPL teams.
    Only exact matches — no fuzzy/substring matching to avoid false positives
    (e.g. South African 'Titans' should NOT match 'Gujarat Titans').
    """
    low = name.strip().lower()
    if low in _NAME_TO_IPL_CODE:
        return _NAME_TO_IPL_CODE[low]
    upper = name.strip().upper()
    if upper in IPL_TEAM_META:
        return upper
    return None


# ──────────────────────────────────────────────
# CricAPI HTTP client
# ──────────────────────────────────────────────

async def _cricapi_request(endpoint: str, params: dict = None) -> Optional[dict]:
    """Make a request to CricAPI. Returns None on failure."""
    if not settings.CRICKET_API_KEY:
        logger.warning("CRICKET_API_KEY not configured")
        return None

    url = f"{CRICAPI_BASE}/{endpoint}"
    query = {"apikey": settings.CRICKET_API_KEY, **(params or {})}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=query)
            if resp.status_code != 200:
                logger.warning(f"CricAPI {endpoint} returned {resp.status_code}")
                return None
            data = resp.json()
            if data.get("status") == "failure":
                logger.warning(f"CricAPI {endpoint} failure: {data}")
                return None
            return data
    except Exception as e:
        logger.warning(f"CricAPI {endpoint} error: {e}")
        return None


# ──────────────────────────────────────────────
# Parsers: CricAPI response → our models
# ──────────────────────────────────────────────

def _parse_team_info(team_data: dict) -> TeamInfo:
    """Parse a CricAPI teamInfo entry into our TeamInfo model."""
    name = team_data.get("name", "Unknown")
    shortname = team_data.get("shortname", name[:3].upper())
    img = team_data.get("img")

    # Enrich with IPL colors if recognized
    ipl_code = _resolve_ipl_code(name) or _resolve_ipl_code(shortname)
    if ipl_code and ipl_code in IPL_TEAM_META:
        meta = IPL_TEAM_META[ipl_code]
        return TeamInfo(
            code=ipl_code,
            name=name,
            short_name=shortname,
            color=meta["color"],
            img=img,
        )

    return TeamInfo(
        code=shortname,
        name=name,
        short_name=shortname,
        color="#6B7280",
        img=img,
    )


def _parse_match_status(m: dict) -> MatchStatus:
    """Determine match status from CricAPI data."""
    if m.get("matchEnded"):
        return MatchStatus.COMPLETED
    if m.get("matchStarted"):
        return MatchStatus.LIVE
    return MatchStatus.UPCOMING


def _parse_scores(score_list: list) -> list[InningsScore]:
    """Parse CricAPI score array into our InningsScore models."""
    scores = []
    for s in (score_list or []):
        scores.append(InningsScore(
            runs=s.get("r", 0),
            wickets=s.get("w", 0),
            overs=float(s.get("o", 0)),
            inning=s.get("inning", ""),
        ))
    return scores


def _parse_match(m: dict) -> Optional[MatchSummary]:
    """Parse a CricAPI match object into MatchSummary."""
    teams = m.get("teams", [])
    team_info_list = m.get("teamInfo", [])

    if len(teams) < 2:
        return None

    # Build TeamInfo objects
    if len(team_info_list) >= 2:
        home_team = _parse_team_info(team_info_list[0])
        away_team = _parse_team_info(team_info_list[1])
    else:
        home_team = TeamInfo(code=teams[0][:3].upper(), name=teams[0], short_name=teams[0][:3].upper())
        away_team = TeamInfo(code=teams[1][:3].upper(), name=teams[1], short_name=teams[1][:3].upper())

    # Parse date
    date_str = m.get("dateTimeGMT") or m.get("date")
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00")) if date_str else datetime.utcnow()
    except (ValueError, AttributeError):
        dt = datetime.utcnow()

    # Parse venue/city
    venue_raw = m.get("venue", "")
    city = ""
    if "," in venue_raw:
        parts = venue_raw.rsplit(",", 1)
        venue_name = parts[0].strip()
        city = parts[1].strip()
    else:
        venue_name = venue_raw

    status = _parse_match_status(m)
    status_text = m.get("status", "")

    # Determine result
    result = status_text if status == MatchStatus.COMPLETED else None

    return MatchSummary(
        id=m.get("id", ""),
        name=m.get("name", f"{home_team.short_name} vs {away_team.short_name}"),
        match_number=0,
        match_type=m.get("matchType", "t20"),
        home_team=home_team,
        away_team=away_team,
        date=dt,
        venue=venue_name,
        city=city,
        status=status,
        status_text=status_text,
        series_id=m.get("series_id"),
        score=_parse_scores(m.get("score")),
        result=result,
    )


def _parse_series(s: dict) -> Series:
    """Parse a CricAPI series object into our Series model."""
    return Series(
        id=s.get("id", ""),
        name=s.get("name", ""),
        start_date=s.get("startDate"),
        end_date=s.get("endDate"),
        odi=s.get("odi", 0),
        t20=s.get("t20", 0),
        test=s.get("test", 0),
        matches=s.get("matches", 0),
        squads=s.get("squads", 0),
    )


# ──────────────────────────────────────────────
# Public service class
# ──────────────────────────────────────────────

class CricketDataService:
    """Pure API-driven cricket data service. No mock data."""

    async def get_current_matches(self) -> list[MatchSummary]:
        """Get currently active/recent cricket matches."""
        cached = _cache_get("current_matches")
        if cached is not None:
            return cached

        data = await _cricapi_request("currentMatches", {"offset": "0"})
        if not data or not data.get("data"):
            return []

        matches = []
        for m in data["data"]:
            parsed = _parse_match(m)
            if parsed:
                matches.append(parsed)

        _cache_set("current_matches", matches)
        return matches

    async def get_matches(self, offset: int = 0) -> list[MatchSummary]:
        """Get upcoming/recent cricket matches."""
        cache_key = f"matches_{offset}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        data = await _cricapi_request("matches", {"offset": str(offset)})
        if not data or not data.get("data"):
            return []

        matches = []
        for m in data["data"]:
            parsed = _parse_match(m)
            if parsed:
                matches.append(parsed)

        _cache_set(cache_key, matches)
        return matches

    async def get_match_detail(self, match_id: str) -> Optional[MatchDetail]:
        """Get detailed match info from CricAPI."""
        cache_key = f"match_{match_id}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        data = await _cricapi_request("match_info", {"id": match_id})
        if not data or not data.get("data"):
            return None

        m = data["data"]
        teams = m.get("teams", [])
        team_info_list = m.get("teamInfo", [])

        if len(teams) < 2:
            return None

        if len(team_info_list) >= 2:
            home_team = _parse_team_info(team_info_list[0])
            away_team = _parse_team_info(team_info_list[1])
        else:
            home_team = TeamInfo(code=teams[0][:3].upper(), name=teams[0], short_name=teams[0][:3].upper())
            away_team = TeamInfo(code=teams[1][:3].upper(), name=teams[1], short_name=teams[1][:3].upper())

        date_str = m.get("dateTimeGMT") or m.get("date")
        try:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00")) if date_str else datetime.utcnow()
        except (ValueError, AttributeError):
            dt = datetime.utcnow()

        venue_raw = m.get("venue", "")
        city = ""
        if "," in venue_raw:
            parts = venue_raw.rsplit(",", 1)
            venue_raw = parts[0].strip()
            city = parts[1].strip()

        status = _parse_match_status(m)
        status_text = m.get("status", "")

        detail = MatchDetail(
            id=m.get("id", match_id),
            name=m.get("name", f"{home_team.short_name} vs {away_team.short_name}"),
            match_type=m.get("matchType", "t20"),
            home_team=home_team,
            away_team=away_team,
            date=dt,
            venue=venue_raw,
            city=city,
            status=status,
            status_text=status_text,
            series_id=m.get("series_id"),
            score=_parse_scores(m.get("score")),
            result=status_text if status == MatchStatus.COMPLETED else None,
        )

        _cache_set(cache_key, detail)
        return detail

    async def get_series(self, search: Optional[str] = None, offset: int = 0) -> list[Series]:
        """Get list of cricket series/events."""
        cache_key = f"series_{search}_{offset}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        params = {"offset": str(offset)}
        if search:
            params["search"] = search

        data = await _cricapi_request("series", params)
        if not data or not data.get("data"):
            return []

        series_list = [_parse_series(s) for s in data["data"]]
        _cache_set(cache_key, series_list)
        return series_list

    async def get_series_matches(self, series_id: str) -> list[MatchSummary]:
        """Get all matches in a specific series/event."""
        cache_key = f"series_matches_{series_id}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        data = await _cricapi_request("series_info", {"id": series_id})
        if not data or not data.get("data", {}).get("matchList"):
            return []

        matches = []
        for m in data["data"]["matchList"]:
            parsed = _parse_match(m)
            if parsed:
                matches.append(parsed)

        _cache_set(cache_key, matches)
        return matches

    async def get_series_points(self, series_id: str) -> Optional[StandingsResponse]:
        """Get points table / standings for a series (e.g. IPL)."""
        cache_key = f"series_points_{series_id}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        data = await _cricapi_request("series_points", {"id": series_id})
        if not data or not data.get("data"):
            return None

        standings = []
        for i, entry in enumerate(data["data"]):
            name = entry.get("teamname", "Unknown")
            shortname = entry.get("shortname", name[:3].upper())
            img = entry.get("img")

            ipl_code = _resolve_ipl_code(name) or _resolve_ipl_code(shortname)
            if ipl_code and ipl_code in IPL_TEAM_META:
                meta = IPL_TEAM_META[ipl_code]
                team = TeamInfo(code=ipl_code, name=name, short_name=shortname, color=meta["color"], img=img)
            else:
                team = TeamInfo(code=shortname, name=name, short_name=shortname, color="#6B7280", img=img)

            wins = int(entry.get("wins", 0))
            loss = int(entry.get("loss", 0))
            ties = int(entry.get("ties", 0))
            nr = int(entry.get("nr", 0))
            played = int(entry.get("matches", wins + loss + ties + nr))

            standings.append(TeamStanding(
                position=i + 1,
                team=team,
                played=played,
                won=wins,
                lost=loss,
                no_result=nr,
                ties=ties,
                points=wins * 2,  # Standard cricket: 2 pts per win
            ))

        # Sort by points desc, then by wins desc
        standings.sort(key=lambda s: (-s.points, -s.won))
        for i, s in enumerate(standings):
            s.position = i + 1

        result = StandingsResponse(
            series_id=series_id,
            series_name=data.get("info", {}).get("name", ""),
            updated_at=datetime.utcnow(),
            standings=standings,
        )
        _cache_set(cache_key, result)
        return result

    async def search_players(self, query: str, offset: int = 0) -> list[PlayerSearchResult]:
        """Search for players by name."""
        cache_key = f"players_{query}_{offset}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        data = await _cricapi_request("players", {"search": query, "offset": str(offset)})
        if not data or not data.get("data"):
            return []

        results = [
            PlayerSearchResult(
                id=p.get("id", ""),
                name=p.get("name", "Unknown"),
                country=p.get("country", ""),
            )
            for p in data["data"]
        ]
        _cache_set(cache_key, results)
        return results

    async def get_player_info(self, player_id: str) -> Optional[PlayerProfile]:
        """Get full player profile with career statistics."""
        cache_key = f"player_{player_id}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        data = await _cricapi_request("players_info", {"id": player_id})
        if not data or not data.get("data"):
            return None

        p = data["data"]
        stats = []
        for s in p.get("stats", []):
            stats.append(PlayerStat(
                fn=s.get("fn", ""),
                matchtype=s.get("matchtype", ""),
                stat=s.get("stat", ""),
                value=str(s.get("value", "")),
            ))

        profile = PlayerProfile(
            id=p.get("id", player_id),
            name=p.get("name", "Unknown"),
            country=p.get("country", ""),
            date_of_birth=p.get("dateOfBirth"),
            role=p.get("role", ""),
            batting_style=p.get("battingStyle", ""),
            bowling_style=p.get("bowlingStyle", ""),
            place_of_birth=p.get("placeOfBirth", ""),
            player_img=p.get("playerImg"),
            stats=stats,
        )
        _cache_set(cache_key, profile)
        return profile

    async def check_api_status(self) -> dict:
        """Check CricAPI connectivity and quota."""
        if not settings.CRICKET_API_KEY:
            return {"status": "no_key", "message": "CRICKET_API_KEY not configured"}

        data = await _cricapi_request("countries", {"offset": "0"})
        if data and data.get("info"):
            info = data["info"]
            return {
                "status": "connected",
                "hits_today": info.get("hitsToday", 0),
                "hits_limit": info.get("hitsLimit", 100),
                "credits": info.get("credits", 0),
            }
        return {"status": "error", "message": "Failed to connect to CricAPI"}


# Singleton
cricket_service = CricketDataService()
