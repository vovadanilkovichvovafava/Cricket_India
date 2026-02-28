import { ENV } from '../config/env';

const BASE = ENV.API_URL;

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/users/me'),

  // Matches
  getMatches: (params) => request(`/matches?${new URLSearchParams(params)}`),
  getMatch: (id) => request(`/matches/${id}`),
  getLiveMatches: () => request('/matches/live'),

  // Predictions
  getPrediction: (matchId) => request(`/predictions/${matchId}`),
  getChatLimit: () => request('/predictions/chat-limit'),
  chat: (data) => request('/predictions/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Cricket-specific
  getIPLSchedule: () => request('/cricket/ipl/schedule'),
  getIPLStandings: () => request('/cricket/ipl/standings'),
  getPlayerStats: (id) => request(`/cricket/player/${id}`),
  getValueBets: () => request('/cricket/value-bets'),
  getOddsComparison: (matchId) => request(`/cricket/odds/${matchId}`),
};

export default api;
