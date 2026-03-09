from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────

class MatchStatus(str, Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"


class TossDecision(str, Enum):
    BAT = "bat"
    BOWL = "bowl"


# ──────────────────────────────────────────────
# Team & Player Models
# ──────────────────────────────────────────────

class Player(BaseModel):
    name: str
    role: str = "unknown"
    batting_avg: Optional[float] = None
    bowling_avg: Optional[float] = None
    strike_rate: Optional[float] = None
    economy: Optional[float] = None
    is_overseas: bool = False
    is_captain: bool = False


class TeamInfo(BaseModel):
    code: str  # CSK, MI, WAR, etc.
    name: str
    short_name: str
    color: str = "#6B7280"  # default gray for unknown teams
    img: Optional[str] = None  # team logo URL from CricAPI


# ──────────────────────────────────────────────
# Odds Models
# ──────────────────────────────────────────────

class BookmakerOdds(BaseModel):
    bookmaker: str
    home_odds: float
    away_odds: float
    draw_odds: Optional[float] = None
    last_updated: datetime


class MatchOdds(BaseModel):
    home_team: str
    away_team: str
    bookmakers: list[BookmakerOdds]
    best_home_odds: float
    best_away_odds: float


# ──────────────────────────────────────────────
# Score Model
# ──────────────────────────────────────────────

class InningsScore(BaseModel):
    runs: int = 0
    wickets: int = 0
    overs: float = 0.0
    inning: str = ""


# ──────────────────────────────────────────────
# Match Models
# ──────────────────────────────────────────────

class MatchSummary(BaseModel):
    id: str
    name: str = ""  # full match name from API, e.g. "CSK vs MI, 1st Match"
    match_number: int = 0
    match_type: str = "t20"  # t20, odi, test
    home_team: TeamInfo
    away_team: TeamInfo
    date: datetime
    venue: str = ""
    city: str = ""
    status: MatchStatus
    status_text: str = ""  # raw status text from API, e.g. "CSK won by 5 wickets"
    series_id: Optional[str] = None
    odds: Optional[MatchOdds] = None
    score: list[InningsScore] = []
    toss_winner: Optional[str] = None
    toss_decision: Optional[TossDecision] = None
    result: Optional[str] = None


class MatchDetail(MatchSummary):
    home_lineup: list[Player] = []
    away_lineup: list[Player] = []
    venue_stats: Optional[dict] = None
    head_to_head: Optional[dict] = None
    key_matchups: list[str] = []
    weather_forecast: Optional[str] = None


# ──────────────────────────────────────────────
# Series Model
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
# Prediction Models
# ──────────────────────────────────────────────

class ValueBet(BaseModel):
    market: str
    selection: str
    odds: float
    confidence: float
    reasoning: str


class MatchPrediction(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    predicted_winner: str
    win_probability: float
    confidence: float
    key_factors: list[str]
    value_bets: list[ValueBet]
    analysis_text: str
    model_used: str = "mock"
    generated_at: datetime


# ──────────────────────────────────────────────
# Chat Models
# ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    match_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    match_context: Optional[str] = None
    model_used: str = "mock"


# ──────────────────────────────────────────────
# Standings Models
# ──────────────────────────────────────────────

class TeamStanding(BaseModel):
    position: int
    team: TeamInfo
    played: int
    won: int
    lost: int
    no_result: int = 0
    ties: int = 0
    points: int = 0
    net_run_rate: float = 0.0
    recent_form: list[str] = []


class StandingsResponse(BaseModel):
    series_id: str
    series_name: str = ""
    updated_at: datetime
    standings: list[TeamStanding]


# ──────────────────────────────────────────────
# Player Models
# ──────────────────────────────────────────────

class PlayerSearchResult(BaseModel):
    id: str
    name: str
    country: str = ""


# ──────────────────────────────────────────────
# Scorecard Models
# ──────────────────────────────────────────────

class BattingEntry(BaseModel):
    batsman: str
    dismissal: str = ""  # "c Kohli b Bumrah", "not out", "b Ashwin"
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
    inning: str  # "Chennai Super Kings Inning 1"
    runs: int = 0
    wickets: int = 0
    overs: float = 0.0
    batting: list[BattingEntry] = []
    bowling: list[BowlingEntry] = []
    extras: int = 0
    fall_of_wickets: list[str] = []

class MatchScorecard(BaseModel):
    id: str
    name: str = ""
    status: str = ""
    innings: list[InningsScorecard] = []


# ──────────────────────────────────────────────
# Squad Models
# ──────────────────────────────────────────────

class SquadPlayer(BaseModel):
    id: str = ""
    name: str
    role: str = ""  # "Batsman", "Bowler", "All-Rounder", "WK-Batsman"
    batting_style: str = ""
    bowling_style: str = ""
    country: str = ""
    player_img: Optional[str] = None
    is_captain: bool = False
    is_keeper: bool = False

class TeamSquad(BaseModel):
    team: TeamInfo
    players: list[SquadPlayer] = []

class MatchSquad(BaseModel):
    id: str
    name: str = ""
    home_squad: TeamSquad
    away_squad: TeamSquad


# ──────────────────────────────────────────────
# Totals Odds Models
# ──────────────────────────────────────────────

class TotalsOdds(BaseModel):
    bookmaker: str
    point: float  # e.g. 320.5
    over_odds: float
    under_odds: float
    last_updated: Optional[datetime] = None

class MatchTotals(BaseModel):
    home_team: str
    away_team: str
    totals: list[TotalsOdds] = []


class PlayerStat(BaseModel):
    fn: str  # "batting" or "bowling"
    matchtype: str  # "test", "odi", "t20i", "ipl"
    stat: str  # "m", "inn", "runs", "avg", "sr", etc.
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
    stats: list[PlayerStat] = []


# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    phone: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)
    country_code: str = Field(default="+91", max_length=5)
    ref: Optional[str] = None  # referral code of inviter


class LoginRequest(BaseModel):
    phone: str
    password: str
    country_code: str = "+91"


class UserResponse(BaseModel):
    id: int
    phone: str
    name: str
    country_code: str = "+91"
    referral_code: Optional[str] = None
    referral_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class ReferralInfoResponse(BaseModel):
    referral_code: str
    referral_count: int
    referral_link: str
