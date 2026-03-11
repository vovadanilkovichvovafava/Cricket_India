import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from '../../../shared/components/BottomNav';
import TricolorBar from '../../../shared/components/TricolorBar';
import { TrophyIcon, GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon, FireIcon, CrownIcon } from '../../../shared/components/Icons';

// Mock leaderboard data
const WEEKLY_LEADERS = [
  { rank: 1, name: 'Rahul M.', predictions: 24, correct: 20, streak: 7, avatar: '#FF9933' },
  { rank: 2, name: 'Priya S.', predictions: 18, correct: 15, streak: 5, avatar: '#E91E63' },
  { rank: 3, name: 'Vikram P.', predictions: 22, correct: 17, streak: 4, avatar: '#2196F3' },
  { rank: 4, name: 'Ananya D.', predictions: 16, correct: 12, streak: 3, avatar: '#9C27B0' },
  { rank: 5, name: 'Deepak T.', predictions: 20, correct: 14, streak: 6, avatar: '#4CAF50' },
  { rank: 6, name: 'Sneha R.', predictions: 15, correct: 11, streak: 2, avatar: '#FF5722' },
  { rank: 7, name: 'Amit K.', predictions: 19, correct: 13, streak: 4, avatar: '#00BCD4' },
  { rank: 8, name: 'Ritu G.', predictions: 14, correct: 10, streak: 1, avatar: '#795548' },
  { rank: 9, name: 'Arjun B.', predictions: 17, correct: 11, streak: 3, avatar: '#607D8B' },
  { rank: 10, name: 'Kavita L.', predictions: 12, correct: 8, streak: 2, avatar: '#F44336' },
];

const MONTHLY_LEADERS = [
  { rank: 1, name: 'Vikram P.', predictions: 85, correct: 68, streak: 12, avatar: '#2196F3' },
  { rank: 2, name: 'Rahul M.', predictions: 92, correct: 71, streak: 8, avatar: '#FF9933' },
  { rank: 3, name: 'Deepak T.', predictions: 78, correct: 59, streak: 6, avatar: '#4CAF50' },
  { rank: 4, name: 'Priya S.', predictions: 65, correct: 50, streak: 5, avatar: '#E91E63' },
  { rank: 5, name: 'Ananya D.', predictions: 60, correct: 44, streak: 4, avatar: '#9C27B0' },
  { rank: 6, name: 'Amit K.', predictions: 72, correct: 50, streak: 3, avatar: '#00BCD4' },
  { rank: 7, name: 'Ritu G.', predictions: 55, correct: 38, streak: 5, avatar: '#795548' },
  { rank: 8, name: 'Sneha R.', predictions: 48, correct: 33, streak: 2, avatar: '#FF5722' },
  { rank: 9, name: 'Kavita L.', predictions: 40, correct: 28, streak: 4, avatar: '#F44336' },
  { rank: 10, name: 'Arjun B.', predictions: 52, correct: 34, streak: 1, avatar: '#607D8B' },
];

function RankBadge({ rank }) {
  if (rank === 1) return <GoldMedalIcon className="w-6 h-6" />;
  if (rank === 2) return <SilverMedalIcon className="w-6 h-6" />;
  if (rank === 3) return <BronzeMedalIcon className="w-6 h-6" />;
  return (
    <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">
      {rank}
    </span>
  );
}

