import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IPL_TEAMS } from '../../../shared/utils/teamColors';
import api from '../../../shared/api';
import BottomNav from '../../../shared/components/BottomNav';
import MatchCard from '../../../shared/components/MatchCard';
import TricolorBar from '../../../shared/components/TricolorBar';
import BookmakerBanner from '../../../shared/components/BookmakerBanner';
import { CricketBatIcon, TrophyIcon, FireIcon } from '../../../shared/components/Icons';

const TEAM_CODES = Object.keys(IPL_TEAMS);

// IPL_FACTS moved inside QuickFacts component to use i18n translations

function getCountdown() {
  const start = new Date('2026-03-28T19:30:00+05:30');
  const now = new Date();
  const diff = start - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { days, hours, mins };
}

// ──────────────────────────────────────────────
// IPL Header — Hero section
// ──────────────────────────────────────────────
function IPLHeader() {
  const { t } = useTranslation();
  const countdown = getCountdown();

  return (
    <div className="bg-gradient-to-br from-[#0A0E27] via-[#1B1464] to-[#0A0E27] text-white px-5 pt-6 pb-8 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#FCCA06]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#004BA0]/15 rounded-full blur-2xl" />

      {/* Back button */}
      <div className="flex items-center gap-3 mb-5 relative z-10">
        <button onClick={() => history.back()}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-[#FCCA06]/20 px-3 py-1 rounded-full mb-3">
          <div className="w-2 h-2 bg-[#FCCA06] rounded-full" />
          <span className="text-[#FCCA06] text-xs font-bold uppercase tracking-wider">{t('ipl.season')}</span>
        </div>
        <h1 className="text-4xl font-black mb-1">
          <span className="text-[#FCCA06]">IPL</span> 2026
        </h1>
        <p className="text-blue-200/60 text-sm">{t('ipl.dates')}</p>
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 mb-5 relative z-10">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#FCCA06]">84</p>
          <p className="text-[10px] text-blue-200/50 uppercase">{t('ipl.matchLabel')}</p>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <p className="text-2xl font-bold">10</p>
          <p className="text-[10px] text-blue-200/50 uppercase">{t('ipl.teamLabel')}</p>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <p className="text-2xl font-bold">T20</p>
          <p className="text-[10px] text-blue-200/50 uppercase">{t('ipl.formatLabel')}</p>
        </div>
      </div>

      {/* Countdown */}
      {countdown && (
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 relative z-10">
          <p className="text-[10px] text-blue-200/50 uppercase tracking-wider text-center mb-2">{t('ipl.seasonStartsIn')}</p>
          <div className="flex justify-center gap-4">
            {[
              { val: countdown.days, label: t('common.days') },
              { val: countdown.hours, label: t('common.hours') },
              { val: countdown.mins, label: t('common.mins') },
            ].map(({ val, label }) => (
              <div key={label} className="bg-white/10 rounded-xl px-4 py-2 text-center min-w-[60px]">
                <p className="text-2xl font-black text-[#FCCA06]">{val}</p>
                <p className="text-[10px] text-blue-200/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Teams Grid
// ──────────────────────────────────────────────
function TeamsGrid({ selectedTeam, onSelectTeam }) {
  const { t } = useTranslation();
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <TrophyIcon className="w-5 h-5 text-[#FCCA06]" />
        <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('ipl.teams')}</h2>
        {selectedTeam && (
          <button onClick={() => onSelectTeam(null)}
            className="ml-auto text-xs text-[#FF9933] font-medium">
            {t('common.showAll')}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {TEAM_CODES.map(code => {
          const team = IPL_TEAMS[code];
          const isSelected = selectedTeam === code;
          return (
            <button
              key={code}
              onClick={() => onSelectTeam(isSelected ? null : code)}
              className={`flex items-center gap-2.5 p-3 rounded-xl transition-all active:scale-[0.97] ${
                isSelected
                  ? 'ring-2 ring-offset-1 shadow-md'
                  : 'bg-white dark:bg-gray-800 shadow-sm'
              }`}
              style={isSelected ? { background: team.bg + '15', ringColor: team.bg } : undefined}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] shrink-0"
                style={{ background: team.bg, color: team.text }}
              >
                {code}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{team.name}</p>
                <p className="text-[10px] text-gray-400">{team.city}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Points Table
// ──────────────────────────────────────────────
function PointsTable({ standings, loading }) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="px-5 py-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{t('ipl.pointsTable')}</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="shimmer h-8 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="px-5 py-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{t('ipl.pointsTable')}</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
          <CricketBatIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">{t('ipl.seasonStartsDate')}</p>
          <p className="text-gray-300 text-xs">{t('ipl.pointsTableAppear')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{t('ipl.pointsTable')}</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_repeat(5,_32px)] gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-[10px] text-gray-400 font-semibold uppercase">
          <span className="w-5">#</span>
          <span>Team</span>
          <span className="text-center">{t('ipl.played')}</span>
          <span className="text-center">{t('ipl.won')}</span>
          <span className="text-center">{t('ipl.lost')}</span>
          <span className="text-center">{t('ipl.nrr')}</span>
          <span className="text-center">{t('ipl.pts')}</span>
        </div>
        {/* Rows */}
        {standings.map((row, idx) => {
          const teamData = IPL_TEAMS[row.team?.code] || {};
          const isPlayoff = idx < 4;
          return (
            <div key={idx}
              className={`grid grid-cols-[auto_1fr_repeat(5,_32px)] gap-1 px-3 py-2.5 items-center border-t border-gray-50 dark:border-gray-700 ${isPlayoff ? 'bg-green-50/30 dark:bg-green-900/20' : ''}`}>
              <span className="w-5 text-xs text-gray-400 font-medium">{idx + 1}</span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                  style={{ background: teamData.bg || '#6B7280', color: teamData.text || '#fff' }}>
                  {row.team?.code || '?'}
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{row.team?.short_name || row.team?.code}</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 text-center">{row.played}</span>
              <span className="text-xs text-green-600 text-center font-medium">{row.won}</span>
              <span className="text-xs text-red-400 text-center">{row.lost}</span>
              <span className="text-[10px] text-gray-500 text-center">{row.net_run_rate > 0 ? '+' : ''}{row.net_run_rate?.toFixed(2)}</span>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 text-center">{row.points}</span>
            </div>
          );
        })}
        {/* Legend */}
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-200 rounded-full" />
          <span className="text-[10px] text-gray-400">{t('ipl.playoffsNote')}</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Quick Facts
// ──────────────────────────────────────────────
function QuickFacts() {
  const { t } = useTranslation();
  const facts = [
    { label: t('ipl.defendingChampion'), value: t('ipl.defendingValue'), color: '#3A225D' },
    { label: t('ipl.mostTitles'), value: t('ipl.mostTitlesValue'), color: '#FCCA06' },
    { label: t('ipl.formatFact'), value: t('ipl.formatValue'), color: '#FF9933' },
    { label: t('ipl.prizePool'), value: t('ipl.prizePoolValue'), color: '#138808' },
  ];
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <FireIcon className="w-5 h-5 text-[#FF9933]" />
        <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('ipl.quickFacts')}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {facts.map(fact => (
          <div key={fact.label} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{fact.label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{fact.value}</p>
            <div className="w-8 h-1 rounded-full mt-2" style={{ background: fact.color }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
export default function IPLEvent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [seriesId, setSeriesId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Find IPL series and load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Try to find IPL series
        const series = await api.getSeries({ search: 'IPL' }).catch(() => []);
        const ipl = series.find(s => s.name?.toLowerCase().includes('ipl')) || series[0];

        if (ipl) {
          setSeriesId(ipl.id);
          const [seriesMatches, standingsData] = await Promise.all([
            api.getSeriesMatches(ipl.id).catch(() => []),
            api.getStandings(ipl.id).catch(() => null),
          ]);
          setMatches(seriesMatches);
          if (standingsData?.standings) setStandings(standingsData.standings);
        } else {
          // Fallback: try loading standings without series_id
          const standingsData = await api.getStandings().catch(() => null);
          if (standingsData?.standings) setStandings(standingsData.standings);
        }
      } catch {
        // Silent fail — page still shows static content
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter matches by selected team
  const filteredMatches = useMemo(() => {
    if (!selectedTeam) return matches;
    return matches.filter(m => m.home === selectedTeam || m.away === selectedTeam);
  }, [matches, selectedTeam]);

  // Group by date
  const groupedMatches = useMemo(() => {
    const groups = {};
    filteredMatches.forEach(m => {
      const dateKey = new Date(m.date).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const dateKeys = Object.keys(groupedMatches);

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-gray-900 animate-fade-in">
      <IPLHeader />

      <div className="-mt-3">
        <TeamsGrid selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam} />

        <BookmakerBanner variant="inline" />

        <PointsTable standings={standings} loading={loading} />

        <QuickFacts />

        <BookmakerBanner variant="inline" />

        {/* Schedule */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CricketBatIcon className="w-5 h-5 text-[#0B1E4D]" />
              <h2 className="font-bold text-gray-900 dark:text-gray-100">
                {selectedTeam ? t('ipl.teamMatches', { team: selectedTeam }) : t('common.schedule')}
              </h2>
            </div>
            {matches.length > 0 && (
              <span className="text-xs text-gray-400">{filteredMatches.length} {t('common.matches')}</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="shimmer w-6 h-6 rounded-full" />
                      <div className="shimmer h-3 w-14 rounded" />
                    </div>
                    <div className="shimmer h-4 w-8 rounded" />
                    <div className="flex items-center gap-2">
                      <div className="shimmer h-3 w-14 rounded" />
                      <div className="shimmer w-6 h-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : dateKeys.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
              <p className="text-gray-400 text-sm">
                {selectedTeam ? t('ipl.noTeamMatches', { team: selectedTeam }) : t('ipl.scheduleAppear')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dateKeys.map((dateKey, idx) => (
                <div key={dateKey} className={`animate-card-in animate-card-in-${Math.min(idx + 1, 6)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FCCA06]" />
                    <h3 className="text-xs font-semibold text-gray-500">{dateKey}</h3>
                    <span className="text-[10px] text-gray-300 ml-auto">{groupedMatches[dateKey].length}</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                    {groupedMatches[dateKey].map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TricolorBar className="mx-5" />

        {/* Footer */}
        <div className="px-5 pb-4 pt-2 text-center">
          <span className="text-sm font-bold text-gray-400">{t('app.name')}</span>
          <p className="text-[10px] text-gray-400 mt-0.5">{t('app.disclaimer')}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
