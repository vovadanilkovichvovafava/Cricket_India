import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../shared/api';
import BottomNav from '../../../shared/components/BottomNav';
import TricolorBar from '../../../shared/components/TricolorBar';
import MatchCard from '../../../shared/components/MatchCard';
import { CricketBallIcon, CricketBallDecor } from '../../../shared/components/Icons';

export default function Matches() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const tabs = [
    { key: 'all', label: t('matches.filters.all') },
    { key: 'live', label: 'Live' },
    { key: 'today', label: t('matches.filters.today') },
    { key: 'week', label: t('matches.filters.thisWeek') },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [live, all] = await Promise.all([
          api.getLiveMatches().catch(() => []),
          api.getMatches().catch(() => []),
        ]);
        // Combine: live first, then the rest, deduplicate
        const seen = new Set();
        const combined = [];
        [...live, ...all].forEach(m => {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            combined.push(m);
          }
        });
        setMatches(combined);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredMatches = useMemo(() => {
    let filtered = [...matches];
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (tab === 'live') {
      filtered = filtered.filter(m => m.status === 'live');
    } else if (tab === 'today') {
      filtered = filtered.filter(m => new Date(m.date).toISOString().slice(0, 10) === todayStr);
    } else if (tab === 'week') {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      filtered = filtered.filter(m => {
        const d = new Date(m.date);
        return d >= now && d <= weekEnd;
      });
    }

    return filtered;
  }, [matches, tab]);

  const liveCount = matches.filter(m => m.status === 'live').length;

  // Group by date
  const groupedMatches = useMemo(() => {
    const groups = {};
    filteredMatches.forEach(m => {
      const dateKey = new Date(m.date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const dateKeys = Object.keys(groupedMatches);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header — sticky white with tabs */}
      <div className="bg-white px-5 pt-6 pb-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('matches.title')}</h1>
            <p className="text-gray-500 text-sm">{t('matches.matchCount', { count: matches.length })}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tabItem => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex-1 py-3 text-sm font-medium relative flex items-center justify-center gap-1.5 ${
                tab === tabItem.key ? 'text-[#0B1E4D]' : 'text-gray-400'
              }`}
            >
              {tabItem.label}
              {tabItem.key === 'live' && liveCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center bg-red-500 text-white">
                  {liveCount}
                </span>
              )}
              {tabItem.key === 'all' && matches.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center bg-gray-200 text-gray-600">
                  {matches.length}
                </span>
              )}
              {tab === tabItem.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#FF9933] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        <TricolorBar className="mb-3" />

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="shimmer h-12 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : dateKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <CricketBallDecor className="w-40 h-40 text-gray-400 animate-ball-spin" />
            </div>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 relative z-10">
              <CricketBallIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 relative z-10">{t('matches.noMatches')}</h3>
            <p className="text-gray-500 text-sm relative z-10">
              {tab === 'live' ? 'No live matches right now' : 'Try changing the filters'}
            </p>
          </div>
        ) : (
          <div className="pb-8">
            {dateKeys.map((dateKey, idx) => (
              <div key={dateKey} className={`mb-5 animate-card-in animate-card-in-${Math.min(idx + 1, 6)}`}>
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
                  <h3 className="text-sm font-semibold text-gray-700">{dateKey}</h3>
                  <span className="text-[10px] text-gray-400 ml-auto">{groupedMatches[dateKey].length} matches</span>
                </div>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {groupedMatches[dateKey].map(m => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
