"""
AI-powered match analysis service using Anthropic's Claude API.
Falls back to generic responses when CLAUDE_API_KEY is not configured.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Optional

from app.config import settings
from app.models import (
    MatchDetail,
    MatchPrediction,
    ValueBet,
    ChatResponse,
)

SYSTEM_PROMPT = """You are an expert cricket betting analyst with deep knowledge of:
- All major cricket leagues (IPL, BBL, PSL, CPL, international cricket)
- Team squads, strengths, weaknesses, and recent form
- Venue conditions, pitch behavior, and weather impact
- T20, ODI, and Test cricket tactics
- Betting markets, odds analysis, and value identification

When analyzing a match:
1. Assess team strengths relative to the venue and conditions
2. Consider recent form and momentum
3. Factor in toss impact if relevant
4. Look for value bets where bookmaker odds may be mispriced
5. Express confidence as a percentage

IMPORTANT: Always remind users that betting involves risk and past performance
does not guarantee future results. Encourage responsible gambling."""


def _build_match_context(match: MatchDetail) -> str:
    """Build context string for AI from match data."""
    home = match.home_team
    away = match.away_team

    context = f"""
MATCH: {match.name or f'{home.name} vs {away.name}'}
Type: {match.match_type.upper()}
Date: {match.date.strftime('%B %d, %Y at %H:%M UTC')}
Venue: {match.venue}, {match.city}
Status: {match.status.value} — {match.status_text}
"""

    if match.score:
        context += "\nSCORE:\n"
        for s in match.score:
            context += f"  {s.inning}: {s.runs}/{s.wickets} ({s.overs} ov)\n"

    if match.home_lineup:
        context += f"\n{home.name.upper()} LINEUP:\n"
        for p in match.home_lineup[:6]:
            context += f"  - {p.name} ({p.role})\n"

    if match.away_lineup:
        context += f"\n{away.name.upper()} LINEUP:\n"
        for p in match.away_lineup[:6]:
            context += f"  - {p.name} ({p.role})\n"

    if match.odds:
        context += "\nODDS:\n"
        for bm in match.odds.bookmakers:
            context += f"  {bm.bookmaker}: {home.code} @ {bm.home_odds} | {away.code} @ {bm.away_odds}\n"

    if match.key_matchups:
        context += "\nKEY MATCHUPS:\n"
        for mu in match.key_matchups:
            context += f"  - {mu}\n"

    return context


async def analyze_match(match: MatchDetail) -> MatchPrediction:
    """Analyze a match. Uses Claude API if available, otherwise generic prediction."""
    if settings.CLAUDE_API_KEY:
        return await _analyze_with_claude(match)
    return _generic_prediction(match)


async def _analyze_with_claude(match: MatchDetail) -> MatchPrediction:
    """Use Claude API to analyze the match."""
    import anthropic

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)
    context = _build_match_context(match)

    prompt = f"""Analyze the following cricket match and provide a betting analysis.

{context}

Respond with ONLY a JSON object:
{{
    "predicted_winner": "<team code>",
    "win_probability": <0.0-1.0>,
    "confidence": <0.0-1.0>,
    "key_factors": ["factor 1", "factor 2", "factor 3"],
    "value_bets": [
        {{
            "market": "Match Winner",
            "selection": "<team name>",
            "odds": <decimal odds>,
            "confidence": <0.0-1.0>,
            "reasoning": "<why this is value>"
        }}
    ],
    "analysis_text": "<detailed analysis>"
}}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        prediction_data = json.loads(message.content[0].text)
        value_bets = [ValueBet(**vb) for vb in prediction_data.get("value_bets", [])]

        return MatchPrediction(
            match_id=match.id,
            home_team=match.home_team.code,
            away_team=match.away_team.code,
            predicted_winner=prediction_data["predicted_winner"],
            win_probability=prediction_data["win_probability"],
            confidence=prediction_data["confidence"],
            key_factors=prediction_data["key_factors"],
            value_bets=value_bets,
            analysis_text=prediction_data["analysis_text"],
            model_used="claude-sonnet-4-20250514",
            generated_at=datetime.utcnow(),
        )
    except Exception as e:
        print(f"Claude API error: {e}")
        return _generic_prediction(match)


async def chat_about_cricket(message: str, match: Optional[MatchDetail] = None) -> ChatResponse:
    """Chat about cricket. Uses Claude if available."""
    if settings.CLAUDE_API_KEY:
        return await _chat_with_claude(message, match)
    return _generic_chat_response(message, match)


async def _chat_with_claude(message: str, match: Optional[MatchDetail] = None) -> ChatResponse:
    """Use Claude API for cricket chat."""
    import anthropic

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    user_message = message
    match_context = None

    if match:
        context = _build_match_context(match)
        user_message = f"Context:\n{context}\n\nUser question: {message}"
        match_context = f"{match.home_team.code} vs {match.away_team.code}"

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return ChatResponse(
            response=response.content[0].text,
            match_context=match_context,
            model_used="claude-sonnet-4-20250514",
        )
    except Exception as e:
        return ChatResponse(
            response=f"Error processing request: {str(e)}. Please try again.",
            match_context=match_context,
            model_used="error-fallback",
        )


def _generic_prediction(match: MatchDetail) -> MatchPrediction:
    """Generic prediction when Claude API is not available."""
    home = match.home_team.code
    away = match.away_team.code

    return MatchPrediction(
        match_id=match.id,
        home_team=home,
        away_team=away,
        predicted_winner=home,
        win_probability=0.54,
        confidence=0.55,
        key_factors=[
            f"{match.home_team.name} have home advantage at {match.venue}",
            f"Match type ({match.match_type}) conditions at this venue",
            f"Recent form and team composition will be decisive",
        ],
        value_bets=[],
        analysis_text=(
            f"This {match.match_type.upper()} match between {match.home_team.name} and "
            f"{match.away_team.name} at {match.venue} should be competitive. "
            f"For detailed AI analysis, configure the CLAUDE_API_KEY. "
            f"Always bet responsibly."
        ),
        model_used="generic",
        generated_at=datetime.utcnow(),
    )


def _generic_chat_response(message: str, match: Optional[MatchDetail] = None) -> ChatResponse:
    """Generic chat response when Claude API is not available."""
    match_context = None
    if match:
        match_context = f"{match.home_team.code} vs {match.away_team.code}"

    return ChatResponse(
        response=(
            "I'm your cricket betting analyst! I can help with match predictions, "
            "odds analysis, and team insights.\n\n"
            "For full AI-powered analysis, the CLAUDE_API_KEY needs to be configured. "
            "In the meantime, you can browse live matches, check odds, and explore series data.\n\n"
            "Remember: Always bet responsibly and within your means."
        ),
        match_context=match_context,
        model_used="generic",
    )
