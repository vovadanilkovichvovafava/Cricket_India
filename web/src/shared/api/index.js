import { ENV } from '../config/env';
import { getTeamColor } from '../utils/teamColors';

const BASE = ENV.API_URL;

// In-memory API cache (stale-while-revalidate)
const apiCache = new Map();
const CACHE_TTL = { list: 120000, detail: 300000 }; // 2min lists, 5min details

function getCached(key) {
  const entry = apiCache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.ts;
  const ttl = key.includes('/matches/') && !key.includes('?') ? CACHE_TTL.detail : CACHE_TTL.list;
  return { data: entry.data, fresh: age < ttl };
}

function setCache(key, data) {
  apiCache.set(key, { data, ts: Date.now() });
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Cache GET requests only
  const isGet = !options.method || options.method === 'GET';
  if (isGet) {
    const cached = getCached(path);
    if (cached?.fresh) return cached.data;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    // Only clear token & redirect for the initial session check (/auth/me)
    // For all other endpoints (chat, predictions, etc.) — just throw error,
    // let the component show an upgrade modal or error message
    if (path === '/auth/me') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const err = new Error('Session expired');
    err.status = 401;
    err.detail = 'session_expired';
    throw err;
  }
  if (!res.ok) {
    let detail = '';
    let detailObj = null;
    try { const body = await res.json(); detailObj = body.detail; detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail) || ''; } catch {}
    const err = new Error(detail || `API Error: ${res.status}`);
    err.status = res.status;
    err.detail = detailObj || detail;
    throw err;
  }
  const data = await res.json();

  if (isGet) setCache(path, data);
  return data;
}

// Normalize API match summary → frontend format
function normalizeMatch(m) {
  if (!m.home_team) return m; // already normalized or different format
  return {
    id: m.id,
    home: m.home_team.code,
    away: m.away_team.code,
    homeName: m.home_team.name,
    awayName: m.away_team.name,
    homeColor: (m.home_team.color && m.home_team.color !== '#6B7280') ? m.home_team.color : getTeamColor(m.home_team.code),
    awayColor: (m.away_team.color && m.away_team.color !== '#6B7280') ? m.away_team.color : getTeamColor(m.away_team.code),
    homeImg: m.home_team.img,
    awayImg: m.away_team.img,
    name: m.name || '',
    matchType: m.match_type || 't20',
    date: m.date,
    venue: m.venue || '',
    city: m.city || '',
    status: m.status,
    statusText: m.status_text || '',
    seriesId: m.series_id,
    score: (m.score || []).map(s => ({
      runs: s.runs,
      wickets: s.wickets,
      overs: s.overs,
      inning: s.inning,
    })),
    odds: m.odds ? {
      home: m.odds.best_home_odds ?? m.odds.bookmakers?.[0]?.home_odds ?? null,
      away: m.odds.best_away_odds ?? m.odds.bookmakers?.[0]?.away_odds ?? null,
    } : null,
  };
}

// Normalize API match detail → frontend format
function normalizeMatchDetail(m) {
  if (!m.home_team) return m;
  const base = normalizeMatch(m);
  return {
    ...base,
    lineups: {
      home: (m.home_lineup || []).map(p => `${p.name}${p.is_captain ? ' (c)' : ''}${p.role === 'wicket-keeper' ? ' (wk)' : ''}`),
      away: (m.away_lineup || []).map(p => `${p.name}${p.is_captain ? ' (c)' : ''}${p.role === 'wicket-keeper' ? ' (wk)' : ''}`),
    },
    venueStats: m.venue_stats ? {
      matches: m.venue_stats.matches_played || 0,
      avgFirst: m.venue_stats.avg_first_innings_score,
      avgSecond: m.venue_stats.avg_second_innings_score,
      tossWinBat: Math.round(m.venue_stats.toss_bat_first_win_pct || 50),
      chaseWin: Math.round(m.venue_stats.toss_bowl_first_win_pct || 45),
    } : null,
    h2h: m.head_to_head ? {
      total: m.head_to_head.total_matches,
      homeWins: m.head_to_head.home_wins,
      awayWins: m.head_to_head.away_wins,
      lastFive: m.head_to_head.last_5_results || [],
    } : null,
    oddsComparison: (m.odds?.bookmakers || []).map(b => ({
      bookmaker: b.bookmaker,
      home: b.home_odds,
      away: b.away_odds,
    })),
    keyMatchups: m.key_matchups || [],
    weatherForecast: m.weather_forecast,
  };
}

