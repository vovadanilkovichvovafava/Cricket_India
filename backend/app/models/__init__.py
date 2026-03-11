"""Pydantic schemas for API requests/responses."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    phone: str
    password: str
    name: str
    country_code: str = "+91"
    ref: Optional[str] = None  # referral code


class LoginRequest(BaseModel):
    phone: str
    password: str
    country_code: str = "+91"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    name: str
    country_code: str
    referral_code: Optional[str] = None
    referral_count: int = 0
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class ReferralInfoResponse(BaseModel):
    referral_code: str
    referral_count: int
    referral_link: str


# ──────────────────────────────────────────────
# Cricket core
# ──────────────────────────────────────────────

class MatchStatus(str, Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"


class TeamInfo(BaseModel):
    code: str
    name: str
    short_name: str = ""
    color: str = "#6B7280"
    img: Optional[str] = None


class InningsScore(BaseModel):
    runs: int = 0
    wickets: int = 0
    overs: float = 0.0
    inning: str = ""


# ──────────────────────────────────────────────
# Odds
# ──────────────────────────────────────────────

class BookmakerOdds(BaseModel):
    bookmaker: str
    home_odds: float
    away_odds: float
    draw_odds: Optional[float] = None
    last_updated: Optional[datetime] = None


class MatchOdds(BaseModel):
    home_team: str
    away_team: str
    bookmakers: List[BookmakerOdds] = []
    best_home_odds: Optional[float] = None
    best_away_odds: Optional[float] = None


class TotalsOdds(BaseModel):
    bookmaker: str
    point: float
    over_odds: float
    under_odds: float
    last_updated: Optional[datetime] = None


class MatchTotals(BaseModel):
    home_team: str
    away_team: str
    totals: List[TotalsOdds] = []


# ──────────────────────────────────────────────
# Matches
# ──────────────────────────────────────────────

class MatchSummary(BaseModel):
    id: str
    name: str = ""
    match_number: int = 0
    match_type: str = "t20"
    home_team: TeamInfo
    away_team: TeamInfo
    date: datetime
    venue: str = ""
    city: str = ""
    status: MatchStatus = MatchStatus.UPCOMING
    status_text: str = ""
    series_id: Optional[str] = None
    score: List[InningsScore] = []
    result: Optional[str] = None
    odds: Optional[MatchOdds] = None


class LineupPlayer(BaseModel):
    name: str
    role: str = ""
    is_captain: bool = False


class MatchDetail(MatchSummary):
    """Extended match info with lineups, matchups, venue stats."""
    home_lineup: List[LineupPlayer] = []
    away_lineup: List[LineupPlayer] = []
    key_matchups: List[str] = []
    venue_stats: Optional[dict] = None
    head_to_head: Optional[dict] = None
    weather_forecast: Optional[dict] = None


# ──────────────────────────────────────────────
# Series
# ──────────────────────────────────────────────

class Series(BaseModel):
    id: str
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    odi: int = 0
    t20: int = 0
    test: int = 0
    matches: int = 0
    squads: int = 0


# ──────────────────────────────────────────────
# Standings
# ──────────────────────────────────────────────

class TeamStanding(BaseModel):
    position: int
    team: TeamInfo
    played: int = 0
    won: int = 0
    lost: int = 0
    no_result: int = 0
    ties: int = 0
    points: int = 0


class StandingsResponse(BaseModel):
    series_id: str
    series_name: str = ""
    updated_at: Optional[datetime] = None
    standings: List[TeamStanding] = []


# ──────────────────────────────────────────────
# Players
# ──────────────────────────────────────────────

class PlayerSearchResult(BaseModel):
    id: str
    name: str
    country: str = ""


class PlayerStat(BaseModel):
    fn: str = ""
    matchtype: str = ""
    stat: str = ""
    value: str = ""


class PlayerProfile(BaseModel):
    id: str
    name: str
    country: str = ""
    date_of_birth: Optional[str] = None
    role: str = ""
    batting_style: str = ""
    bowling_style: str = ""
    place_of_birth: str = ""
    player_img: Optional[str] = None
    stats: List[PlayerStat] = []


# ──────────────────────────────────────────────
# Scorecard
# ──────────────────────────────────────────────

class BattingEntry(BaseModel):
    batsman: str
    dismissal: str = ""
    runs: int = 0
    balls: int = 0
    fours: int = 0
    sixes: int = 0
    strike_rate: float = 0.0


class BowlingEntry(BaseModel):
    bowler: str
    overs: float = 0.0
    maidens: int = 0
    runs: int = 0
    wickets: int = 0
    economy: float = 0.0
    wides: int = 0
    no_balls: int = 0


class InningsScorecard(BaseModel):
    inning: str = ""
    runs: int = 0
    wickets: int = 0
    overs: float = 0.0
    batting: List[BattingEntry] = []
    bowling: List[BowlingEntry] = []
    extras: int = 0


class MatchScorecard(BaseModel):
    id: str
    name: str = ""
    status: str = ""
    innings: List[InningsScorecard] = []


# ──────────────────────────────────────────────
# Squad
# ──────────────────────────────────────────────

class SquadPlayer(BaseModel):
    id: str = ""
    name: str
    role: str = ""
    batting_style: str = ""
    bowling_style: str = ""
    country: str = ""
    player_img: Optional[str] = None
    is_captain: bool = False
    is_keeper: bool = False


class TeamSquad(BaseModel):
    team: TeamInfo
    players: List[SquadPlayer] = []


class MatchSquad(BaseModel):
    id: str
    name: str = ""
    home_squad: TeamSquad
    away_squad: TeamSquad


# ──────────────────────────────────────────────
# Fantasy Points (Top Performers)
# ──────────────────────────────────────────────

class FantasyPlayerPoints(BaseModel):
    name: str
    team: str = ""
    points: float = 0.0
    player_id: Optional[str] = None
    player_img: Optional[str] = None


class InningsPoints(BaseModel):
    inning: str = ""
    players: List[FantasyPlayerPoints] = []


class MatchFantasyPoints(BaseModel):
    id: str
    name: str = ""
    status: str = ""
    totals: List[FantasyPlayerPoints] = []
    innings: List[InningsPoints] = []


# ──────────────────────────────────────────────
# Ball-by-Ball (Live Commentary)
# ──────────────────────────────────────────────

class BallEvent(BaseModel):
    ball: float = 0.0
    over: int = 0
    batsman: str = ""
    bowler: str = ""
    runs: int = 0
    extras: int = 0
    wicket: bool = False
    wicket_type: str = ""
    commentary: str = ""
    score: str = ""  # e.g. "142/3"


class MatchBallByBall(BaseModel):
    id: str
    name: str = ""
    status: str = ""
    available: bool = False
    balls: List[BallEvent] = []


# ──────────────────────────────────────────────
# Predictions / AI
# ──────────────────────────────────────────────

class ValueBet(BaseModel):
    market: str
    selection: str = ""
    odds: Optional[float] = None
    confidence: Optional[float] = None
    risk: str = "Medium"  # Low, Medium, High
    reasoning: str = ""


class MatchPrediction(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    match_id: str
    home_team: str
    away_team: str
    predicted_winner: str
    win_probability: float = 0.5
    confidence: float = 0.5
    key_factors: list = []  # Can be strings or dicts with factor/detail/impact
    value_bets: List[ValueBet] = []
    analysis_text: str = ""
    model_used: str = "generic"
    generated_at: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    match_id: Optional[str] = None


class ChatResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    response: str
    match_context: Optional[str] = None
    model_used: str = "generic"
    value_bets: List[ValueBet] = []


# ──────────────────────────────────────────────
# Support Chat
# ──────────────────────────────────────────────

class SupportChatRequest(BaseModel):
    message: str


class SupportChatResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    response: str
    model_used: str = "generic"


# ─── Prediction Stats ────────────────────────────
class PredictionStatsResponse(BaseModel):
    total_predictions: int = 0
    correct: int = 0
    incorrect: int = 0
    pending: int = 0
    accuracy_pct: float = 0.0
    recent: list = []  # last 10 predictions with results
