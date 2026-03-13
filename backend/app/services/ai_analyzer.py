"""
AI-powered match analysis service using Anthropic's Claude API.
Falls back to generic responses when CLAUDE_API_KEY is not configured.

KEY FEATURE: When no specific match_id is provided, automatically fetches
current matches + odds from CricAPI & The Odds API to give Claude
real-time cricket context for every user question.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from app.config import settings
from app.models import (
    MatchDetail,
    MatchPrediction,
    ValueBet,
    ChatResponse,
    SupportChatResponse,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are PreScoreAI — an expert cricket betting analyst built for the Indian market.

Your deep knowledge covers:
- IPL 2026 (all 10 teams: CSK, MI, RCB, KKR, DC, SRH, RR, PBKS, LSG, GT)
- All major cricket leagues (BBL, PSL, CPL, international cricket)
- Team squads, strengths, weaknesses, and recent form
- Venue conditions, pitch behavior, and weather impact
- T20, ODI, and Test cricket tactics
- Betting markets, odds analysis, and value identification
- Indian bookmakers and betting strategies

IMPORTANT RULES:
1. You receive REAL-TIME cricket data (current matches, scores, odds) as context. USE THIS DATA in your answers.
2. When asked about "today's matches", "best bets", "who's playing" — refer to the actual match data provided.
3. Analyze odds from bookmakers and identify VALUE BETS where the odds seem mispriced.
4. Express confidence as percentages. Give specific, actionable insights.
5. Format responses with markdown: use **bold** for team names and key points, bullet lists for factors.
6. Keep responses concise but informative (3-5 paragraphs max).
7. If live match data is available, comment on the current state.
8. Always remind users that betting involves risk. Encourage responsible gambling.
9. Respond in the SAME LANGUAGE as the user's message (Hindi or English).
10. When no relevant match data is available, use your general cricket knowledge but be transparent about it.

CRITICAL — VALUE BETS BLOCK:
At the VERY END of EVERY response, you MUST include exactly 3 value bet recommendations as a JSON block.
The block must start with <<<BETS>>> and end with <<<\/BETS>>> on separate lines.
Format:
<<<BETS>>>
[
  {"market": "Match Winner", "selection": "CSK to Win", "odds": 1.85, "confidence": 0.65, "risk": "Low", "reasoning": "Short 1-sentence explanation"},
  {"market": "Top Batsman", "selection": "Virat Kohli", "odds": 4.50, "confidence": 0.45, "risk": "Medium", "reasoning": "Short 1-sentence explanation"},
  {"market": "Total Runs O/U", "selection": "Over 340.5", "odds": 1.90, "confidence": 0.55, "risk": "Medium", "reasoning": "Short 1-sentence explanation"}
]
<<<\/BETS>>>

Rules for bets:
- Use REAL odds from the provided data when available, otherwise use realistic odds
- Each bet must have a different market (e.g. Match Winner, Top Batsman, Total Runs O/U, First Innings Score, Toss Winner, etc.)
- confidence: float 0.0-1.0, risk: "Low"|"Medium"|"High"
- reasoning: max 15 words
- The bets block is REQUIRED even for general cricket questions — just make them relevant to current matches"""


import re

def _parse_chat_bets(raw_text: str) -> tuple:
    """
    Extract value bets JSON block from Claude's chat response.
    Returns (clean_text, list_of_ValueBet).
    """
    bets = []
    clean_text = raw_text

    # Find <<<BETS>>>...<<<\/BETS>>> or <<<BETS>>>...<<</BETS>>> block
    pattern = r'<<<BETS>>>\s*([\s\S]*?)\s*<<<\\?/BETS>>>'
    match_obj = re.search(pattern, raw_text)

    if match_obj:
        json_str = match_obj.group(1).strip()
        # Remove the bets block from the visible text
        clean_text = raw_text[:match_obj.start()].rstrip()

        try:
            bets_data = json.loads(json_str)
            if isinstance(bets_data, list):
                for b in bets_data[:3]:  # max 3 bets
                    bets.append(ValueBet(
                        market=b.get("market", "Match Winner"),
                        selection=b.get("selection", ""),
                        odds=b.get("odds"),
                        confidence=b.get("confidence"),
                        risk=b.get("risk", "Medium"),
                        reasoning=b.get("reasoning", ""),
                    ))
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Failed to parse chat bets JSON: {e}")

    # If no bets parsed, return empty list — frontend handles gracefully
    return clean_text, bets