// Normalize AI prediction → frontend format
function normalizePrediction(p) {
  if (!p.predicted_winner) return p;
  return {
    winner: p.predicted_winner,
    confidence: Math.round((p.confidence || 0) * 100),
    analysis: p.analysis_text || '',
    factors: (p.key_factors || []).map((f, i) => {
      if (typeof f === 'string') {
        return { label: f.split(' - ')[0] || f, impact: i < 2 ? 'positive' : 'neutral', detail: f };
      }
      return { label: f.factor || f.label || f, impact: f.impact || 'neutral', detail: f.detail || '' };
    }),
    valueBets: (p.value_bets || []).map(b => ({
      market: b.market,
      pick: b.pick || b.selection,
      odds: b.odds,
      risk: b.risk || 'Medium',
      value: b.reasoning || '',
      confidence: typeof b.confidence === 'number'
        ? (b.confidence >= 0.7 ? 'High' : b.confidence >= 0.5 ? 'Medium' : 'Low')
        : (b.confidence || 'Medium'),
    })),
  };
}

const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  getReferral: () => request('/auth/referral'),

  // Matches (normalized)
  getMatches: async (params) => {
    const data = await request(`/cricket/matches?${new URLSearchParams(params || {})}`);
    return Array.isArray(data) ? data.map(normalizeMatch) : data;
  },
  getMatch: async (id) => {
    const data = await request(`/cricket/matches/${id}`);
    return normalizeMatchDetail(data);
  },
  getLiveMatches: async () => {
    const data = await request('/cricket/matches/live');
    return Array.isArray(data) ? data.map(normalizeMatch) : data;
  },

  // Series
  getSeries: async (params) => {
    const data = await request(`/cricket/series?${new URLSearchParams(params || {})}`);
    return Array.isArray(data) ? data : [];
  },
  getSeriesMatches: async (seriesId) => {
    const data = await request(`/cricket/series/${seriesId}/matches`);
    return Array.isArray(data) ? data.map(normalizeMatch) : [];
  },

  // Predictions (normalized)
  getPrediction: async (matchId) => {
    const data = await request(`/predictions/${matchId}`);
    return normalizePrediction(data);
  },
  getChatLimit: () => request('/predictions/chat-limit'),
  getPredictionStats: () => request('/predictions/stats/accuracy'),
  chat: (data) => request('/predictions/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Standings
  getStandings: (seriesId) => seriesId
    ? request(`/cricket/standings/${seriesId}`)
    : request('/cricket/standings'),

  // Players
  searchPlayers: (query, offset = 0) =>
    request(`/cricket/players/search?q=${encodeURIComponent(query)}&offset=${offset}`),
  getPlayer: (playerId) => request(`/cricket/players/${playerId}`),

  // Scorecard, Squad, Totals, Fantasy Points, Ball-by-Ball
  getScorecard: (matchId) => request(`/cricket/matches/${matchId}/scorecard`),
  getSquad: (matchId) => request(`/cricket/matches/${matchId}/squad`),
  getTotals: (matchId) => request(`/cricket/matches/${matchId}/totals`),
  getFantasyPoints: (matchId) => request(`/cricket/matches/${matchId}/fantasy-points`),
  getBallByBall: (matchId) => request(`/cricket/matches/${matchId}/ball-by-ball`),

  // Match Chat & Voting
  getChatMessages: (matchId, after) => request(`/matches/${matchId}/chat${after ? `?after=${after}` : ''}`),
  postChatMessage: (matchId, data) => request(`/matches/${matchId}/chat`, { method: 'POST', body: JSON.stringify(data) }),
  getVotes: (matchId, userId) => request(`/matches/${matchId}/vote${userId ? `?user_id=${userId}` : ''}`),
  castVote: (matchId, data) => request(`/matches/${matchId}/vote`, { method: 'POST', body: JSON.stringify(data) }),

  // Support Chat (free for all users)
  supportChat: (data) => request('/support/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Status
  getStatus: () => request('/status'),

  // Cache management
  clearCache: () => apiCache.clear(),
};

export default api;
