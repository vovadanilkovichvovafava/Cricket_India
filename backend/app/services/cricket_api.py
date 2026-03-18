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
    MatchScorecard,
    InningsScorecard,
    BattingEntry,
    BowlingEntry,
    MatchSquad,
    TeamSquad,
    SquadPlayer,
    MatchFantasyPoints,
    FantasyPlayerPoints,
    InningsPoints,
    MatchBallByBall,
    BallEvent,
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# CricAPI configuration
# ──────────────────────────────────────────────

CRICAPI_BASE = "https://api.cricapi.com/v1"
CACHE_TTL = 300  # 5 min cache

_cache: dict[str, tuple] = {}
_NOT_FOUND = object()  # sentinel for caching "not found" responses
NOT_FOUND_TTL = 3600  # cache "not found" for 1 hour to avoid repeated API calls


def _cache_get(key: str):
    if key in _cache:
        data, ts, ttl = _cache[key]
        if time.time() - ts < ttl:
            return data
        del _cache[key]
    return None


def _cache_set(key: str, data, ttl: int = CACHE_TTL):
    _cache[key] = (data, time.time(), ttl)


# ──────────────────────────────────────────────
# Known team metadata (for color enrichment)
# ──────────────────────────────────────────────

# Default fallback color for unknown teams (yellow-green)
DEFAULT_TEAM_COLOR = "#8DB600"

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

# All known cricket team colors worldwide (code → color)
# IPL, International, BBL, PSL, CPL, SA20, The Hundred, SA domestic, ILT20
GLOBAL_TEAM_COLORS = {
    # ── IPL ──
    "CSK": "#FCCA06", "MI": "#004BA0", "RCB": "#EC1C24", "KKR": "#3A225D",
    "DC": "#004C93", "SRH": "#F7A721", "RR": "#EA1A85", "PBKS": "#ED1B24",
    "LSG": "#A72056", "GT": "#1C1C1C",
    # ── International ──
    "IND": "#0078D7", "AUS": "#FFCD00", "ENG": "#002147", "PAK": "#006629",
    "SA": "#006A4D", "RSA": "#006A4D", "NZ": "#000000", "NZL": "#000000",
    "WI": "#7B0041", "SL": "#003478", "SRI": "#003478",
    "BAN": "#006A4D", "AFG": "#0066B3", "ZIM": "#D40000",
    "IRE": "#169B62", "NED": "#FF6600", "SCO": "#003078",
    "NEP": "#003893", "UAE": "#003B70", "OMN": "#C8102E",
    "NAM": "#002D6E", "USA": "#002868", "CAN": "#FF0000",
    "PNG": "#CE1126", "HK": "#DE2910", "KEN": "#006600",
    # ── Big Bash League (BBL) ──
    "SIX": "#EC2A90", "THU": "#97D700", "STA": "#287246", "REN": "#EE343F",
    "SCO": "#FF6600", "HEA": "#27A6B0", "HUR": "#674398", "STR": "#0084D6",
    # ── Pakistan Super League (PSL) ──
    "KAR": "#0752C2", "LAH": "#78FF06", "ISL": "#FF0000", "PES": "#FFFF00",
    "QUE": "#5F0182", "MUL": "#589F28",
    # ── Caribbean Premier League (CPL) ──
    "TKR": "#D50032", "JAM": "#009B3A", "BR": "#E74093", "SNP": "#CF142B",
    "GAW": "#009E49", "SLK": "#0057B7", "ABF": "#000080",
    # ── SA20 (South Africa franchise) ──
    "MICT": "#004B8D", "DSG": "#A72056", "JSK": "#F9CD05",
    "PR": "#EA1A85", "PC": "#004C93", "SEC": "#F26522",
    # ── South African domestic (CSA T20) ──
    "WAR": "#556B2F", "TIT": "#00BFFF", "LIONS": "#CC0000", "LIO": "#CC0000",
    "DOL": "#1C1C6B", "KNG": "#FF6600", "KNI": "#FF6600",
    "COB": "#006400", "NWD": "#8B0000", "ERD": "#8B0000",
    # ── The Hundred (UK) ──
    "OI": "#00A651", "TR": "#00584C", "SB": "#002B5C", "BP": "#D4213D",
    "MO": "#4A4A4A", "LS": "#00A3E0", "WF": "#E4003B", "NS": "#FFD700",
    # ── ILT20 (UAE) ──
    "GG": "#E87722", "DUB": "#CC0033", "MIE": "#004B8D",
    "ADKR": "#3A225D", "DV": "#CC0000", "SW": "#5F0182",
}