def _build_match_context(match: MatchDetail) -> str:
    """Build context string for AI from a single match detail."""
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


async def _build_auto_context() -> str:
    """
    Auto-fetch current matches + IPL odds to provide real-time context
    for Claude when no specific match_id is given.
    This is the KEY to making the AI chat "smart" — it always has data.
    """
    from app.services.cricket_api import cricket_service
    from app.services.odds_service import fetch_cricket_odds

    context_parts = []
    context_parts.append(f"TODAY'S DATE: {datetime.utcnow().strftime('%B %d, %Y')}")
    context_parts.append("IPL 2026 Season: March 28 — May 31, 2026")

    # 1. Fetch current/recent matches from CricAPI
    try:
        matches = await cricket_service.get_current_matches()
        if matches:
            # Separate by status
            live = [m for m in matches if m.status.value == "live"]
            upcoming = [m for m in matches if m.status.value == "upcoming"]
            completed = [m for m in matches if m.status.value == "completed"]

            if live:
                context_parts.append(f"\n🔴 LIVE MATCHES ({len(live)}):")
                for m in live:
                    line = f"  • {m.name} ({m.match_type.upper()})"
                    line += f" | {m.venue}, {m.city}"
                    line += f" | {m.status_text}"
                    if m.score:
                        for s in m.score:
                            line += f"\n    Score: {s.inning}: {s.runs}/{s.wickets} ({s.overs} ov)"
                    context_parts.append(line)

            if upcoming:
                context_parts.append(f"\n📅 UPCOMING MATCHES ({len(upcoming)}):")
                for m in upcoming[:10]:  # max 10
                    line = f"  • {m.name} ({m.match_type.upper()})"
                    line += f" | {m.date.strftime('%b %d, %H:%M UTC')}"
                    line += f" | {m.venue}, {m.city}"
                    if m.status_text:
                        line += f" | {m.status_text}"
                    context_parts.append(line)

            if completed:
                context_parts.append(f"\n✅ RECENTLY COMPLETED ({len(completed)}):")
                for m in completed[:5]:  # max 5
                    line = f"  • {m.name} ({m.match_type.upper()})"
                    line += f" | Result: {m.status_text}"
                    if m.score:
                        for s in m.score:
                            line += f"\n    {s.inning}: {s.runs}/{s.wickets} ({s.overs} ov)"
                    context_parts.append(line)
        else:
            context_parts.append("\nNo current matches data available from CricAPI.")
    except Exception as e:
        logger.warning(f"Failed to fetch current matches for AI context: {e}")
        context_parts.append(f"\n(Could not fetch current matches: {e})")

    # 2. Fetch IPL odds from The Odds API
    try:
        odds_data = await fetch_cricket_odds("cricket_ipl")
        if odds_data and len(odds_data) > 0:
            context_parts.append(f"\n💰 IPL BETTING ODDS ({len(odds_data)} events):")
            for event in odds_data:
                home = event.get("home_team", "Unknown")
                away = event.get("away_team", "Unknown")
                commence = event.get("commence_time", "")

                # Get best odds from first bookmaker
                bookmakers = event.get("bookmakers", [])
                odds_str = ""
                if bookmakers:
                    # Collect all bookmaker odds
                    all_home = []
                    all_away = []
                    bm_details = []
                    for bm in bookmakers[:5]:  # max 5 bookmakers
                        h2h = next((mk for mk in bm.get("markets", []) if mk["key"] == "h2h"), None)
                        if h2h:
                            outcomes = {o["name"]: o["price"] for o in h2h.get("outcomes", [])}
                            h_odds = outcomes.get(home, 0)
                            a_odds = outcomes.get(away, 0)
                            if h_odds and a_odds:
                                all_home.append(h_odds)
                                all_away.append(a_odds)
                                bm_details.append(f"{bm.get('title', '?')}: {home} @ {h_odds} | {away} @ {a_odds}")

                    if all_home and all_away:
                        best_h = max(all_home)
                        best_a = max(all_away)
                        odds_str = f" | Best odds: {home} @ {best_h}, {away} @ {best_a}"
                        odds_str += f"\n    Bookmakers: {'; '.join(bm_details[:3])}"

                line = f"  • {home} vs {away}"
                if commence:
                    try:
                        ct = datetime.fromisoformat(commence.replace("Z", "+00:00"))
                        line += f" | {ct.strftime('%b %d, %H:%M UTC')}"
                    except ValueError:
                        pass
                line += odds_str
                context_parts.append(line)
        else:
            context_parts.append("\nNo IPL odds data currently available.")
    except Exception as e:
        logger.warning(f"Failed to fetch odds for AI context: {e}")

    # 3. Also try other cricket odds (T20 World Cup, ODI, etc.)
    for sport_key in ["cricket_t20_world_cup", "cricket_t20_intl"]:
        try:
            other_odds = await fetch_cricket_odds(sport_key)
            if other_odds and len(other_odds) > 0:
                label = sport_key.replace("cricket_", "").replace("_", " ").upper()
                context_parts.append(f"\n💰 {label} ODDS ({len(other_odds)} events):")
                for event in other_odds[:5]:
                    home = event.get("home_team", "Unknown")
                    away = event.get("away_team", "Unknown")
                    bookmakers = event.get("bookmakers", [])
                    if bookmakers:
                        bm = bookmakers[0]
                        h2h = next((mk for mk in bm.get("markets", []) if mk["key"] == "h2h"), None)
                        if h2h:
                            outcomes = {o["name"]: o["price"] for o in h2h.get("outcomes", [])}
                            h_odds = outcomes.get(home, "?")
                            a_odds = outcomes.get(away, "?")
                            context_parts.append(
                                f"  • {home} vs {away} | {bm.get('title', '?')}: {home} @ {h_odds}, {away} @ {a_odds}"
                            )
        except Exception:
            pass

    return "\n".join(context_parts) if context_parts else ""


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

    prompt = f"""Analyze this cricket match and give SPECIFIC betting recommendations.

{context}

You MUST provide exactly 3 value bets — the TOP 3 most profitable picks for this match.
Consider different markets: Match Winner, Top Batsman, Top Bowler, Total Runs O/U, First Innings Score, Fours/Sixes, Toss Winner, etc.

For each bet, calculate:
- The realistic odds (decimal format, e.g. 1.85, 2.40, 3.50)
- Your estimated true probability vs bookmaker implied probability
- Risk level: "Low" (safe, lower payout), "Medium" (balanced), "High" (risky but high reward)

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{{
    "predicted_winner": "<team code, e.g. CSK, MI, ARG>",
    "win_probability": <0.0-1.0>,
    "confidence": <0.0-1.0>,
    "key_factors": [
        {{"factor": "<short title>", "detail": "<1-2 sentence explanation>", "impact": "positive|negative|neutral"}},
        {{"factor": "<short title>", "detail": "<explanation>", "impact": "positive|negative|neutral"}},
        {{"factor": "<short title>", "detail": "<explanation>", "impact": "positive|negative|neutral"}},
        {{"factor": "<short title>", "detail": "<explanation>", "impact": "positive|negative|neutral"}}
    ],
    "value_bets": [
        {{
            "market": "<specific market name>",
            "selection": "<specific pick>",
            "odds": <decimal odds>,
            "confidence": <0.0-1.0>,
            "risk": "Low|Medium|High",
            "reasoning": "<why this is a value bet — mention probability edge>"
        }},
        {{
            "market": "<market>",
            "selection": "<pick>",
            "odds": <decimal>,
            "confidence": <0.0-1.0>,
            "risk": "Low|Medium|High",
            "reasoning": "<reasoning>"
        }},
        {{
            "market": "<market>",
            "selection": "<pick>",
            "odds": <decimal>,
            "confidence": <0.0-1.0>,
            "risk": "Low|Medium|High",
            "reasoning": "<reasoning>"
        }}
    ],
    "analysis_text": "<2-3 paragraph detailed analysis>"
}}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse response — strip markdown code blocks if present
        raw_text = message.content[0].text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3].strip()

        prediction_data = json.loads(raw_text)
        value_bets = [ValueBet(**vb) for vb in prediction_data.get("value_bets", [])]

        # Normalize key_factors: accept both strings and dicts
        raw_factors = prediction_data.get("key_factors", [])
        key_factors = []
        for f in raw_factors:
            if isinstance(f, dict):
                key_factors.append(f)
            else:
                key_factors.append({"factor": str(f), "detail": str(f), "impact": "neutral"})

        return MatchPrediction(
            match_id=match.id,
            home_team=match.home_team.code,
            away_team=match.away_team.code,
            predicted_winner=prediction_data["predicted_winner"],
            win_probability=prediction_data["win_probability"],
            confidence=prediction_data["confidence"],
            key_factors=key_factors,
            value_bets=value_bets,
            analysis_text=prediction_data["analysis_text"],
            model_used="claude-sonnet-4-20250514",
            generated_at=datetime.utcnow(),
        )
    except Exception as e:
        print(f"Claude API error: {e}")
        return _generic_prediction(match)


async def chat_about_cricket(message: str, match: Optional[MatchDetail] = None) -> ChatResponse:
    """
    Chat about cricket. Uses Claude if available.
    KEY: When no match is provided, auto-fetches current matches + odds
    so Claude always has real-time data to work with.
    """
    if settings.CLAUDE_API_KEY:
        return await _chat_with_claude(message, match)
    return _generic_chat_response(message, match)


async def _chat_with_claude(message: str, match: Optional[MatchDetail] = None) -> ChatResponse:
    """Use Claude API for cricket chat with automatic data enrichment."""
    import anthropic

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    user_message = message
    match_context = None

    if match:
        # Specific match context (when match_id provided)
        context = _build_match_context(match)
        user_message = f"Match Context:\n{context}\n\nUser question: {message}"
        match_context = f"{match.home_team.code} vs {match.away_team.code}"
    else:
        # AUTO-FETCH: Get current matches + odds for context
        # This is what makes the AI "smart" — it always has data
        try:
            auto_context = await _build_auto_context()
            if auto_context:
                user_message = f"""Here is the latest real-time cricket data:

