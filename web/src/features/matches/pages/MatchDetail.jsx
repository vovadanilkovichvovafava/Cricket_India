import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IPL_TEAMS } from '../../../shared/utils/teamColors';
import api from '../../../shared/api';
import BottomNav from '../../../shared/components/BottomNav';
import BookmakerBanner from '../../../shared/components/BookmakerBanner';
import usePushNotifications from '../../../shared/hooks/usePushNotifications';
import {
  CalendarIcon, ClockIcon, StadiumIcon, LocationIcon, StatusIcon,
  RobotIcon, LiveDotIcon, ThermometerIcon, WaveIcon, CloudSunIcon,
  SunIcon, DesertIcon, WindIcon, DropletIcon, BarChartIcon,
  ShieldCheckIcon, FireIcon, LightningIcon, TargetIcon, WarningIcon,
  GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon, TrophyIcon,
  CricketBatIcon, RefreshIcon, LockIcon, SparkleIcon,
} from '../../../shared/components/Icons';
import TricolorBar from '../../../shared/components/TricolorBar';
import { usePremium } from '../../../shared/context/PremiumContext';

// Helper: get team display info from match data + IPL fallback
function getTeamInfo(match, side) {
  const code = side === 'home' ? match.home : match.away;
  const ipl = IPL_TEAMS[code] || {};
  return {
    short: code,
    name: (side === 'home' ? match.homeName : match.awayName) || ipl.name || code,
    bg: (side === 'home' ? match.homeColor : match.awayColor) || ipl.bg || '#6B7280',
    text: ipl.text || '#fff',
    img: (side === 'home' ? match.homeImg : match.awayImg) || null,
  };
}

// No mock data — all match data comes from CricAPI

const TAB_KEYS = [
  { key: 'overview', labelKey: 'matchDetail.tabs.overview' },
  { key: 'scorecard', label: 'Scorecard' },
  { key: 'stars', label: <><svg className="w-3 h-3 inline-block mr-0.5 -mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> Stars</> },
  { key: 'live', label: <><LiveDotIcon className="w-3 h-3 inline-block mr-0.5 -mt-0.5" /> Live</> },
  { key: 'squad', label: 'Squad' },
  { key: 'venue', labelKey: 'matchDetail.tabs.venue' },
  { key: 'h2h', labelKey: 'matchDetail.tabs.h2h' },
  { key: 'odds', labelKey: 'matchDetail.tabs.odds' },
  { key: 'prediction', labelKey: 'matchDetail.tabs.aiPick' },
  { key: 'chat', label: <><svg className="w-3 h-3 inline-block mr-0.5 -mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" /><path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" /></svg> Chat</> },
];

function TeamBadgeLarge({ code, color, img, name }) {
  const ipl = IPL_TEAMS[code];
  const bg = color || ipl?.bg || '#6B7280';
  const text = ipl?.text || '#fff';
  const displayName = name || ipl?.name || code;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="rounded-full p-[3px]" style={{ background: `${bg}40` }}>
        {img ? (
          <img src={img} alt={code} className="w-16 h-16 rounded-full object-cover shadow-lg" />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
            style={{ background: bg, color: text }}>
            {code}
          </div>
        )}
      </div>
      <span className="text-xs text-white/80 font-medium text-center leading-tight max-w-[90px]">
        {displayName}
      </span>
    </div>
  );
}

function LoadingSpinner() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-[#F0F2F5] dark:bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="mt-4 text-gray-500 text-sm">{t('matchDetail.loading')}</p>
    </div>
  );
}