# Map full team names → code (for enrichment)
_NAME_TO_CODE = {
    # IPL
    "chennai super kings": "CSK", "mumbai indians": "MI",
    "royal challengers bengaluru": "RCB", "royal challengers bangalore": "RCB",
    "kolkata knight riders": "KKR", "delhi capitals": "DC",
    "sunrisers hyderabad": "SRH", "rajasthan royals": "RR",
    "punjab kings": "PBKS", "kings xi punjab": "PBKS",
    "lucknow super giants": "LSG", "gujarat titans": "GT",
    # International
    "india": "IND", "australia": "AUS", "england": "ENG",
    "pakistan": "PAK", "south africa": "SA", "new zealand": "NZ",
    "west indies": "WI", "sri lanka": "SL", "bangladesh": "BAN",
    "afghanistan": "AFG", "zimbabwe": "ZIM", "ireland": "IRE",
    "netherlands": "NED", "scotland": "SCO", "nepal": "NEP",
    "oman": "OMN", "namibia": "NAM", "usa": "USA", "canada": "CAN",
    "united states": "USA", "united arab emirates": "UAE",
    "papua new guinea": "PNG", "hong kong": "HK", "kenya": "KEN",
    # BBL
    "sydney sixers": "SIX", "sydney thunder": "THU",
    "melbourne stars": "STA", "melbourne renegades": "REN",
    "perth scorchers": "SCO", "brisbane heat": "HEA",
    "hobart hurricanes": "HUR", "adelaide strikers": "STR",
    # PSL
    "karachi kings": "KAR", "lahore qalandars": "LAH",
    "islamabad united": "ISL", "peshawar zalmi": "PES",
    "quetta gladiators": "QUE", "multan sultans": "MUL",
    # CPL
    "trinbago knight riders": "TKR", "jamaica tallawahs": "JAM",
    "barbados royals": "BR", "st kitts and nevis patriots": "SNP",
    "guyana amazon warriors": "GAW", "st lucia kings": "SLK",
    # SA20
    "mi cape town": "MICT", "durban super giants": "DSG",
    "joburg super kings": "JSK", "paarl royals": "PR",
    "pretoria capitals": "PC", "sunrisers eastern cape": "SEC",
    # SA domestic
    "warriors": "WAR", "titans": "TIT", "lions": "LIO",
    "dolphins": "DOL", "knights": "KNI", "cape cobras": "COB",
    "north west dragons": "NWD", "north west": "NWD",
    # The Hundred
    "oval invincibles": "OI", "trent rockets": "TR",
    "southern brave": "SB", "birmingham phoenix": "BP",
    "manchester originals": "MO", "london spirit": "LS",
    "welsh fire": "WF", "northern superchargers": "NS",
    # ILT20
    "gulf giants": "GG", "dubai capitals": "DUB",
    "mi emirates": "MIE", "abu dhabi knight riders": "ADKR",
    "desert vipers": "DV", "sharjah warriorz": "SW",
}


def _resolve_team_color(name: str, code: str = "") -> Optional[str]:
    """Resolve a team name or code to a color hex. Returns None if unknown."""
    # Try code first (fast path)
    upper = code.strip().upper() if code else ""
    if upper and upper in GLOBAL_TEAM_COLORS:
        return GLOBAL_TEAM_COLORS[upper]
    # Try full name
    low = name.strip().lower()
    if low in _NAME_TO_CODE:
        resolved = _NAME_TO_CODE[low]
        if resolved in GLOBAL_TEAM_COLORS:
            return GLOBAL_TEAM_COLORS[resolved]
    # Try partial/substring match as last resort
    for key, team_code in _NAME_TO_CODE.items():
        if key in low or low in key:
            if team_code in GLOBAL_TEAM_COLORS:
                return GLOBAL_TEAM_COLORS[team_code]
    return None