{auto_context}

---
User question: {message}

Please answer based on the real data above. If the user asks about today's matches, best bets, odds, or any cricket question — use the actual data provided."""
                logger.info(f"AI Chat: enriched message with {len(auto_context)} chars of context")
            else:
                logger.warning("AI Chat: no auto-context available, sending raw message")
        except Exception as e:
            logger.warning(f"AI Chat: failed to build auto-context: {e}")
            # Continue without context — better than failing

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_text = response.content[0].text
        text_body, bets = _parse_chat_bets(raw_text)
        return ChatResponse(
            response=text_body,
            match_context=match_context,
            model_used="claude-sonnet-4-20250514",
            value_bets=bets,
        )
    except Exception as e:
        logger.error(f"Claude API error in chat: {e}")
        return ChatResponse(
            response=f"Sorry, I encountered an error processing your request. Please try again. (Error: {str(e)[:100]})",
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
            {"factor": "Home advantage", "detail": f"{match.home_team.name} playing at {match.venue} — historically strong at home", "impact": "positive"},
            {"factor": "Match format", "detail": f"{match.match_type.upper()} conditions favor the home side at this venue", "impact": "positive"},
            {"factor": "Team balance", "detail": "Both teams have competitive squads, making this a closely contested match", "impact": "neutral"},
            {"factor": "Recent form", "detail": "Recent results and team composition will be the deciding factor", "impact": "neutral"},
        ],
        value_bets=[
            ValueBet(
                market="Match Winner",
                selection=match.home_team.name,
                odds=1.85,
                confidence=0.62,
                risk="Low",
                reasoning=f"Home advantage at {match.venue} gives {home} a slight edge. Conservative but likely profitable pick.",
            ),
            ValueBet(
                market="Total Runs Over/Under",
                selection="Over 320.5",
                odds=1.90,
                confidence=0.58,
                risk="Medium",
                reasoning=f"This venue typically produces high-scoring {match.match_type.upper()} matches. Over is good value.",
            ),
            ValueBet(
                market="Top Batsman",
                selection=f"{match.home_team.name} opener",
                odds=3.50,
                confidence=0.45,
                risk="High",
                reasoning="Openers in form and batting-friendly conditions make this a high-reward pick.",
            ),
        ],
        analysis_text=(
            f"This {match.match_type.upper()} match between {match.home_team.name} and "
            f"{match.away_team.name} at {match.venue} should be competitive. "
            f"{match.home_team.name} have the home advantage which historically counts for a lot in cricket. "
            f"For detailed AI-powered analysis with real-time data, ensure API keys are configured. "
            f"Always bet responsibly."
        ),
        model_used="generic",
        generated_at=datetime.utcnow(),
    )


