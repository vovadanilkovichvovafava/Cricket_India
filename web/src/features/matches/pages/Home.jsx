import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IPL_TEAMS } from '../../../shared/utils/teamColors';

const MOCK_MATCHES = [
  { id: 1, home: 'CSK', away: 'MI', date: '2026-03-28T19:30:00+05:30', venue: 'MA Chidambaram Stadium', status: 'upcoming', odds: { home: 1.85, away: 2.05 } },
  { id: 2, home: 'RCB', away: 'KKR', date: '2026-03-29T15:30:00+05:30', venue: 'M Chinnaswamy Stadium', status: 'upcoming', odds: { home: 2.10, away: 1.80 } },
  { id: 3, home: 'DC', away: 'RR', date: '2026-03-29T19:30:00+05:30', venue: 'Arun Jaitley Stadium', status: 'upcoming', odds: { home: 1.95, away: 1.95 } },
  { id: 4, home: 'SRH', away: 'PBKS', date: '2026-03-30T19:30:00+05:30', venue: 'Rajiv Gandhi Stadium', status: 'upcoming', odds: { home: 1.75, away: 2.20 } },
  { id: 5, home: 'GT', away: 'LSG', date: '2026-03-31T19:30:00+05:30', venue: 'Narendra Modi Stadium', status: 'upcoming', odds: { home: 1.90, away: 2.00 } },
];

function TeamBadge({ code }) {
  const team = IPL_TEAMS[code] || { short: code, bg: '#6B7280', text: '#fff' };
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
        style={{ background: team.bg, color: team.text }}>
        {team.short}
      </div>
      <span className="text-[11px] text-gray-600 font-medium text-center leading-tight max-w-[80px]">
        {team.name || code}
      </span>
    </div>
  );
}

function MatchCard({ match }) {
  const navigate = useNavigate();
  const dt = new Date(match.date);
  const time = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const day = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div onClick={() => navigate(`/match/${match.id}`)}
      className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">IPL 2026</span>
        <span className="text-[11px] text-gray-400">{day} • {time} IST</span>
      </div>
      <div className="flex items-center justify-between">
        <TeamBadge code={match.home} />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-gray-300">VS</span>
          <div className="flex gap-2 text-[10px]">
            <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">{match.odds.home}</span>
            <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-medium">{match.odds.away}</span>
          </div>
        </div>
        <TeamBadge code={match.away} />
      </div>
      <div className="mt-3 pt-2 border-t border-gray-50 flex items-center gap-1.5">
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <span className="text-[11px] text-gray-400">{match.venue}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [matches] = useState(MOCK_MATCHES);
  const daysUntilIPL = Math.max(0, Math.ceil((new Date('2026-03-28') - new Date()) / 86400000));

  return (
    <div className="min-h-dvh bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Cricket Analyzer</h1>
            <p className="text-primary-200 text-sm">IPL 2026 • AI Predictions</p>
          </div>
          <button onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* IPL Countdown */}
        {daysUntilIPL > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-cricket-six/20 rounded-full flex items-center justify-center text-lg">🏏</div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">IPL 2026 starts in {daysUntilIPL} days</p>
              <p className="text-primary-200 text-xs">March 28 — May 31 • 84 matches</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🤖', label: 'AI Chat', path: '/ai-chat' },
            { icon: '📊', label: 'Matches', path: '/matches' },
            { icon: '💰', label: 'Value Bets', path: '/matches' },
            { icon: '🏆', label: 'Standings', path: '/matches' },
          ].map(btn => (
            <button key={btn.label} onClick={() => navigate(btn.path)}
              className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <span className="text-xl">{btn.icon}</span>
              <span className="text-[10px] font-medium text-gray-600">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Matches */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Upcoming Matches</h2>
          <button onClick={() => navigate('/matches')} className="text-xs text-primary-600 font-medium">See all</button>
        </div>
        <div className="space-y-3">
          {matches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      </div>

      {/* Bottom padding for nav */}
      <div className="h-24" />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-safe flex items-center justify-around safe-bottom"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {[
          { icon: '🏠', label: 'Home', path: '/', active: true },
          { icon: '🏏', label: 'Matches', path: '/matches' },
          { icon: '🤖', label: 'AI Chat', path: '/ai-chat' },
          { icon: '⚙️', label: 'Settings', path: '/settings' },
        ].map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors
              ${item.active ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