def _resolve_ipl_code(name: str) -> Optional[str]:
    """Try to resolve a team name to an IPL code. Returns None for non-IPL teams.
    Only exact matches — no fuzzy/substring matching to avoid false positives
    (e.g. South African 'Titans' should NOT match 'Gujarat Titans').
    """
    low = name.strip().lower()
    if low in _NAME_TO_CODE:
        code = _NAME_TO_CODE[low]
        if code in IPL_TEAM_META:
            return code
    upper = name.strip().upper()
    if upper in IPL_TEAM_META:
        return upper
    return None


# ──────────────────────────────────────────────
# CricAPI HTTP client
# ──────────────────────────────────────────────

_api_call_count = 0
_api_call_date = ""

def get_api_usage() -> int:
    """Return today's API call count."""
    from datetime import date
    global _api_call_count, _api_call_date
    today = date.today().isoformat()
    if _api_call_date != today:
        return 0
    return _api_call_count

async def _cricapi_request(endpoint: str, params: dict = None) -> Optional[dict]:
    """Make a request to CricAPI. Returns None on failure."""
    global _api_call_count, _api_call_date
    from datetime import date
    today = date.today().isoformat()
    if _api_call_date != today:
        _api_call_count = 0
        _api_call_date = today
    _api_call_count += 1

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

    # Try global team color database
    color = _resolve_team_color(name, shortname) or DEFAULT_TEAM_COLOR
    return TeamInfo(
        code=shortname,
        name=name,
        short_name=shortname,
        color=color,
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
        """Get upcoming/recent cricket matches.
        Fetches from multiple sources:
        1. Standard matches endpoint (upcoming/scheduled)
        2. currentMatches endpoint (live + recently completed this week)
        3. Active series matches (series within ±30 days, paginated)
        """
        cache_key = f"matches_enriched_{offset}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        import asyncio

        seen_ids: set[str] = set()
        matches: list[MatchSummary] = []

        if offset == 0:
            # On first page, fetch from ALL sources in parallel
            std_task = _cricapi_request("matches", {"offset": "0"})
            current_task = self.get_current_matches()
            series_task = self._get_active_series_matches()

            std_data, current_matches, series_result = await asyncio.gather(
                std_task, current_task, series_task, return_exceptions=True
            )

            # 1. Standard matches endpoint
            if not isinstance(std_data, Exception) and std_data and std_data.get("data"):
                for m in std_data["data"]:
                    parsed = _parse_match(m)
                    if parsed and parsed.id not in seen_ids:
                        seen_ids.add(parsed.id)
                        matches.append(parsed)

            # 2. Current matches (live + recently completed — THIS WEEK's matches)
            if not isinstance(current_matches, Exception) and current_matches:
                for m in current_matches:
                    if m.id not in seen_ids:
                        seen_ids.add(m.id)
                        matches.append(m)

            # 3. Active series matches
            if not isinstance(series_result, Exception) and series_result:
                for m in series_result:
                    if m.id not in seen_ids:
                        seen_ids.add(m.id)
                        matches.append(m)

            logger.info(f"Merged matches: {len(matches)} total (std + current + series)")
        else:
            # Subsequent pages — only standard endpoint
            data = await _cricapi_request("matches", {"offset": str(offset)})
            if data and data.get("data"):
                for m in data["data"]:
                    parsed = _parse_match(m)
                    if parsed and parsed.id not in seen_ids:
                        seen_ids.add(parsed.id)
                        matches.append(parsed)

        # Sort: live first, then upcoming by date, then completed (newest first)
        def sort_key(m):
            if m.status == MatchStatus.LIVE:
                return (0, m.date)
            if m.status == MatchStatus.UPCOMING:
                return (1, m.date)
            return (2, m.date)

        matches.sort(key=sort_key)
        _cache_set(cache_key, matches)
        return matches

    async def _get_active_series_matches(self) -> list[MatchSummary]:
        """Fetch matches from currently active/upcoming series.
        Scans multiple pages of the series endpoint to find series that:
        - Start within the next 30 days, OR
        - Already started but haven't ended yet (endDate in the future)
        """
        cache_key = "active_series_matches"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        import asyncio

        now = datetime.utcnow()
        active_series_ids = []

        # Paginate through multiple offsets to find current series
        # CricAPI returns series sorted from far future, so we need several pages
        offsets = [0, 25, 50, 75, 100]

        async def fetch_series_page(offset):
            return await _cricapi_request("series", {"offset": str(offset)})

        page_tasks = [fetch_series_page(off) for off in offsets]
        page_results = await asyncio.gather(*page_tasks, return_exceptions=True)

        seen_series = set()
        for page_data in page_results:
            if isinstance(page_data, Exception) or not page_data or not page_data.get("data"):
                continue

            for s in page_data["data"]:
                sid = s.get("id")
                if not sid or sid in seen_series:
                    continue
                seen_series.add(sid)

                start_str = s.get("startDate", "")
                end_str = s.get("endDate", "")

                try:
                    start = datetime.strptime(start_str, "%Y-%m-%d") if start_str and "-" in start_str else None
                    end = datetime.strptime(end_str, "%Y-%m-%d") if end_str and "-" in end_str else None
                except (ValueError, TypeError):
                    continue

                if not start:
                    continue

                # Include series if:
                # 1. Starts within next 30 days (upcoming)
                # 2. Already started AND hasn't ended yet (currently active)
                # 3. Started within last 7 days (recently started, even if no endDate)
                days_until_start = (start - now).days
                is_upcoming = 0 <= days_until_start <= 30
                is_active = (start <= now and end is not None and end >= now)
                is_recent = -7 <= days_until_start < 0

                if is_upcoming or is_active or is_recent:
                    active_series_ids.append(sid)

        if not active_series_ids:
            logger.info("No active series found across paginated scan")
            return []

        # Fetch matches from each active series (limit to 15 to balance coverage vs API calls)
        all_matches = []

        async def fetch_series_matches(sid):
            data = await _cricapi_request("series_info", {"id": sid})
            if data and data.get("data", {}).get("matchList"):
                results = []
                for m in data["data"]["matchList"]:
                    parsed = _parse_match(m)
                    if parsed:
                        results.append(parsed)
                return results
            return []

        tasks = [fetch_series_matches(sid) for sid in active_series_ids[:15]]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_matches.extend(result)

        logger.info(f"Active series scan: {len(seen_series)} total scanned, "
                     f"{len(active_series_ids)} active, {len(all_matches)} matches")
        _cache_set(cache_key, all_matches)
        return all_matches

    async def get_match_detail(self, match_id: str) -> Optional[MatchDetail]:
        """Get detailed match info from CricAPI."""
        cache_key = f"match_{match_id}"
        cached = _cache_get(cache_key)
        if cached is _NOT_FOUND:
            return None
        if cached is not None:
            return cached

        data = await _cricapi_request("match_info", {"id": match_id})
        if not data or not data.get("data"):
            # Cache "not found" for 1 hour to stop hammering the API
            _cache_set(cache_key, _NOT_FOUND, NOT_FOUND_TTL)
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
                color = _resolve_team_color(name, shortname) or DEFAULT_TEAM_COLOR
                team = TeamInfo(code=shortname, name=name, short_name=shortname, color=color, img=img)

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

    async def get_match_scorecard(self, match_id: str) -> Optional[MatchScorecard]:
        """Get full match scorecard — batting & bowling stats per player."""
        cache_key = f"scorecard_{match_id}"
        cached = _cache_get(cache_key)
        if cached is _NOT_FOUND:
            return None
        if cached is not None:
            return cached

        data = await _cricapi_request("match_scorecard", {"id": match_id})
        if not data or not data.get("data"):
            _cache_set(cache_key, _NOT_FOUND, NOT_FOUND_TTL)
            return None

        m = data["data"]
        innings_list = []
        for sc in m.get("scorecard", []):
            batting = []
            for b in sc.get("batting", []):
                batting.append(BattingEntry(
                    batsman=b.get("batsman", {}).get("name", "Unknown"),
                    dismissal=b.get("dismissal-text", ""),
                    runs=int(b.get("r", 0)),
                    balls=int(b.get("b", 0)),
                    fours=int(b.get("4s", 0)),
                    sixes=int(b.get("6s", 0)),
                    strike_rate=float(b.get("sr", 0)),
                ))

            bowling = []
            for bw in sc.get("bowling", []):
                bowling.append(BowlingEntry(
                    bowler=bw.get("bowler", {}).get("name", "Unknown"),
                    overs=float(bw.get("o", 0)),
                    maidens=int(bw.get("m", 0)),
                    runs=int(bw.get("r", 0)),
                    wickets=int(bw.get("w", 0)),
                    economy=float(bw.get("eco", 0)),
                    wides=int(bw.get("wd", 0)),
                    no_balls=int(bw.get("nb", 0)),
                ))

            # Fall of wickets
            fow = []
            for f in sc.get("catching", []):
                if f.get("stumpiing"):
                    fow.append(f"st {f.get('stumpiing', {}).get('name', '')}")

            innings_list.append(InningsScorecard(
                inning=sc.get("inning", ""),
                runs=int(sc.get("r", 0)),
                wickets=int(sc.get("w", 0)),
                overs=float(sc.get("o", 0)),
                batting=batting,
                bowling=bowling,
                extras=int(sc.get("extras", 0)),
            ))

        scorecard = MatchScorecard(
            id=match_id,
            name=m.get("name", ""),
            status=m.get("status", ""),
            innings=innings_list,
        )
        _cache_set(cache_key, scorecard)
        return scorecard

    async def get_match_squad(self, match_id: str) -> Optional[MatchSquad]:
        """Get squad/lineup for a match."""
        cache_key = f"squad_{match_id}"
        cached = _cache_get(cache_key)
        if cached is _NOT_FOUND:
            return None
        if cached is not None:
            return cached

        data = await _cricapi_request("match_squad", {"id": match_id})
        if not data or not data.get("data"):
            _cache_set(cache_key, _NOT_FOUND, NOT_FOUND_TTL)
            return None

        m = data["data"]
        squads_data = m if isinstance(m, list) else m.get("squad", [])
        if len(squads_data) < 2:
            return None

        def parse_squad(team_data: dict) -> TeamSquad:
            team_name = team_data.get("teamName", "Unknown")
            shortname = team_data.get("shortname", team_name[:3].upper())
            img = team_data.get("img")

            ipl_code = _resolve_ipl_code(team_name) or _resolve_ipl_code(shortname)
            if ipl_code and ipl_code in IPL_TEAM_META:
                meta = IPL_TEAM_META[ipl_code]
                team_info = TeamInfo(code=ipl_code, name=team_name, short_name=shortname, color=meta["color"], img=img)
            else:
                color = _resolve_team_color(team_name, shortname) or DEFAULT_TEAM_COLOR
                team_info = TeamInfo(code=shortname, name=team_name, short_name=shortname, color=color, img=img)

            players = []
            for p in team_data.get("players", []):
                players.append(SquadPlayer(
                    id=p.get("id", ""),
                    name=p.get("name", "Unknown"),
                    role=p.get("role", ""),
                    batting_style=p.get("battingStyle", ""),
                    bowling_style=p.get("bowlingStyle", ""),
                    country=p.get("country", ""),
                    player_img=p.get("playerImg"),
                    is_captain="captain" in p.get("role", "").lower() or p.get("isCaptain", False),
                    is_keeper="keeper" in p.get("role", "").lower() or "wk" in p.get("role", "").lower(),
                ))

            return TeamSquad(team=team_info, players=players)

        home_squad = parse_squad(squads_data[0])
        away_squad = parse_squad(squads_data[1])

        squad = MatchSquad(
            id=match_id,
            name=m.get("name", "") if isinstance(m, dict) else "",
            home_squad=home_squad,
            away_squad=away_squad,
        )
        _cache_set(cache_key, squad)
        return squad

    async def get_match_fantasy_points(self, match_id: str) -> Optional[MatchFantasyPoints]:
        """Get fantasy points for each player in a match (Top Performers)."""
        cache_key = f"fantasy_{match_id}"
        cached = _cache_get(cache_key)
        if cached is _NOT_FOUND:
            return None
        if cached is not None:
            return cached

        data = await _cricapi_request("match_points", {"id": match_id})
        if not data or not data.get("data"):
            _cache_set(cache_key, _NOT_FOUND, NOT_FOUND_TTL)
            return None

        d = data["data"]

        # Parse totals (top performers across the match)
        totals = []
        for p in (d.get("totals") or []):
            totals.append(FantasyPlayerPoints(
                name=p.get("name", "Unknown"),
                team=p.get("team", ""),
                points=float(p.get("points", 0)),
                player_id=p.get("id"),
                player_img=p.get("playerImg"),
            ))
        # Sort by points descending
        totals.sort(key=lambda x: -x.points)

        # Parse per-innings breakdown
        innings = []
        for inn in (d.get("innings") or []):
            players = []
            for p in (inn.get("points") or []):
                players.append(FantasyPlayerPoints(
                    name=p.get("name", "Unknown"),
                    team=p.get("team", ""),
                    points=float(p.get("points", 0)),
                    player_id=p.get("id"),
                    player_img=p.get("playerImg"),
                ))
            players.sort(key=lambda x: -x.points)
            innings.append(InningsPoints(
                inning=inn.get("inning", ""),
                players=players,
            ))

        result = MatchFantasyPoints(
            id=match_id,
            name=data.get("name", ""),
            status=data.get("status", ""),
            totals=totals,
            innings=innings,
        )
        _cache_set(cache_key, result)
        return result

    async def get_match_ball_by_ball(self, match_id: str) -> Optional[MatchBallByBall]:
        """Get ball-by-ball data for a match (live commentary feed).
        Only available for major tournaments (IPL, World Cup, etc.) with fantasyEnabled=true.
        """
        cache_key = f"bbb_{match_id}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        data = await _cricapi_request("match_bbb", {"id": match_id})
        if not data:
            return MatchBallByBall(id=match_id, available=False)

        if data.get("status") == "failure":
            result = MatchBallByBall(id=match_id, available=False)
            _cache_set(cache_key, result)
            return result

        d = data.get("data", {})
        balls = []
        bbb_data = d.get("bpiData") or d.get("bbb") or d.get("data") or []
        if isinstance(bbb_data, list):
            for b in bbb_data:
                balls.append(BallEvent(
                    ball=float(b.get("ball", 0)),
                    over=int(b.get("over", 0)),
                    batsman=b.get("batsman", {}).get("name", "") if isinstance(b.get("batsman"), dict) else str(b.get("batsman", "")),
                    bowler=b.get("bowler", {}).get("name", "") if isinstance(b.get("bowler"), dict) else str(b.get("bowler", "")),
                    runs=int(b.get("runs", 0)),
                    extras=int(b.get("extras", 0)),
                    wicket=b.get("wicket", False),
                    wicket_type=b.get("wicketType", ""),
                    commentary=b.get("commentary", ""),
                    score=b.get("score", ""),
                ))

        result = MatchBallByBall(
            id=match_id,
            name=d.get("name", "") if isinstance(d, dict) else "",
            status=d.get("status", "") if isinstance(d, dict) else "",
            available=len(balls) > 0,
            balls=balls,
        )
        _cache_set(cache_key, result)
        return result

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