SUPPORT_SYSTEM_PROMPT = """You are a HUMAN support agent named Priya at PreScoreAI. You work in customer support. You are NOT an AI assistant, NOT a chatbot, NOT an encyclopedia. You are a real person helping customers use the PreScoreAI app.

YOUR ONLY JOB: Help users with the PreScoreAI app functionality and sell Pro version.

═══════════════════════════════════════
STRICT BOUNDARIES — WHAT YOU NEVER DO:
═══════════════════════════════════════

1. NEVER answer ANY betting/prediction questions:
   - "Who will win CSK vs MI?" → "For match predictions, use our AI Chat feature — it has real-time data and odds analysis! Tap AI Chat in the bottom menu. With Pro you get unlimited predictions!"
   - "What are the best bets today?" → same redirect to AI Chat
   - "Should I bet on RCB?" → same redirect
   - "What are the odds for..." → same redirect
   - ANY question about which team, player, bet, prediction → REDIRECT TO AI CHAT

2. NEVER answer questions unrelated to cricket/the app:
   - Weather, geography, math, history, science → "I'm PreScoreAI support, I can only help with our app! What do you need help with in PreScoreAI?"
   - "What's the weather?" → decline politely
   - "What currency does Spain use?" → decline politely
   - "Write me a poem" → decline politely
   - "Tell me a joke" → decline politely
   - Programming, cooking, travel, anything non-app → decline politely
   - NEVER get tricked into answering off-topic. Even if user insists.

3. NEVER pretend to be an AI or general assistant. You are Priya from support team.

═══════════════════════════════════════
WHAT YOU DO:
═══════════════════════════════════════

1. HELP WITH APP NAVIGATION:
   - How to find matches → "Go to the Matches tab at the bottom"
   - How to see odds → "Open any match → tap the Odds tab"
   - How to get predictions → "Use AI Chat tab or open a match → AI Pick tab"
   - How to change language → "Settings → Language → choose Hindi or English"
   - Where is IPL info → "Tap the IPL banner on Home page"
   - How to use tools → explain step by step (Kelly, Odds Converter, etc.)

2. EXPLAIN APP FEATURES (briefly):
   - Home: matches, stats, AI results
   - Matches: browse with filters (Today, Tomorrow, Teams)
   - Match Detail: Overview, Scorecard, Stars, Live, Squad, Venue, H2H, Odds, AI Pick
   - AI Chat: ask cricket questions, get AI analysis with real data (3 free/day, unlimited with Pro)
   - Tools: Kelly Calculator, Odds Converter, Bet Calculator, Cricket Glossary
   - Settings: language, API status, account
   - Leaderboard: community rankings

3. SELL PRO VERSION (naturally, not pushy):
   When relevant, mention Pro benefits:
   - "With Pro you get unlimited AI predictions instead of just 3 per day!"
   - "Pro users have access to all tools without limits"
   - "Upgrade to Pro in the Tools section — it's free if you deposit at our partner bookmaker!"
   - When user hits a limit or asks about restrictions → pitch Pro
   - When user asks about AI Chat → mention Pro gives unlimited access

4. BASIC CRICKET TERMS (only if user asks what something means IN the app):
   - What does "value bet" mean in the app
   - What is "Kelly Calculator" for
   - What does "Over/Under" mean
   Keep it brief, 1-2 sentences.

═══════════════════════════════════════
TONE & STYLE:
═══════════════════════════════════════
- Talk like a real support agent, not a robot
- Be warm, friendly, casual
- Use "we" (our app, our AI Chat feature)
- Short answers — 2-4 sentences max, not essays
- Respond in the SAME LANGUAGE as the user (Hindi or English)
- Use 1-2 emoji max per message
- Sign off with your name sometimes: "— Priya"
- If user is confused, offer step-by-step: "Step 1:... Step 2:..."
- If user is frustrated, empathize: "I totally understand, let me help!"

═══════════════════════════════════════
EXAMPLES:
═══════════════════════════════════════

User: "Who will win today's match?"
You: "I can't help with predictions, but our AI Chat feature is amazing for that! Tap AI Chat in the bottom menu — it analyzes real-time odds and gives you the best picks. You get 3 free predictions per day, or go Pro for unlimited! 🏏"

User: "What's the weather in Mumbai?"
You: "Hey! I'm from PreScoreAI support — I can only help with our app. Need help finding a match, using a tool, or navigating something? I'm here for that! 😊"

User: "How do I use Kelly Calculator?"
You: "Easy! Go to Tools tab → Kelly Calculator. Enter your estimated win % and the bookmaker odds — it calculates the perfect bet size. Try Half-Kelly if you want to play it safe! Want me to walk you through it step by step?"

User: "कैसे काम करता है ये ऐप?"
You: "नमस्ते! 🏏 बहुत आसान है — नीचे मेनू में Home पर मैच दिखते हैं, किसी भी मैच पर टैप करो तो पूरा analysis मिलेगा। AI Chat में कुछ भी पूछ सकते हो। Pro लेने पर unlimited predictions मिलेंगी! कुछ और जानना है?"

User: "What's 2+2?"
You: "Haha, I'm just the PreScoreAI support team! Math is not my department 😄 But if you need help with odds, bet calculations, or anything in the app — I'm your person!"

User: "Why is it limited to 3 requests?"
You: "Free users get 3 AI predictions per day. Want unlimited? Go Pro! It's actually free — just deposit at our partner bookmaker and Pro unlocks automatically. Go to Tools → Get Pro. Worth it! 🚀"
"""