function LeaderCard({ leader, isTop3 }) {
  const accuracy = leader.predictions > 0 ? Math.round((leader.correct / leader.predictions) * 100) : 0;
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isTop3 ? 'bg-amber-50/50' : ''}`}>
      <RankBadge rank={leader.rank} />
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0"
        style={{ background: leader.avatar }}
      >
        {leader.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{leader.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400">{leader.predictions} {t('leaderboard.picks')}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">{accuracy}%</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-emerald-600">{leader.correct}/{leader.predictions}</p>
        <div className="flex items-center gap-0.5 justify-end mt-0.5">
          <FireIcon className="w-4 h-4" />
          <span className="text-[10px] text-amber-600 font-semibold">{leader.streak}</span>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [period, setPeriod] = useState('weekly');

  const leaders = period === 'weekly' ? WEEKLY_LEADERS : MONTHLY_LEADERS;
  const topThree = leaders.slice(0, 3);

  return (
    <div className="min-h-dvh bg-[#F0F2F5] animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B1E4D] via-[#122556] to-[#162D6B] text-white px-5 pt-6 pb-8 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#FF9933]/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#138808]/10 rounded-full" />

        <div className="flex items-center gap-3 mb-5 relative z-10">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t('leaderboard.title')}</h1>
            <p className="text-blue-200/70 text-xs">{t('leaderboard.subtitle')}</p>
          </div>
          <div className="w-10 h-10 bg-[#FF9933]/20 rounded-xl flex items-center justify-center">
            <TrophyIcon className="w-6 h-6 text-[#FF9933]" />
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-3 relative z-10 mt-4">
          {/* 2nd place */}
          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg ring-2 ring-white/20"
              style={{ background: topThree[1]?.avatar }}
            >
              {topThree[1]?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <SilverMedalIcon className="w-6 h-6 mt-1" />
            <p className="text-xs text-white/80 font-medium mt-0.5">{topThree[1]?.name.split(' ')[0]}</p>
            <p className="text-[10px] text-emerald-300 font-bold">
              {topThree[1]?.predictions > 0 ? Math.round((topThree[1]?.correct / topThree[1]?.predictions) * 100) : 0}%
            </p>
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative">
              <div
                className="w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center text-white text-xl font-bold shadow-xl ring-3 ring-[#FF9933]/40"
                style={{ background: topThree[0]?.avatar }}
              >
                {topThree[0]?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="absolute -top-3 -right-1"><CrownIcon className="w-5 h-5 text-yellow-400" /></div>
            </div>
            <GoldMedalIcon className="w-6 h-6 mt-1" />
            <p className="text-xs text-white font-bold mt-0.5">{topThree[0]?.name.split(' ')[0]}</p>
            <p className="text-[10px] text-emerald-300 font-bold">
              {topThree[0]?.predictions > 0 ? Math.round((topThree[0]?.correct / topThree[0]?.predictions) * 100) : 0}%
            </p>
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg ring-2 ring-white/20"
              style={{ background: topThree[2]?.avatar }}
            >
              {topThree[2]?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <BronzeMedalIcon className="w-6 h-6 mt-1" />
            <p className="text-xs text-white/80 font-medium mt-0.5">{topThree[2]?.name.split(' ')[0]}</p>
            <p className="text-[10px] text-emerald-300 font-bold">
              {topThree[2]?.predictions > 0 ? Math.round((topThree[2]?.correct / topThree[2]?.predictions) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {/* Period Toggle */}
        <div className="bg-white rounded-2xl shadow-sm p-1 flex">
          {['weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                period === p
                  ? 'bg-[#0B1E4D] text-white shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {t(`leaderboard.${p}`)}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-[#0B1E4D]">
              {leaders.reduce((acc, l) => acc + l.predictions, 0)}
            </p>
            <p className="text-[10px] text-gray-400">{t('leaderboard.totalPicks')}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-emerald-600">
              {Math.round(leaders.reduce((acc, l) => acc + l.correct, 0) / leaders.reduce((acc, l) => acc + l.predictions, 0) * 100)}%
            </p>
            <p className="text-[10px] text-gray-400">{t('leaderboard.avgAccuracy')}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-amber-500">
              {Math.max(...leaders.map(l => l.streak))}
            </p>
            <p className="text-[10px] text-gray-400">{t('leaderboard.bestStreak')}</p>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">{t('leaderboard.rankings')}</h3>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span>{t('leaderboard.correct')}</span>
              <span className="flex items-center gap-0.5"><FireIcon className="w-4 h-4" /> {t('leaderboard.streak')}</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {leaders.map(leader => (
              <LeaderCard key={leader.rank} leader={leader} isTop3={leader.rank <= 3} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#FF9933] to-[#FF8800] rounded-2xl p-4 text-center shadow-md">
          <p className="text-white font-bold text-sm mb-1">{t('leaderboard.ctaTitle')}</p>
          <p className="text-white/80 text-xs mb-3">{t('leaderboard.ctaDesc')}</p>
          <button
            onClick={() => navigate('/ai-chat')}
            className="bg-white text-[#FF9933] font-bold px-6 py-2.5 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            {t('leaderboard.ctaButton')} →
          </button>
        </div>

        <TricolorBar className="mt-2" />
        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}
