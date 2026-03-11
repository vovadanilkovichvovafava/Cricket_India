import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../shared/api';
import BottomNav from '../../../shared/components/BottomNav';
import TricolorBar from '../../../shared/components/TricolorBar';

// IPL 2026 star players for quick-browse (name, role, team)
const IPL_STARS = [
  { name: 'Virat Kohli', role: 'Batsman', team: 'RCB', teamColor: '#E4002B' },
  { name: 'MS Dhoni', role: 'WK-Batsman', team: 'CSK', teamColor: '#FFCB05' },
  { name: 'Rohit Sharma', role: 'Batsman', team: 'MI', teamColor: '#004BA0' },
  { name: 'Jasprit Bumrah', role: 'Bowler', team: 'MI', teamColor: '#004BA0' },
  { name: 'Rashid Khan', role: 'Bowler', team: 'GT', teamColor: '#1C1C2B' },
  { name: 'Suryakumar Yadav', role: 'Batsman', team: 'MI', teamColor: '#004BA0' },
  { name: 'KL Rahul', role: 'WK-Batsman', team: 'LSG', teamColor: '#A72056' },
  { name: 'Rishabh Pant', role: 'WK-Batsman', team: 'DC', teamColor: '#17479E' },
];

// Role → color mapping
function roleColor(role) {
  if (!role) return 'bg-gray-100 text-gray-600';
  const r = role.toLowerCase();
  if (r.includes('bat')) return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  if (r.includes('bowl')) return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  if (r.includes('all')) return 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
  if (r.includes('wk') || r.includes('keeper')) return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

// First letter avatar
function Avatar({ name, color, size = 'w-12 h-12', textSize = 'text-lg' }) {
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center text-white font-bold ${textSize} shrink-0`}
      style={{ backgroundColor: color || '#6B7280' }}
    >
      {letter}
    </div>
  );
}

// Stat categories for display
function groupStats(stats) {
  const batting = [];
  const bowling = [];
  const other = [];

  for (const s of stats) {
    const fn = (s.fn || '').toLowerCase();
    const stat = (s.stat || '').toLowerCase();
    if (fn.includes('bat') || stat.includes('run') || stat.includes('hundred') || stat.includes('fifty') || stat.includes('strike') || stat.includes('average') && !stat.includes('bowl')) {
      batting.push(s);
    } else if (fn.includes('bowl') || stat.includes('wicket') || stat.includes('economy') || stat.includes('maiden') || stat.includes('bowl')) {
      bowling.push(s);
    } else {
      other.push(s);
    }
  }
  return { batting, bowling, other };
}

function formatStatName(stat) {
  return stat
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function PlayerStats() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  // Debounced search
  const searchPlayers = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      setSearchDone(false);
      return;
    }
    setLoading(true);
    setSearchDone(false);
    try {
      const data = await api.searchPlayers(q);
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    }
    setLoading(false);
    setSearchDone(true);
  }, []);

  // Search on enter or button click
  function handleSearch(e) {
    e?.preventDefault();
    searchPlayers(query);
  }

  // Load player profile
  async function loadPlayer(id, name) {
    setPlayerLoading(true);
    try {
      const data = await api.getPlayer(id);
      setSelectedPlayer(data);
    } catch {
      // If API fails, show basic info
      setSelectedPlayer({ id, name, country: '', stats: [] });
    }
    setPlayerLoading(false);
  }

  // Quick-browse star player
  async function handleStarClick(star) {
    setQuery(star.name);
    setLoading(true);
    setSearchDone(false);
    try {
      const data = await api.searchPlayers(star.name);
      const list = Array.isArray(data) ? data : [];
      setResults(list);
      // Auto-open first result
      if (list.length > 0) {
        loadPlayer(list[0].id, list[0].name);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
    setSearchDone(true);
  }

  // Player profile view
  if (selectedPlayer && !playerLoading) {
    const player = selectedPlayer;
    const { batting, bowling } = groupStats(player.stats || []);

    return (
      <div className="min-h-dvh bg-[#F0F2F5] dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] px-5 pt-6 pb-16">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedPlayer(null)} className="text-white/70 active:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">{t('players.profile')}</h1>
          </div>
        </div>

        <div className="px-5 -mt-10 pb-6">
          {/* Player card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex items-center gap-4">
              {player.player_img ? (
                <img
                  src={player.player_img}
                  alt={player.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#FF9933]/30"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <Avatar
                name={player.name}
                color="#FF9933"
                size={player.player_img ? 'w-16 h-16 hidden' : 'w-16 h-16'}
                textSize="text-2xl"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{player.name}</h2>
                {player.country && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{player.country}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {player.role && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColor(player.role)}`}>
                      {player.role}
                    </span>
                  )}
                  {player.batting_style && (
                    <span className="text-[10px] text-gray-400">{player.batting_style}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio info */}
            {(player.date_of_birth || player.place_of_birth || player.bowling_style) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                {player.date_of_birth && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('players.born')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{player.date_of_birth}</p>
                  </div>
                )}
                {player.place_of_birth && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('players.birthPlace')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{player.place_of_birth}</p>
                  </div>
                )}
                {player.batting_style && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('players.battingStyle')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{player.batting_style}</p>
                  </div>
                )}
                {player.bowling_style && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('players.bowlingStyle')}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{player.bowling_style}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Batting Stats */}
          {batting.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 3.5l-9 9a2 2 0 000 2.83l2.17 2.17a2 2 0 002.83 0l9-9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 4.5l5 5" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{t('players.battingStats')}</h3>
              </div>

              <div className="space-y-0">
                {batting.map((s, i) => (
                  <div key={i} className={`flex items-center justify-between py-2.5 ${i < batting.length - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatStatName(s.stat)}</p>
                      {s.matchtype && (
                        <p className="text-[10px] text-gray-400 uppercase">{s.matchtype}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white ml-4">{s.value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bowling Stats */}
          {bowling.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 6c1 3 1 5 0 7s-1 5 0 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 6c-1 3-1 5 0 7s1 5 0 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{t('players.bowlingStats')}</h3>
              </div>

              <div className="space-y-0">
                {bowling.map((s, i) => (
                  <div key={i} className={`flex items-center justify-between py-2.5 ${i < bowling.length - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatStatName(s.stat)}</p>
                      {s.matchtype && (
                        <p className="text-[10px] text-gray-400 uppercase">{s.matchtype}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white ml-4">{s.value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No stats */}
          {(player.stats || []).length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('players.noStats')}</p>
            </div>
          )}

          <div className="mt-6">
            <TricolorBar className="mb-3" />
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // Search & browse view
  return (
    <div className="min-h-dvh bg-[#F0F2F5] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] px-5 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/tools')} className="text-white/70 active:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{t('players.title')}</h1>
            <p className="text-blue-200/60 text-xs">{t('players.subtitle')}</p>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('players.searchPlaceholder')}
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/50 backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={loading || query.length < 2}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FF9933] text-white rounded-lg w-8 h-8 flex items-center justify-center disabled:opacity-40"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            )}
          </button>
        </form>
      </div>

      <div className="px-5 -mt-4 pb-6">
        {/* Search Results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 font-medium">
                {results.length} {t('players.resultsFound')}
              </p>
            </div>
            {results.slice(0, 10).map((p, i) => (
              <button
                key={p.id}
                onClick={() => loadPlayer(p.id, p.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-700 transition-colors ${
                  i < Math.min(results.length, 10) - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''
                }`}
              >
                <Avatar name={p.name} color="#6B7280" size="w-10 h-10" textSize="text-sm" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                  {p.country && (
                    <p className="text-xs text-gray-400 truncate">{p.country}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {searchDone && results.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mb-4 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('players.noResults')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('players.tryDifferent')}</p>
          </div>
        )}

        {/* Loading player */}
        {playerLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mb-4 text-center">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-[#FF9933] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{t('players.loadingProfile')}</p>
          </div>
        )}

        {/* IPL Stars Quick Browse */}
        {!searchDone && !playerLoading && (
          <>
            <div className="mb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{t('players.iplStars')}</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {IPL_STARS.map(star => (
                  <button
                    key={star.name}
                    onClick={() => handleStarClick(star)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 active:scale-[0.97] transition-transform shadow-sm"
                  >
                    <Avatar name={star.name} color={star.teamColor} size="w-10 h-10" textSize="text-sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{star.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: star.teamColor + '15', color: star.teamColor }}>
                          {star.team}
                        </span>
                        <span className="text-[10px] text-gray-400">{star.role}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stat categories info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{t('players.statsAvailable')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 3.5l-9 9a2 2 0 000 2.83l2.17 2.17a2 2 0 002.83 0l9-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('players.batting')}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{t('players.battingDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('players.bowling')}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{t('players.bowlingDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('players.tipTitle')}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t('players.tipDesc')}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-6">
          <TricolorBar className="mb-3" />
          <p className="text-center text-[10px] text-gray-400">{t('app.responsibleGaming')}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