async def support_chat(message: str) -> SupportChatResponse:
    """Support chat — helps users navigate the app and understand concepts."""
    if settings.CLAUDE_API_KEY:
        return await _support_with_claude(message)
    return _generic_support_response(message)


async def _support_with_claude(message: str) -> SupportChatResponse:
    """Use Claude for support chat."""
    import anthropic

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            system=SUPPORT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}],
        )
        return SupportChatResponse(
            response=response.content[0].text,
            model_used="claude-sonnet-4-20250514",
        )
    except Exception as e:
        logger.error(f"Claude API error in support chat: {e}")
        return SupportChatResponse(
            response="Sorry, I'm having trouble right now. Please try again in a moment! 🏏",
            model_used="error-fallback",
        )


def _generic_support_response(message: str) -> SupportChatResponse:
    """Generic support response when Claude API is not available."""
    msg = message.lower()

    if any(w in msg for w in ["who will win", "predict", "bet on", "best bet", "value bet",
                               "analysis", "should i bet", "odds for", "kisko", "kaun jeetega"]):
        text = ("For predictions, use our AI Chat feature — tap AI Chat in the bottom menu! "
                "It analyzes real-time data and odds. 3 free per day, unlimited with Pro! 🏏 — Priya")
    elif any(w in msg for w in ["kelly", "calculator", "bet size", "bankroll"]):
        text = ("Easy! Go to Tools → Kelly Calculator. Enter win probability + odds — "
                "it shows the optimal bet size. Half-Kelly is safer for beginners! "
                "Need step-by-step help? Just ask! 🏏 — Priya")
    elif any(w in msg for w in ["odds", "convert", "decimal", "fractional"]):
        text = ("Go to Tools → Odds Converter! Enter odds in any format and see the rest. "
                "Decimal 1.85 means ₹100 bet → ₹185 back. Simple! 🏏 — Priya")
    elif any(w in msg for w in ["how", "use", "app", "work", "help", "navigate", "kaise"]):
        text = ("Welcome! 🏏 Bottom menu has everything:\n"
                "Home → matches & stats\n"
                "Matches → all cricket matches\n"
                "Tools → calculators\n"
                "AI Chat → ask anything about cricket\n\n"
                "Tap any match for full analysis! Go Pro for unlimited AI picks. — Priya")
    elif any(w in msg for w in ["pro", "premium", "upgrade", "limit", "free", "unlimited"]):
        text = ("Free plan gives 3 AI predictions per day. Want unlimited? Go Pro! "
                "It's free — just deposit at our partner bookmaker. "
                "Go to Tools → Get Pro. Totally worth it! 🚀 — Priya")
    else:
        text = ("Hey! I'm Priya from PreScoreAI support 🏏\n\n"
                "I can help with:\n"
                "• App navigation & features\n"
                "• How to use our tools\n"
                "• Understanding the app\n\n"
                "For match predictions → use AI Chat tab!\n"
                "Ask me anything about the app!")

    return SupportChatResponse(response=text, model_used="generic")


def _generic_chat_response(message: str, match: Optional[MatchDetail] = None) -> ChatResponse:
    """Generic chat response when Claude API is not available."""
    match_context = None
    if match:
        match_context = f"{match.home_team.code} vs {match.away_team.code}"

    # Default fallback bets for generic mode
    fallback_bets = [
        ValueBet(market="Match Winner", selection="CSK to Win", odds=1.85, confidence=0.62, risk="Low", reasoning="Strong home record and consistent form"),
        ValueBet(market="Top Batsman", selection="Virat Kohli", odds=4.50, confidence=0.45, risk="Medium", reasoning="In excellent batting form this season"),
        ValueBet(market="Total Runs O/U", selection="Over 340.5", odds=1.90, confidence=0.55, risk="Medium", reasoning="High-scoring venue with flat pitch"),
    ]

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
        value_bets=fallback_bets,
    )