function OverviewTab({ match }) {
  const { t } = useTranslation();
  const dt = new Date(match.date);
  const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="space-y-4">
      {/* Match Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('matchDetail.overview.matchInformation')}</h3>
        <div className="space-y-2.5">
          {[
            { Icon: CalendarIcon, label: t('matchDetail.overview.date'), value: dateStr },
            { Icon: ClockIcon, label: t('matchDetail.overview.time'), value: `${timeStr} IST` },
            { Icon: StadiumIcon, label: t('matchDetail.overview.venue'), value: match.venue },
            { Icon: LocationIcon, label: t('matchDetail.overview.city'), value: match.city || 'India' },
            { Icon: StatusIcon, label: t('matchDetail.overview.status'), value: match.status?.charAt(0).toUpperCase() + match.status?.slice(1) },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <item.Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1 flex justify-between">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right max-w-[200px]">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Odds */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('matchDetail.overview.matchOdds')}</h3>
        {(() => {
          const homeTeam = getTeamInfo(match, 'home');
          const awayTeam = getTeamInfo(match, 'away');
          const odds = match.odds || {};
          return (
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl p-3 text-center border-2"
                style={{ borderColor: `${homeTeam.bg}25`, background: `${homeTeam.bg}08` }}>
                <p className="text-[10px] text-gray-500 mb-1">{homeTeam.short}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{odds.home ?? '—'}</p>
                {odds.home && <p className="text-[10px] text-gray-400">{Math.round((1 / odds.home) * 100)}%</p>}
              </div>
              <div className="flex-1 rounded-xl p-3 text-center border-2"
                style={{ borderColor: `${awayTeam.bg}25`, background: `${awayTeam.bg}08` }}>
                <p className="text-[10px] text-gray-500 mb-1">{awayTeam.short}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{odds.away ?? '—'}</p>
                {odds.away && <p className="text-[10px] text-gray-400">{Math.round((1 / odds.away) * 100)}%</p>}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function LineupsTab({ match }) {
  const { t } = useTranslation();
  if (!match.lineups) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">{t('matchDetail.lineups.notAnnounced')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[
        { key: 'home', code: match.home, players: match.lineups.home },
        { key: 'away', code: match.away, players: match.lineups.away },
      ].map(side => {
        const team = getTeamInfo(match, side.key);
        return (
          <div key={side.key} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: team.bg }}>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold"
                style={{ color: team.text }}>
                {team.short}
              </div>
              <h3 className="text-sm font-semibold" style={{ color: team.text }}>{team.name}</h3>
            </div>
            <div className="p-4">
              {side.players.map((player, i) => (
                <div key={i} className={`flex items-center gap-3 py-2 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-500">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{player}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Icon lookup for weather/pitch icons
const WEATHER_ICON_MAP = {
  thermometer: ThermometerIcon,
  wave: WaveIcon,
  cloudsun: CloudSunIcon,
  sun: SunIcon,
  desert: DesertIcon,
  wind: WindIcon,
};

// City-based weather/pitch intelligence
const CITY_PITCH_DATA = {
  chennai: { type: 'Spin-friendly', surface: 'Red soil', dew: 'Heavy', temp: '32°C', humidity: '75%', wind: '12 km/h', icon: 'thermometer' },
  mumbai: { type: 'Batting-friendly', surface: 'Black soil', dew: 'Moderate', temp: '30°C', humidity: '80%', wind: '15 km/h', icon: 'wave' },
  bengaluru: { type: 'Balanced', surface: 'Red soil', dew: 'Light', temp: '27°C', humidity: '55%', wind: '10 km/h', icon: 'cloudsun' },
  kolkata: { type: 'Spin-friendly', surface: 'Black soil', dew: 'Heavy', temp: '33°C', humidity: '78%', wind: '8 km/h', icon: 'thermometer' },
  delhi: { type: 'Batting-friendly', surface: 'Clay', dew: 'Moderate', temp: '35°C', humidity: '45%', wind: '14 km/h', icon: 'sun' },
  hyderabad: { type: 'Batting-friendly', surface: 'Red soil', dew: 'Moderate', temp: '34°C', humidity: '50%', wind: '11 km/h', icon: 'sun' },
  jaipur: { type: 'Balanced', surface: 'Clay', dew: 'Light', temp: '36°C', humidity: '35%', wind: '16 km/h', icon: 'desert' },
  mohali: { type: 'Pace-friendly', surface: 'Clay', dew: 'Moderate', temp: '28°C', humidity: '60%', wind: '18 km/h', icon: 'wind' },
  lucknow: { type: 'Balanced', surface: 'Clay', dew: 'Moderate', temp: '33°C', humidity: '55%', wind: '10 km/h', icon: 'cloudsun' },
  ahmedabad: { type: 'Spin-friendly', surface: 'Red soil', dew: 'Light', temp: '36°C', humidity: '40%', wind: '12 km/h', icon: 'sun' },
};

function getPitchData(city) {
  const key = (city || '').toLowerCase().split(' ')[0];
  return CITY_PITCH_DATA[key] || { type: 'Balanced', surface: 'Clay', dew: 'Moderate', temp: '30°C', humidity: '60%', wind: '12 km/h', icon: 'cloudsun' };
}

function VenueTab({ match }) {
  const { t } = useTranslation();
  const vs = match.venueStats;
  const pitchData = getPitchData(match.city);
  const weather = match.weatherForecast;

  if (!vs) {
    return (
      <div className="space-y-4">
        {/* Weather card even without venue stats */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-4 shadow-sm text-white">
          <div className="flex items-center gap-2 mb-3">
            {(() => { const WeatherIcon = WEATHER_ICON_MAP[pitchData.icon] || CloudSunIcon; return <WeatherIcon className="w-6 h-6" />; })()}
            <div>
              <h3 className="text-sm font-bold">{t('matchDetail.weather.title')}</h3>
              <p className="text-[11px] text-white/70">{match.city || match.venue || 'Match Venue'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-white/70">{t('matchDetail.weather.temp')}</p>
              <p className="text-lg font-bold">{weather?.temp || pitchData.temp}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-white/70">{t('matchDetail.weather.humidity')}</p>
              <p className="text-lg font-bold">{weather?.humidity || pitchData.humidity}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-white/70">{t('matchDetail.weather.wind')}</p>
              <p className="text-lg font-bold">{weather?.wind || pitchData.wind}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
          <p className="text-gray-400 text-sm">{t('matchDetail.venueStats.notAvailable')}</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: t('matchDetail.venueStats.matchesPlayed'), value: vs.matches },
    { label: t('matchDetail.venueStats.avg1stInnings'), value: vs.avgFirst },
    { label: t('matchDetail.venueStats.avg2ndInnings'), value: vs.avgSecond },
    { label: t('matchDetail.venueStats.tossWinBat'), value: `${vs.tossWinBat}%` },
    { label: t('matchDetail.venueStats.chaseWin'), value: `${vs.chaseWin}%` },
  ];

  return (
    <div className="space-y-4">
      {/* Weather Forecast */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-4 shadow-sm text-white">
        <div className="flex items-center gap-2 mb-3">
          {(() => { const WeatherIcon = WEATHER_ICON_MAP[pitchData.icon] || CloudSunIcon; return <WeatherIcon className="w-6 h-6" />; })()}
          <div>
            <h3 className="text-sm font-bold">{t('matchDetail.weather.title')}</h3>
            <p className="text-[11px] text-white/70">{match.city || 'Match Venue'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/70">{t('matchDetail.weather.temp')}</p>
            <p className="text-lg font-bold">{weather?.temp || pitchData.temp}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/70">{t('matchDetail.weather.humidity')}</p>
            <p className="text-lg font-bold">{weather?.humidity || pitchData.humidity}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/70">{t('matchDetail.weather.wind')}</p>
            <p className="text-lg font-bold">{weather?.wind || pitchData.wind}</p>
          </div>
        </div>
        {/* Dew factor */}
        <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <DropletIcon className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-[11px] font-medium">{t('matchDetail.weather.dewFactor')}: {pitchData.dew}</p>
            <p className="text-[10px] text-white/60">
              {pitchData.dew === 'Heavy' ? t('matchDetail.weather.dewHeavy') :
               pitchData.dew === 'Moderate' ? t('matchDetail.weather.dewModerate') :
               t('matchDetail.weather.dewLight')}
            </p>
          </div>
        </div>
      </div>

      {/* Pitch Report */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <StadiumIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 dark:text-gray-100">{t('matchDetail.venueStats.pitchReport')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-0.5">{t('matchDetail.pitch.type')}</p>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{pitchData.type}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-0.5">{t('matchDetail.pitch.surface')}</p>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{pitchData.surface}</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {vs.avgFirst > 175
            ? t('matchDetail.pitch.highScoring')
            : vs.avgFirst > 155
            ? t('matchDetail.pitch.balanced')
            : t('matchDetail.pitch.lowScoring')}
        </p>
      </div>

      {/* Venue Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <StadiumIcon className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 dark:text-gray-100">{match.venue}</h3>
            <p className="text-xs text-gray-400">{match.city || 'India'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200 dark:text-gray-100">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function H2HTab({ match }) {
  const { t } = useTranslation();
  const h2h = match.h2h;
  if (!h2h) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">{t('matchDetail.h2h.notAvailable')}</p>
      </div>
    );
  }

  const homeTeam = getTeamInfo(match, 'home');
  const awayTeam = getTeamInfo(match, 'away');
  const homePct = h2h.total > 0 ? Math.round((h2h.homeWins / h2h.total) * 100) : 50;
  const awayPct = 100 - homePct;

  return (
    <div className="space-y-4">
      {/* Win ratio bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('matchDetail.h2h.overallRecord', { count: h2h.total })}</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold" style={{ color: homeTeam.bg }}>{h2h.homeWins}</p>
            <p className="text-[10px] text-gray-500">{homeTeam.short} {t('matchDetail.h2h.wins')}</p>
          </div>
          <div className="text-gray-300 text-xs font-medium">{t('matchDetail.h2h.vs')}</div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold" style={{ color: awayTeam.bg }}>{h2h.awayWins}</p>
            <p className="text-[10px] text-gray-500">{awayTeam.short} {t('matchDetail.h2h.wins')}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="h-full rounded-l-full transition-all" style={{ width: `${homePct}%`, background: homeTeam.bg }} />
          <div className="h-full rounded-r-full transition-all" style={{ width: `${awayPct}%`, background: awayTeam.bg }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">{homePct}%</span>
          <span className="text-[10px] text-gray-400">{awayPct}%</span>
        </div>
      </div>

      {/* Last 5 meetings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('matchDetail.h2h.last5Meetings')}</h3>
        <div className="flex gap-2 justify-center">
          {h2h.lastFive.map((winner, i) => {
            const wTeam = winner === match.home ? getTeamInfo(match, 'home') : winner === match.away ? getTeamInfo(match, 'away') : { short: winner, bg: '#6B7280', text: '#fff' };
            return (
              <div key={i}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-bold shadow-sm"
                style={{ background: wTeam.bg, color: wTeam.text }}>
                {wTeam.short}
              </div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">{t('matchDetail.h2h.mostRecentOldest')}</p>
      </div>
    </div>
  );
}

function ScorecardTab({ scorecard, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="mt-3 text-gray-500 text-sm">Loading scorecard...</p>
      </div>
    );
  }

  if (!scorecard || scorecard.innings?.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">Scorecard not available yet</p>
        <p className="text-gray-300 text-xs mt-1">Available after match starts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scorecard.innings.map((inn, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Innings header */}
          <div className="px-4 py-3 bg-[#0B1E4D] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white truncate flex-1">{inn.inning}</h3>
            <span className="text-sm font-bold text-white ml-2">
              {inn.runs}/{inn.wickets} <span className="text-white/60 text-xs">({inn.overs} ov)</span>
            </span>
          </div>

          {/* Batting table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400">
                  <th className="text-left px-3 py-2 font-medium">Batter</th>
                  <th className="text-center px-1 py-2 font-medium w-8">R</th>
                  <th className="text-center px-1 py-2 font-medium w-8">B</th>
                  <th className="text-center px-1 py-2 font-medium w-8">4s</th>
                  <th className="text-center px-1 py-2 font-medium w-8">6s</th>
                  <th className="text-center px-1 py-2 font-medium w-10">SR</th>
                </tr>
              </thead>
              <tbody>
                {inn.batting.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{b.batsman}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{b.dismissal || 'batting'}</p>
                    </td>
                    <td className={`text-center py-2 font-bold ${b.runs >= 50 ? 'text-[#FF9933]' : b.runs >= 30 ? 'text-[#0B1E4D]' : 'text-gray-700'}`}>
                      {b.runs}
                    </td>
                    <td className="text-center py-2 text-gray-500">{b.balls}</td>
                    <td className="text-center py-2 text-gray-500">{b.fours}</td>
                    <td className="text-center py-2 text-gray-500">{b.sixes}</td>
                    <td className={`text-center py-2 ${b.strike_rate >= 150 ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      {b.strike_rate?.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inn.extras > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-100 text-[11px] text-gray-400">
              Extras: {inn.extras}
            </div>
          )}

          {/* Bowling table */}
          {inn.bowling.length > 0 && (
            <div className="border-t-2 border-gray-100 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-400">
                    <th className="text-left px-3 py-2 font-medium">Bowler</th>
                    <th className="text-center px-1 py-2 font-medium w-8">O</th>
                    <th className="text-center px-1 py-2 font-medium w-8">M</th>
                    <th className="text-center px-1 py-2 font-medium w-8">R</th>
                    <th className="text-center px-1 py-2 font-medium w-8">W</th>
                    <th className="text-center px-1 py-2 font-medium w-10">Eco</th>
                  </tr>
                </thead>
                <tbody>
                  {inn.bowling.map((bw, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{bw.bowler}</td>
                      <td className="text-center py-2 text-gray-500">{bw.overs}</td>
                      <td className="text-center py-2 text-gray-500">{bw.maidens}</td>
                      <td className="text-center py-2 text-gray-500">{bw.runs}</td>
                      <td className={`text-center py-2 font-bold ${bw.wickets >= 3 ? 'text-[#FF9933]' : bw.wickets >= 2 ? 'text-[#0B1E4D]' : 'text-gray-700'}`}>
                        {bw.wickets}
                      </td>
                      <td className={`text-center py-2 ${bw.economy <= 6 ? 'text-green-600 font-semibold' : bw.economy >= 10 ? 'text-red-500' : 'text-gray-500'}`}>
                        {bw.economy?.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SquadTab({ squad, loading, match }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="mt-3 text-gray-500 text-sm">Loading squad...</p>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">Squad not available yet</p>
      </div>
    );
  }

  function RoleBadge({ role }) {
    const r = (role || '').toLowerCase();
    let label = role || '—';
    let cls = 'bg-gray-100 text-gray-500';
    if (r.includes('bat')) { label = 'BAT'; cls = 'bg-blue-50 text-blue-600'; }
    else if (r.includes('bowl')) { label = 'BOWL'; cls = 'bg-green-50 text-green-600'; }
    else if (r.includes('all')) { label = 'ALL'; cls = 'bg-purple-50 text-purple-600'; }
    else if (r.includes('wk') || r.includes('keeper')) { label = 'WK'; cls = 'bg-amber-50 text-amber-600'; }
    return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{label}</span>;
  }

  const teams = [
    { data: squad.home_squad, side: 'home' },
    { data: squad.away_squad, side: 'away' },
  ];

  return (
    <div className="space-y-4">
      {teams.map(({ data, side }) => {
        const team = getTeamInfo(match, side);
        return (
          <div key={side} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: team.bg }}>
              {team.img ? (
                <img src={team.img} alt={team.short} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold"
                  style={{ color: team.text }}>{team.short}</div>
              )}
              <h3 className="text-sm font-semibold" style={{ color: team.text }}>
                {data.team?.name || team.name}
              </h3>
              <span className="ml-auto text-[10px] font-medium" style={{ color: `${team.text}99` }}>
                {data.players?.length || 0} players
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {(data.players || []).map((p, i) => (
                <div key={p.id || i} className="flex items-center gap-3 px-4 py-2.5">
                  {p.player_img ? (
                    <img src={p.player_img} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                      {p.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {p.name}
                      {p.is_captain && <span className="text-[9px] text-[#FF9933] font-bold ml-1">(C)</span>}
                      {p.is_keeper && <span className="text-[9px] text-amber-500 font-bold ml-1">(WK)</span>}
                    </p>
                    {p.country && <p className="text-[10px] text-gray-400">{p.country}</p>}
                  </div>
                  <RoleBadge role={p.role} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OddsTab({ match, totals }) {
  const { t } = useTranslation();
  const comparison = match.oddsComparison;
  const homeTeam = getTeamInfo(match, 'home');
  const awayTeam = getTeamInfo(match, 'away');

  const hasH2H = comparison && comparison.length > 0;
  const hasTotals = totals && totals.totals?.length > 0;

  if (!hasH2H && !hasTotals) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
        <div className="mb-3 flex justify-center"><BarChartIcon className="w-8 h-8 text-gray-400" /></div>
        <p className="text-gray-500 text-sm font-medium">{t('matchDetail.odds.notAvailable')}</p>
        <p className="text-gray-400 text-xs mt-1.5 max-w-[260px] mx-auto">{t('matchDetail.odds.notAvailableHint')}</p>
      </div>
    );
  }

  const bestHome = hasH2H ? Math.max(...comparison.map(o => o.home)) : 0;
  const bestAway = hasH2H ? Math.max(...comparison.map(o => o.away)) : 0;

  return (
    <div className="space-y-4">
      {/* Match Winner */}
      {hasH2H && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('matchDetail.odds.oddsComparison')}</h3>
          </div>
          <div className="grid grid-cols-3 px-4 py-2 border-b border-gray-100 text-[10px] font-medium text-gray-400">
            <span>{t('matchDetail.odds.bookmaker')}</span>
            <span className="text-center">{homeTeam.short}</span>
            <span className="text-center">{awayTeam.short}</span>
          </div>
          {comparison.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 px-4 py-3 items-center ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <span className="text-xs font-medium text-gray-700">{row.bookmaker}</span>
              <span className={`text-center text-sm font-bold ${row.home === bestHome ? 'text-green-600' : 'text-gray-700'}`}>
                {row.home}
                {row.home === bestHome && <span className="text-[8px] ml-0.5 text-[#138808]">{t('matchDetail.odds.best')}</span>}
              </span>
              <span className={`text-center text-sm font-bold ${row.away === bestAway ? 'text-green-600' : 'text-gray-700'}`}>
                {row.away}
                {row.away === bestAway && <span className="text-[8px] ml-0.5 text-[#138808]">{t('matchDetail.odds.best')}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Totals (Over/Under) */}
      {hasTotals && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Total Runs Over/Under</h3>
          </div>
          <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-100 text-[10px] font-medium text-gray-400">
            <span>Bookmaker</span>
            <span className="text-center">Line</span>
            <span className="text-center">Over</span>
            <span className="text-center">Under</span>
          </div>
          {totals.totals.map((t, i) => (
            <div key={i} className={`grid grid-cols-4 px-4 py-3 items-center ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <span className="text-xs font-medium text-gray-700 truncate">{t.bookmaker}</span>
              <span className="text-center text-xs font-bold text-[#0B1E4D]">{t.point}</span>
              <span className="text-center text-sm font-bold text-green-600">{t.over_odds}</span>
              <span className="text-center text-sm font-bold text-red-500">{t.under_odds}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionTab({ match, prediction, loading, onGetPrediction, navigate }) {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (sharing || !prediction) return;
    setSharing(true);
    try {
      const { sharePrediction } = await import('../../../shared/utils/sharePrediction');
      await sharePrediction({ match, prediction });
    } catch {
      // ignore share errors
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="mt-3 text-gray-500 text-sm">{t('matchDetail.prediction.analyzing')}</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <RobotIcon className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('matchDetail.prediction.aiMatchPrediction')}</h3>
        <p className="text-xs text-gray-500 mb-5">
          {t('matchDetail.prediction.getDescription')}
        </p>
        <button onClick={onGetPrediction}
          className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-transform shadow-md">
          {t('matchDetail.prediction.getAiPrediction')}
        </button>
      </div>
    );
  }

  const winnerTeam = prediction.winner === match.home ? getTeamInfo(match, 'home') : prediction.winner === match.away ? getTeamInfo(match, 'away') : { short: prediction.winner, bg: '#6B7280', text: '#fff' };

  const riskColor = (risk) => {
    if (risk === 'Low') return { bg: 'bg-green-100', text: 'text-green-700', key: 'shield', IconComponent: ShieldCheckIcon };
    if (risk === 'High') return { bg: 'bg-red-100', text: 'text-red-700', key: 'fire', IconComponent: FireIcon };
    return { bg: 'bg-yellow-100', text: 'text-yellow-700', key: 'lightning', IconComponent: LightningIcon };
  };

  return (
    <div className="space-y-4">
      {/* Winner prediction — compact */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('matchDetail.prediction.predictedWinner')}</h3>
          <span className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{t('matchDetail.prediction.aiPrediction')}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
            style={{ background: winnerTeam.bg, color: winnerTeam.text }}>
            {winnerTeam.short}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-800 dark:text-gray-200">{winnerTeam.name || prediction.winner}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                  style={{ width: `${prediction.confidence}%` }} />
              </div>
              <span className="text-sm font-bold text-green-600">{prediction.confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI RECOMMENDED BETS — shimmering cards → partner offer */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <TargetIcon className="w-4 h-4" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">AI Recommended Bets</h3>
        </div>
        {prediction.valueBets.map((bet, i) => {
          const rc = riskColor(bet.risk);
          // Different gradient per card
          const gradients = [
            'from-[#0B1E4D] via-[#1a3a7a] to-[#0d2b5e]',
            'from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e]',
            'from-[#0f3460] via-[#1a5276] to-[#0f3460]',
          ];
          return (
            <div
              key={i}
              onClick={() => navigate('/offer')}
              className={`block bg-gradient-to-r ${gradients[i % 3]} rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-transform overflow-hidden relative cursor-pointer`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -skew-x-12"
                style={{ animation: `shimmer ${2 + i * 0.3}s ease-in-out infinite` }} />
              {/* Glow accent */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
                style={{ background: `radial-gradient(circle, ${rc.key === 'shield' ? '#22c55e' : rc.key === 'fire' ? '#ef4444' : '#FF9933'} 0%, transparent 70%)` }} />

              <div className="relative z-10">
                {/* Top: market + risk */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">{bet.market}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 ${rc.bg} ${rc.text}`}>
                    <rc.IconComponent className="w-3 h-3" /> {bet.risk}
                  </span>
                </div>

                {/* Main: pick + odds */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-white">{bet.pick}</span>
                  <span className="text-xl font-black text-[#FF9933] tracking-tight">@{bet.odds}</span>
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${(bet.confidence === 'High' ? 82 : bet.confidence === 'Medium' ? 58 : 35)}%`,
                        background: 'linear-gradient(90deg, #FF9933, #138808)',
                      }} />
                  </div>
                  <span className="text-[10px] font-bold text-white/70">{bet.confidence}</span>
                </div>

                {/* Reasoning */}
                <p className="text-[11px] text-white/40 leading-relaxed mb-3">{bet.value}</p>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">Tap to place bet</span>
                  <div className="flex items-center gap-1.5 bg-[#FF9933] px-3 py-1.5 rounded-lg">
                    <span className="text-[11px] font-bold text-white">Bet Now</span>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key factors */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('matchDetail.prediction.keyFactors')}</h3>
        <div className="space-y-2.5">
          {prediction.factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px]
                ${f.impact === 'positive' ? 'bg-green-100 text-green-600' :
                  f.impact === 'negative' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-500'}`}>
                {f.impact === 'positive' ? '↑' : f.impact === 'negative' ? '↓' : '~'}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">{f.label}</p>
                <p className="text-[11px] text-gray-400">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis text */}
      {prediction.analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">AI Analysis</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{prediction.analysis}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2">
        <WarningIcon className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-[10px] text-amber-700 leading-relaxed">
          AI predictions are for informational purposes only. Betting involves risk — never bet more than you can afford to lose. Always gamble responsibly.
        </p>
      </div>

      {/* Share Prediction Button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="w-full py-3.5 bg-gradient-to-r from-[#FF9933] to-[#FF8800] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md disabled:opacity-60"
      >
        {sharing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm">{t('matchDetail.prediction.generating')}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            <span className="text-sm">{t('matchDetail.prediction.sharePrediction')}</span>
          </>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ⭐ Stars Tab — Top Performers (Fantasy Points)
// ─────────────────────────────────────────────
function StarsTab({ fantasyPoints, loading }) {
  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  if (!fantasyPoints || !fantasyPoints.totals?.length) {
    return (
      <div className="text-center py-12">
        <div className="mb-3 flex justify-center"><svg className="w-10 h-10 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></div>
        <p className="text-gray-500 text-sm">Fantasy points not available for this match</p>
        <p className="text-gray-400 text-xs mt-1">Available for completed matches with fantasy data</p>
      </div>
    );
  }

  const getMedalIcon = (i) => i === 0 ? <GoldMedalIcon className="w-5 h-5" /> : i === 1 ? <SilverMedalIcon className="w-5 h-5" /> : i === 2 ? <BronzeMedalIcon className="w-5 h-5" /> : null;
  const getBarColor = (i) => i === 0 ? 'from-yellow-400 to-amber-500' : i === 1 ? 'from-gray-300 to-gray-400' : i === 2 ? 'from-orange-300 to-orange-400' : 'from-blue-300 to-blue-400';
  const maxPoints = fantasyPoints.totals[0]?.points || 100;

  return (
    <div className="space-y-4">
      {/* Top 3 Podium */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h3 className="text-white/80 text-xs font-semibold mb-3 flex items-center gap-1.5">
          <TrophyIcon className="w-5 h-5" /> TOP PERFORMERS
        </h3>
        <div className="space-y-2.5">
          {fantasyPoints.totals.slice(0, 3).map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-7 flex justify-center">{getMedalIcon(i)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-white font-semibold text-sm truncate">{p.name}</span>
                  <span className="text-yellow-400 font-bold text-sm ml-2">{p.points} pts</span>
                </div>
                {p.team && <span className="text-white/40 text-[10px]">{p.team}</span>}
                <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${getBarColor(i)} transition-all duration-700`}
                    style={{ width: `${Math.round((p.points / maxPoints) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">All Players</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {fantasyPoints.totals.map((p, i) => (
            <div key={i} className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <span className={`w-6 text-center text-xs font-bold ${
                i < 3 ? 'text-orange-500' : 'text-gray-400'
              }`}>{i + 1}</span>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                {p.team && <p className="text-[10px] text-gray-400">{p.team}</p>}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                    style={{ width: `${Math.round((p.points / maxPoints) * 100)}%` }} />
                </div>
                <span className={`text-sm font-bold min-w-[40px] text-right ${
                  i < 3 ? 'text-orange-500' : 'text-gray-600'
                }`}>{p.points}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-innings breakdown */}
      {fantasyPoints.innings?.length > 0 && fantasyPoints.innings.map((inn, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xs font-semibold text-blue-800">{inn.inning || `Innings ${idx + 1}`}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(inn.players || []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center px-4 py-2 hover:bg-gray-50">
                <span className="w-6 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 ml-3 truncate">{p.name}</p>
                <span className="text-sm font-bold text-blue-600">{p.points}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────
// 🔴 Live Tab — Ball-by-Ball Feed
// ─────────────────────────────────────────────
function LiveTab({ ballByBall, loading, onRefresh }) {
  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full animate-spin" /></div>;

  if (!ballByBall || !ballByBall.available) {
    return (
      <div className="text-center py-12">
        <div className="mb-3 flex justify-center"><CricketBatIcon className="w-10 h-10 text-gray-400" /></div>
        <p className="text-gray-500 text-sm font-medium">Ball-by-ball not available</p>
        <p className="text-gray-400 text-xs mt-1 max-w-[250px] mx-auto">
          Live ball tracking is available during major tournaments (IPL, World Cup, Internationals)
        </p>
        {onRefresh && (
          <button onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-xl active:scale-95 transition-transform">
            <RefreshIcon className="w-4 h-4 inline-block mr-1" /> Check Again
          </button>
        )}
      </div>
    );
  }

  const balls = [...(ballByBall.balls || [])].reverse(); // newest first

  const getBallStyle = (b) => {
    if (b.wicket) return 'bg-red-500 text-white';
    if (b.runs === 6) return 'bg-purple-500 text-white';
    if (b.runs === 4) return 'bg-blue-500 text-white';
    if (b.runs === 0) return 'bg-gray-200 text-gray-600';
    return 'bg-green-100 text-green-700';
  };

  const getBallLabel = (b) => {
    if (b.wicket) return 'W';
    if (b.extras > 0) return `${b.runs}+${b.extras}`;
    return String(b.runs);
  };

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs font-semibold text-gray-700">Ball-by-Ball</span>
        </div>
        {onRefresh && (
          <button onClick={onRefresh}
            className="text-xs text-blue-600 font-medium active:scale-95 transition-transform">
            <RefreshIcon className="w-3.5 h-3.5 inline-block mr-0.5" /> Refresh
          </button>
        )}
      </div>

      {/* Quick ball summary strip */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {balls.slice(0, 24).map((b, i) => (
            <div key={i} className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getBallStyle(b)}`}>
              {getBallLabel(b)}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>← Most Recent</span>
          <span>Older →</span>
        </div>
      </div>

      {/* Detailed ball feed */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Commentary</h3>
        </div>
        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
          {balls.slice(0, 50).map((b, i) => (
            <div key={i} className={`px-4 py-3 flex gap-3 ${b.wicket ? 'bg-red-50' : ''}`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getBallStyle(b)}`}>
                {getBallLabel(b)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {b.over}.{Math.round((b.ball % 1) * 10) || 0}
                  </span>
                  {b.score && <span className="text-[10px] text-gray-400">{b.score}</span>}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  <span className="font-medium">{b.bowler}</span>
                  {' → '}
                  <span className="font-medium">{b.batsman}</span>
                </p>
                {b.commentary && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{b.commentary}</p>
                )}
                {b.wicket && b.wicket_type && (
                  <p className="text-[11px] text-red-600 font-medium mt-0.5 flex items-center gap-1"><LiveDotIcon className="w-3 h-3" /> {b.wicket_type}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// Match Chat Tab — Live chat + Pick the Winner poll
// ─────────────────────────────────────────────
function MatchChatTab({ match }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [votes, setVotes] = useState({ home: 0, draw: 0, away: 0, total: 0, home_pct: 33, draw_pct: 34, away_pct: 33, user_vote: null });
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [polling, setPolling] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pollingRef = useRef(null);

  // Generate anonymous user ID
  const userId = useMemo(() => {
    let uid = localStorage.getItem('chat_user_id');
    if (!uid) {
      uid = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_user_id', uid);
    }
    return uid;
  }, []);

  // Load saved username
  useEffect(() => {
    const saved = localStorage.getItem('chat_user_name');
    if (saved) setUserName(saved);
    else setShowNameInput(true);
  }, []);

  // Fetch messages and votes on mount
  useEffect(() => {
    if (!match?.id) return;
    fetchMessages();
    fetchVotes();
  }, [match?.id]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!match?.id || !polling) return;
    pollingRef.current = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [match?.id, polling]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function fetchMessages(silent = false) {
    try {
      const last = messages.length > 0 ? messages[messages.length - 1]?.timestamp : null;
      const res = await api.getChatMessages(match.id, silent ? last : null);
      if (silent && res.messages?.length) {
        // Append only new messages
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = res.messages.filter(m => !existingIds.has(m.id));
          return newMsgs.length ? [...prev, ...newMsgs] : prev;
        });
      } else if (!silent) {
        setMessages(res.messages || []);
      }
    } catch {
      // Silently fail — chat is optional
    }
  }

  async function fetchVotes() {
    try {
      const res = await api.getVotes(match.id, userId);
      setVotes(res);
    } catch {
      // Use default votes
    }
  }

  async function handleVote(choice) {
    try {
      const res = await api.castVote(match.id, { user_id: userId, vote: choice });
      setVotes(res);
    } catch {
      // Optimistic update
      setVotes(prev => ({ ...prev, user_vote: choice }));
    }
  }

  async function handleSend() {
    if (!newMsg.trim() || sending) return;
    if (!userName) {
      setShowNameInput(true);
      return;
    }

    setSending(true);
    try {
      const res = await api.postChatMessage(match.id, {
        user_name: userName,
        message: newMsg.trim(),
      });
      setMessages(prev => [...prev, res]);
      setNewMsg('');
    } catch {
      // Add locally even if API fails
      setMessages(prev => [...prev, {
        id: `local_${Date.now()}`,
        user_name: userName,
        message: newMsg.trim(),
        timestamp: new Date().toISOString(),
      }]);
      setNewMsg('');
    } finally {
      setSending(false);
    }
  }

  function handleSetName() {
    if (!userName.trim()) return;
    const name = userName.trim().slice(0, 20);
    setUserName(name);
    localStorage.setItem('chat_user_name', name);
    setShowNameInput(false);
  }

  // Team info for poll
  const homeInfo = (() => {
    const ipl = IPL_TEAMS[match.home] || {};
    return { code: match.home, name: match.homeName || ipl.name || match.home, bg: match.homeColor || ipl.bg || '#6366f1' };
  })();
  const awayInfo = (() => {
    const ipl = IPL_TEAMS[match.away] || {};
    return { code: match.away, name: match.awayName || ipl.name || match.away, bg: match.awayColor || ipl.bg || '#ef4444' };
  })();

  // Generate color for username
  function nameColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#FF9933', '#138808', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
    return colors[Math.abs(hash) % colors.length];
  }

  function formatTime(ts) {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  return (
    <div className="space-y-4">
      {/* ── Pick the Winner Poll ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 text-center mb-3">Pick the winner!</h3>

        {/* Vote bar */}
        <div className="flex rounded-xl overflow-hidden h-11 shadow-inner">
          <button
            onClick={() => handleVote('home')}
            className={`flex-1 flex flex-col items-center justify-center transition-all relative ${
              votes.user_vote === 'home' ? 'ring-2 ring-white ring-inset' : ''
            }`}
            style={{
              background: homeInfo.bg,
              width: `${Math.max(votes.home_pct, 15)}%`,
              flex: `${Math.max(votes.home_pct, 15)} 0 0`,
            }}
          >
            <span className="text-white font-bold text-sm leading-none">{votes.home_pct}%</span>
            <span className="text-white/70 text-[9px] font-medium">{homeInfo.code}</span>
          </button>
          <button
            onClick={() => handleVote('draw')}
            className={`flex flex-col items-center justify-center transition-all bg-gray-400 dark:bg-gray-500 ${
              votes.user_vote === 'draw' ? 'ring-2 ring-white ring-inset' : ''
            }`}
            style={{
              flex: `${Math.max(votes.draw_pct, 15)} 0 0`,
            }}
          >
            <span className="text-white font-bold text-sm leading-none">{votes.draw_pct}%</span>
            <span className="text-white/70 text-[9px] font-medium">X</span>
          </button>
          <button
            onClick={() => handleVote('away')}
            className={`flex-1 flex flex-col items-center justify-center transition-all relative ${
              votes.user_vote === 'away' ? 'ring-2 ring-white ring-inset' : ''
            }`}
            style={{
              background: awayInfo.bg,
              flex: `${Math.max(votes.away_pct, 15)} 0 0`,
            }}
          >
            <span className="text-white font-bold text-sm leading-none">{votes.away_pct}%</span>
            <span className="text-white/70 text-[9px] font-medium">{awayInfo.code}</span>
          </button>
        </div>

        {votes.total > 0 && (
          <p className="text-[10px] text-gray-400 text-center mt-2">{votes.total} votes</p>
        )}
      </div>

      {/* ── Match Chat ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Match Chat</h3>
          <span className="ml-auto text-[10px] text-green-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>

        {/* Name input modal */}
        {showNameInput && (
          <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800/50">
            <p className="text-xs text-primary-700 dark:text-primary-300 mb-2">Choose your display name:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetName()}
                placeholder="Your name..."
                maxLength={20}
                className="flex-1 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleSetName}
                disabled={!userName.trim()}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={chatContainerRef}
          className="h-72 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/50"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No messages yet</p>
              <p className="text-[11px] text-gray-300 dark:text-gray-600">Be the first to comment on this match!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.user_name === userName;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: nameColor(msg.user_name) }}
                  >
                    {msg.user_name.charAt(0).toUpperCase()}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-3 py-2 ${
                      isMe
                        ? 'bg-primary-600 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
                    }`}>
                      {!isMe && (
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: nameColor(msg.user_name) }}>
                          {msg.user_name}
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed">{msg.message}</p>
                    </div>
                    <p className={`text-[9px] text-gray-400 mt-0.5 ${isMe ? 'text-right' : ''} px-1`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-3 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sending && handleSend()}
              placeholder="Write a message..."
              maxLength={500}
              className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
              disabled={sending || showNameInput}
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending || showNameInput}
              className="w-9 h-9 bg-primary-600 text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { canUseAI, useAIRequest, isPro } = usePremium();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [scorecardFetched, setScorecardFetched] = useState(false);
  const [squad, setSquad] = useState(null);
  const [squadLoading, setSquadLoading] = useState(false);
  const [squadFetched, setSquadFetched] = useState(false);
  const [totals, setTotals] = useState(null);
  const [totalsFetched, setTotalsFetched] = useState(false);
  const [fantasyPoints, setFantasyPoints] = useState(null);
  const [fantasyLoading, setFantasyLoading] = useState(false);
  const [fantasyFetched, setFantasyFetched] = useState(false);
  const [ballByBall, setBallByBall] = useState(null);
  const [bbbLoading, setBbbLoading] = useState(false);
  const [bbbFetched, setBbbFetched] = useState(false);
  const { isPushEnabled, requestPermission, scheduleMatchReminder } = usePushNotifications();
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        const data = await api.getMatch(id);
        setMatch(data);
      } catch (err) {
        console.error('Failed to fetch match:', err);
        setMatch(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [id]);

  // Lazy load scorecard when tab is selected (fetch once)
  useEffect(() => {
    if (activeTab === 'scorecard' && !scorecardFetched) {
      setScorecardFetched(true);
      setScorecardLoading(true);
      api.getScorecard(id).then(setScorecard).catch(() => {}).finally(() => setScorecardLoading(false));
    }
  }, [activeTab, id, scorecardFetched]);

  // Lazy load squad when tab is selected (fetch once)
  useEffect(() => {
    if (activeTab === 'squad' && !squadFetched) {
      setSquadFetched(true);
      setSquadLoading(true);
      api.getSquad(id).then(setSquad).catch(() => {}).finally(() => setSquadLoading(false));
    }
  }, [activeTab, id, squadFetched]);

  // Lazy load totals when odds tab is selected (fetch once)
  useEffect(() => {
    if (activeTab === 'odds' && !totalsFetched) {
      setTotalsFetched(true);
      api.getTotals(id).then(setTotals).catch(() => {});
    }
  }, [activeTab, id, totalsFetched]);

  // Lazy load fantasy points when stars tab is selected
  useEffect(() => {
    if (activeTab === 'stars' && !fantasyFetched) {
      setFantasyFetched(true);
      setFantasyLoading(true);
      api.getFantasyPoints(id).then(setFantasyPoints).catch(() => {}).finally(() => setFantasyLoading(false));
    }
  }, [activeTab, id, fantasyFetched]);

  // Lazy load ball-by-ball when live tab is selected
  useEffect(() => {
    if (activeTab === 'live' && !bbbFetched) {
      setBbbFetched(true);
      setBbbLoading(true);
      api.getBallByBall(id).then(setBallByBall).catch(() => {}).finally(() => setBbbLoading(false));
    }
  }, [activeTab, id, bbbFetched]);

  async function handleGetPrediction() {
    // Check AI request limit (shared with AI Chat)
    if (!isPro && !canUseAI()) {
      setShowUpgradeModal(true);
      return;
    }

    setPredictionLoading(true);
    // Count this AI request
    useAIRequest();

    try {
      const data = await api.getPrediction(id);
      setPrediction(data);
    } catch (err) {
      // If 429 (limit exceeded on server side) — show upgrade modal
      if (err?.status === 429) {
        setShowUpgradeModal(true);
      }
      console.error('Failed to fetch prediction:', err);
      setPrediction(null);
    } finally {
      setPredictionLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!match) return null;

  const homeTeam = getTeamInfo(match, 'home');
  const awayTeam = getTeamInfo(match, 'away');
  const dt = new Date(match.date);
  const dateStr = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Градиент из цветов обеих команд
  const headerBg = `linear-gradient(135deg, ${homeTeam.bg}dd, ${awayTeam.bg}dd)`;

  const tabContent = {
    overview: <OverviewTab match={match} />,
    scorecard: <ScorecardTab scorecard={scorecard} loading={scorecardLoading} />,
    stars: <StarsTab fantasyPoints={fantasyPoints} loading={fantasyLoading} match={match} />,
    live: <LiveTab ballByBall={ballByBall} loading={bbbLoading} match={match} onRefresh={() => { setBbbFetched(false); }} />,
    squad: <SquadTab squad={squad} loading={squadLoading} match={match} />,
    venue: <VenueTab match={match} />,
    h2h: <H2HTab match={match} />,
    odds: <OddsTab match={match} totals={totals} />,
    prediction: <PredictionTab match={match} prediction={prediction} loading={predictionLoading} onGetPrediction={handleGetPrediction} navigate={navigate} />,
    chat: <MatchChatTab match={match} />,
  };

  return (
    <div className="min-h-dvh bg-[#F0F2F5] dark:bg-gray-900">
      {/* Header with team colors */}
      <div className="px-4 pt-12 pb-6 rounded-b-3xl relative" style={{ background: headerBg }}>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/20 rounded-b-3xl" />
        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center active:scale-95 transition-transform backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="text-center">
              <span className="text-[10px] font-medium text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                {match.matchType?.toUpperCase() || 'CRICKET'} • {dateStr}
              </span>
            </div>
            <button
              onClick={async () => {
                if (!isPushEnabled) {
                  const result = await requestPermission();
                  if (result !== 'granted') return;
                }
                if (match) {
                  const ok = scheduleMatchReminder(match);
                  if (ok) setReminderSet(true);
                }
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform backdrop-blur-sm ${
                reminderSet ? 'bg-[#FF9933]/30' : 'bg-white/15'
              }`}
            >
              <svg className="w-5 h-5 text-white" fill={reminderSet ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
          </div>

          {/* Teams vs */}
          <div className="flex items-center justify-between px-2">
            <TeamBadgeLarge code={match.home} color={match.homeColor} img={match.homeImg} name={match.homeName} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-white/60 text-[10px] font-medium">{timeStr} IST</span>
              <span className="text-white text-lg font-black">VS</span>
            </div>
            <TeamBadgeLarge code={match.away} color={match.awayColor} img={match.awayImg} name={match.awayName} />
          </div>
        </div>
      </div>

      <TricolorBar className="mx-4 my-2" />

      {/* Tab navigation */}
      <div className="px-4 -mt-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-1 flex gap-0.5 overflow-x-auto no-scrollbar">
          {TAB_KEYS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-fit px-3 py-2 rounded-xl text-[11px] font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-500 active:bg-gray-50'}`}>
              {tab.labelKey ? t(tab.labelKey) : tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade Modal — limit reached */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 animate-fade-in" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Top gradient banner */}
            <div className="bg-gradient-to-br from-[#0B1E4D] via-[#162D6B] to-[#1a3a7a] px-6 pt-7 pb-6 text-center relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 bg-[#FF9933] blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-10 bg-[#138808] blur-xl" />
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
                <LockIcon className="w-8 h-8 text-white/90" />
              </div>
              <h3 className="text-xl font-black text-white">{t('premium.limitReached')}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{t('premium.limitReachedDesc')}</p>
            </div>

            <div className="p-5 space-y-3">
              {/* Option 1: Get Pro — big CTA */}
              <button
                onClick={() => { setShowUpgradeModal(false); navigate('/pro'); }}
                className="block w-full p-4 bg-gradient-to-r from-[#FF9933] to-[#FF8800] rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-200/50 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <SparkleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[15px] font-bold text-white">{t('premium.getProNow')}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">{t('premium.getProDesc')}</p>
                  </div>
                  <svg className="w-5 h-5 text-white/70 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                {/* Pro features list */}
                <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap gap-x-4 gap-y-1">
                  {['proFeature1', 'proFeature2', 'proFeature3'].map(key => (
                    <div key={key} className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] text-white/80">{t(`premium.${key}`)}</span>
                    </div>
                  ))}
                </div>
              </button>

              {/* Option 2: Wait for reset */}
              <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('premium.waitForReset')}</p>
                  <p className="text-[11px] text-gray-400">{t('premium.resetsIn24h')}</p>
                </div>
              </div>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2.5 text-gray-400 text-sm font-medium"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="px-4 mt-4 pb-40">
        {tabContent[activeTab]}
      </div>

      {/* Floating AI Analysis Button — runs prediction inline */}
      {!prediction && (
        <button
          onClick={() => { setActiveTab('prediction'); handleGetPrediction(); }}
          disabled={predictionLoading}
          className="fixed bottom-40 right-4 z-40 bg-[#FF9933] text-white px-4 py-3 rounded-2xl shadow-lg shadow-orange-200 flex items-center gap-2 active:scale-95 transition-transform ring-2 ring-[#138808]/20 disabled:opacity-60">
          {predictionLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-sm font-semibold">{t('matchDetail.prediction.analyzing')}</span>
            </>
          ) : (
            <>
              <RobotIcon className="w-5 h-5" />
              <span className="text-sm font-semibold">{t('matchDetail.prediction.getAiPrediction')}</span>
            </>
          )}
        </button>
      )}

      <BookmakerBanner variant="sticky" />
      <BottomNav />
    </div>
  );
}
