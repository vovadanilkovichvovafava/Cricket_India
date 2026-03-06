import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../shared/api';
import BottomNav from '../../../shared/components/BottomNav';
import MatchCard, { FeaturedMatchCard } from '../../../shared/components/MatchCard';
import TricolorBar from '../../../shared/components/TricolorBar';
import {
  CricketBatIcon, ChatBotIcon, CricketBallDecor,
  ChartIcon, MoneyIcon, TrophyIcon, FireIcon, UsersIcon,
} from '../../../shared/components/Icons';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysUntilIPL = Math.max(0, Math.ceil((new Date('2026-03-28') - new Date()) / 86400000));

  useEffect(() => {
    async function load() {
      try {
        const [live, upcoming] = await Promise.all([
          api.getLiveMatches().catch(() => []),
          api.getMatches().catch(() => []),
        ]);
        // Live first, then upcoming, deduplicate by id
        const seen = new Set();
        const all = [];
        [...live, ...upcoming].forEach(m => {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            all.push(m);
          }
        });
        setMatches(all);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const liveMatches = matches.filter(m => m.status === 'live');
  const featuredMatch = liveMatches[0] || matches[0];
  const otherMatches = matches.filter(m => m !== featuredMatch).slice(0, 4);
  const hasLive = liveMatches.length > 0;

  return (
    <div>
      {/* Header with cricket ball decoration */}
      <div className="bg-gradient-to-br from-[#0B1E4D] via-[#122556] to-[#162D6B] text-white px-5 pt-6 pb-10 rounded-b-3xl relative overflow-hidden">
        {/* Decorative cricket ball — top right */}
        <div className="absolute -top-6 -right-6 text-white animate-ball-spin">
          <CricketBallDecor className="w-32 h-32" />
        </div>
        {/* Decorative cricket ball — bottom left */}
        <div className="absolute -bottom-10 -left-10 text-white/50">
          <CricketBallDecor className="w-24 h-24" />
        </div>

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p className="text-blue-200/70 text-sm">{t('home.subtitle')}</p>
            <h1 className="text-2xl font-bold">{t('home.title')}</h1>
          </div>
          <button onClick={() => navigate('/settings')} className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* IPL Countdown */}
        {daysUntilIPL > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF9933]/20 rounded-xl flex items-center justify-center">
                <CricketBatIcon className="w-6 h-6 text-[#FF9933]" />
              </div>
              <div>
                <p className="text-blue-100 text-xs">{t('home.iplCountdown', { days: daysUntilIPL })}</p>
                <p className="text-2xl font-bold">{daysUntilIPL} <span className="text-sm text-blue-200">days</span></p>
              </div>
            </div>
            <p className="text-blue-200/60 text-xs text-right max-w-[100px]">{t('home.iplDates')}</p>
          </div>
        )}
      </div>

      <div className="px-5 -mt-5 space-y-5">
        {/* AI Assistant Card */}
        <div
          onClick={() => navigate('/ai-chat')}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 rounded-2xl p-5 text-white cursor-pointer active:scale-[0.98] transition-transform shadow-lg animate-card-in animate-card-in-1"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ChatBotIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{t('home.aiChat')}</h3>
                <p className="text-white/80 text-sm">AI-powered cricket predictions</p>
              </div>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>

        {/* Featured Match */}
        {loading ? (
          <div className="animate-card-in animate-card-in-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="shimmer h-32 w-full rounded-xl" />
            </div>
          </div>
        ) : featuredMatch ? (
          <div className="animate-card-in animate-card-in-2">
            <div className="flex items-center gap-2 mb-3">
              <FireIcon className="w-5 h-5 text-[#FF9933]" />
              <h3 className="section-title">{hasLive ? 'Live Now' : 'Next Match'}</h3>
            </div>
            <FeaturedMatchCard match={featuredMatch} />
          </div>
        ) : null}

        {/* Value Bet Finder */}
        <div
          onClick={() => navigate('/matches')}
          className="bg-gradient-to-br from-[#138808] to-emerald-700 rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-transform shadow-md animate-card-in animate-card-in-3"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MoneyIcon className="w-7 h-7 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{t('home.valueBets')}</h3>
          <p className="text-white/80 text-sm mb-4">Find undervalued odds with AI analysis</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white font-bold text-lg">87%</p>
              <p className="text-white/60 text-xs">Accuracy</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white font-bold text-lg">+12%</p>
              <p className="text-white/60 text-xs">Avg Edge</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white font-bold text-lg">50+</p>
              <p className="text-white/60 text-xs">Daily</p>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <div className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1">
              Find Value Bets
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card animate-card-in animate-card-in-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Your Stats</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-8 h-8 mx-auto mb-1 text-[#0B1E4D] flex items-center justify-center">
                <ChartIcon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Predictions</p>
            </div>
            <div>
              <div className="w-8 h-8 mx-auto mb-1 text-[#138808] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-[#138808]">0</p>
              <p className="text-xs text-gray-500">Wins</p>
            </div>
            <div>
              <div className="w-8 h-8 mx-auto mb-1 text-[#138808] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-[#138808]">0%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] rounded-2xl p-4 flex items-center gap-4 animate-card-in animate-card-in-5">
          <div className="w-10 h-10 bg-[#FF9933]/20 rounded-xl flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5 text-[#FF9933]" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">12,500+ predictions made</p>
            <p className="text-blue-200/60 text-[11px]">Join the community of cricket analysts</p>
          </div>
          <div className="flex -space-x-2">
            {['#FCCA06', '#004BA0', '#EC1C24', '#3A225D'].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0B1E4D]" style={{ background: c }} />
            ))}
          </div>
        </div>

        {/* Quick Tools */}
        <div className="animate-card-in animate-card-in-6">
          <h3 className="section-title mb-3">Quick Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            <div onClick={() => navigate('/matches')} className="card text-center cursor-pointer hover:shadow-md transition-shadow py-5">
              <div className="w-10 h-10 mx-auto mb-2 bg-[#138808]/10 rounded-xl flex items-center justify-center">
                <CricketBatIcon className="w-5 h-5 text-[#138808]" />
              </div>
              <p className="text-xs font-medium text-gray-700">{t('home.matches')}</p>
            </div>
            <div onClick={() => navigate('/ai-chat')} className="card text-center cursor-pointer hover:shadow-md transition-shadow py-5">
              <div className="w-10 h-10 mx-auto mb-2 bg-purple-50 rounded-xl flex items-center justify-center">
                <ChatBotIcon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">AI Analysis</p>
            </div>
            <div onClick={() => navigate('/settings')} className="card text-center cursor-pointer hover:shadow-md transition-shadow py-5">
              <div className="w-10 h-10 mx-auto mb-2 bg-[#0B1E4D]/10 rounded-xl flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-[#0B1E4D]" />
              </div>
              <p className="text-xs font-medium text-gray-700">{t('home.standings')}</p>
            </div>
          </div>
        </div>

        <TricolorBar />

        {/* Upcoming Matches */}
        {loading ? (
          <div className="animate-card-in animate-card-in-6">
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="shimmer h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : otherMatches.length > 0 ? (
          <div className="animate-card-in animate-card-in-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CricketBatIcon className="w-5 h-5 text-[#0B1E4D]" />
                <h3 className="section-title">Upcoming Matches</h3>
              </div>
              <button onClick={() => navigate('/matches')} className="text-[#FF9933] text-sm font-medium flex items-center gap-1">
                {t('home.seeAll')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {otherMatches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ) : !featuredMatch ? (
          <div className="animate-card-in animate-card-in-6 text-center py-8">
            <p className="text-gray-400 text-sm">No matches available right now</p>
            <p className="text-gray-300 text-xs mt-1">Check back later for live and upcoming matches</p>
          </div>
        ) : null}

        {/* Footer */}
        <div className="pb-4 pt-2">
          <TricolorBar className="mb-3" />
          <div className="text-center">
            <span className="text-sm font-bold text-gray-400">{t('app.name')}</span>
            <p className="text-[10px] text-gray-400 mt-0.5">{t('app.disclaimer')}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
