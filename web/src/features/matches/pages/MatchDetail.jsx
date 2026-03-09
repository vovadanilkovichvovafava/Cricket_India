import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IPL_TEAMS } from '../../../shared/utils/teamColors';
import api from '../../../shared/api';
import BottomNav from '../../../shared/components/BottomNav';
import BookmakerBanner from '../../../shared/components/BookmakerBanner';
import usePushNotifications from '../../../shared/hooks/usePushNotifications';
import {
  CalendarIcon, ClockIcon, StadiumIcon, LocationIcon, StatusIcon,
  RobotIcon,
} from '../../../shared/components/Icons';
import TricolorBar from '../../../shared/components/TricolorBar';

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

// Мок-данные для автономной работы
const MOCK_MATCHES = {
  1: {
    id: 1, home: 'CSK', away: 'MI', date: '2026-03-28T19:30:00+05:30',
    venue: 'MA Chidambaram Stadium', city: 'Chennai', status: 'upcoming',
    odds: { home: 1.85, away: 2.05, draw: null },
    venueStats: { matches: 98, avgFirst: 172, avgSecond: 158, tossWinBat: 55, chaseWin: 42 },
    h2h: { total: 36, homeWins: 20, awayWins: 16, lastFive: ['CSK', 'MI', 'CSK', 'CSK', 'MI'] },
    lineups: {
      home: ['MS Dhoni (wk)', 'Ruturaj Gaikwad (c)', 'Devon Conway', 'Moeen Ali', 'Shivam Dube', 'Ravindra Jadeja', 'Dwaine Pretorius', 'Deepak Chahar', 'Tushar Deshpande', 'Maheesh Theekshana', 'Matheesha Pathirana'],
      away: ['Rohit Sharma (c)', 'Ishan Kishan (wk)', 'Suryakumar Yadav', 'Tilak Varma', 'Hardik Pandya', 'Tim David', 'Romario Shepherd', 'Piyush Chawla', 'Jasprit Bumrah', 'Jofra Archer', 'Akash Madhwal'],
    },
    oddsComparison: [
      { bookmaker: 'Bet365', home: 1.85, away: 2.05 },
      { bookmaker: '1xBet', home: 1.83, away: 2.08 },
      { bookmaker: 'Betway', home: 1.87, away: 2.02 },
      { bookmaker: 'Parimatch', home: 1.82, away: 2.10 },
      { bookmaker: '10CRIC', home: 1.84, away: 2.06 },
    ],
  },
  2: {
    id: 2, home: 'RCB', away: 'KKR', date: '2026-03-29T15:30:00+05:30',
    venue: 'M Chinnaswamy Stadium', city: 'Bengaluru', status: 'upcoming',
    odds: { home: 2.10, away: 1.80 },
    venueStats: { matches: 92, avgFirst: 183, avgSecond: 168, tossWinBat: 48, chaseWin: 50 },
    h2h: { total: 32, homeWins: 12, awayWins: 20, lastFive: ['KKR', 'KKR', 'RCB', 'KKR', 'RCB'] },
    lineups: {
      home: ['Virat Kohli', 'Faf du Plessis (c)', 'Rajat Patidar', 'Glenn Maxwell', 'Dinesh Karthik (wk)', 'Shahbaz Ahmed', 'Wanindu Hasaranga', 'Harshal Patel', 'Mohammed Siraj', 'Josh Hazlewood', 'Yash Dayal'],
      away: ['Venkatesh Iyer', 'Phil Salt (wk)', 'Shreyas Iyer (c)', 'Nitish Rana', 'Andre Russell', 'Rinku Singh', 'Sunil Narine', 'Varun Chakravarthy', 'Mitchell Starc', 'Harshit Rana', 'Vaibhav Arora'],
    },
    oddsComparison: [
      { bookmaker: 'Bet365', home: 2.10, away: 1.80 },
      { bookmaker: '1xBet', home: 2.12, away: 1.78 },
      { bookmaker: 'Betway', home: 2.08, away: 1.82 },
      { bookmaker: 'Parimatch', home: 2.15, away: 1.76 },
      { bookmaker: '10CRIC', home: 2.10, away: 1.80 },
    ],
  },
};

// Генерация мока для неизвестного id
function getDefaultMock(id) {
  return {
    id: Number(id), home: 'CSK', away: 'MI', date: '2026-03-28T19:30:00+05:30',
    venue: 'MA Chidambaram Stadium', city: 'Chennai', status: 'upcoming',
    odds: { home: 1.85, away: 2.05 },
    venueStats: { matches: 98, avgFirst: 172, avgSecond: 158, tossWinBat: 55, chaseWin: 42 },
    h2h: { total: 36, homeWins: 20, awayWins: 16, lastFive: ['CSK', 'MI', 'CSK', 'CSK', 'MI'] },
    lineups: {
      home: ['Ruturaj Gaikwad (c)', 'Devon Conway', 'Moeen Ali', 'Shivam Dube', 'Ravindra Jadeja', 'MS Dhoni (wk)', 'Dwaine Pretorius', 'Deepak Chahar', 'Tushar Deshpande', 'Maheesh Theekshana', 'Matheesha Pathirana'],
      away: ['Rohit Sharma (c)', 'Ishan Kishan (wk)', 'Suryakumar Yadav', 'Tilak Varma', 'Hardik Pandya', 'Tim David', 'Romario Shepherd', 'Piyush Chawla', 'Jasprit Bumrah', 'Jofra Archer', 'Akash Madhwal'],
    },
    oddsComparison: [
      { bookmaker: 'Bet365', home: 1.85, away: 2.05 },
      { bookmaker: '1xBet', home: 1.83, away: 2.08 },
      { bookmaker: 'Betway', home: 1.87, away: 2.02 },
    ],
  };
}

const MOCK_PREDICTION = {
  winner: 'CSK',
  confidence: 62,
  factors: [
    { label: 'Home advantage', impact: 'positive', detail: 'CSK have won 68% at Chepauk' },
    { label: 'Head-to-head', impact: 'positive', detail: 'CSK lead 20-16 overall' },
    { label: 'Recent form', impact: 'neutral', detail: 'Both teams in similar form' },
    { label: 'Key player', impact: 'positive', detail: 'Bumrah availability uncertain for MI' },
  ],
  valueBets: [
    { market: 'Match Winner', pick: 'CSK', odds: 1.85, value: '+8.2%', confidence: 'High' },
    { market: 'Top Batsman', pick: 'Ruturaj Gaikwad', odds: 4.50, value: '+12.5%', confidence: 'Medium' },
    { market: 'Total Runs O/U', pick: 'Over 340.5', odds: 1.90, value: '+5.1%', confidence: 'Medium' },
  ],
};

const TAB_KEYS = [
  { key: 'overview', labelKey: 'matchDetail.tabs.overview' },
  { key: 'scorecard', label: 'Scorecard' },
  { key: 'squad', label: 'Squad' },
  { key: 'venue', labelKey: 'matchDetail.tabs.venue' },
  { key: 'h2h', labelKey: 'matchDetail.tabs.h2h' },
  { key: 'odds', labelKey: 'matchDetail.tabs.odds' },
  { key: 'prediction', labelKey: 'matchDetail.tabs.aiPick' },
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
    <div className="min-h-dvh bg-[#F0F2F5] flex flex-col items-center justify-center">
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
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('matchDetail.overview.matchInformation')}</h3>
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
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('matchDetail.overview.matchOdds')}</h3>
        {(() => {
          const homeTeam = getTeamInfo(match, 'home');
          const awayTeam = getTeamInfo(match, 'away');
          const odds = match.odds || {};
          return (
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl p-3 text-center border-2"
                style={{ borderColor: `${homeTeam.bg}25`, background: `${homeTeam.bg}08` }}>
                <p className="text-[10px] text-gray-500 mb-1">{homeTeam.short}</p>
                <p className="text-lg font-bold text-gray-900">{odds.home ?? '—'}</p>
                {odds.home && <p className="text-[10px] text-gray-400">{Math.round((1 / odds.home) * 100)}%</p>}
              </div>
              <div className="flex-1 rounded-xl p-3 text-center border-2"
                style={{ borderColor: `${awayTeam.bg}25`, background: `${awayTeam.bg}08` }}>
                <p className="text-[10px] text-gray-500 mb-1">{awayTeam.short}</p>
                <p className="text-lg font-bold text-gray-900">{odds.away ?? '—'}</p>
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
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
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
          <div key={side.key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
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

function VenueTab({ match }) {
  const { t } = useTranslation();
  const vs = match.venueStats;
  if (!vs) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">{t('matchDetail.venueStats.notAvailable')}</p>
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
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <StadiumIcon className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{match.venue}</h3>
            <p className="text-xs text-gray-400">{match.city || 'India'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-0.5">{s.label}</p>
              <p className="text-lg font-bold text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pitch insight */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('matchDetail.venueStats.pitchReport')}</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          {vs.avgFirst > 175
            ? 'High-scoring venue. Batting-friendly conditions expected with good carry and true bounce. Pacers may find some assistance early on.'
            : 'Moderate scoring venue. Spinners tend to play a key role in the middle overs. Chasing teams have a slight edge historically.'}
        </p>
      </div>
    </div>
  );
}

function H2HTab({ match }) {
  const { t } = useTranslation();
  const h2h = match.h2h;
  if (!h2h) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
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
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('matchDetail.h2h.overallRecord', { count: h2h.total })}</h3>
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
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('matchDetail.h2h.last5Meetings')}</h3>
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
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">Scorecard not available yet</p>
        <p className="text-gray-300 text-xs mt-1">Available after match starts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scorecard.innings.map((inn, idx) => (
        <div key={idx} className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
                      <p className="font-medium text-gray-800">{b.batsman}</p>
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
                      <td className="px-3 py-2 font-medium text-gray-800">{bw.bowler}</td>
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
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
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
          <div key={side} className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
                    <p className="text-sm font-medium text-gray-800 truncate">
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
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">{t('matchDetail.odds.notAvailable')}</p>
      </div>
    );
  }

  const bestHome = hasH2H ? Math.max(...comparison.map(o => o.home)) : 0;
  const bestAway = hasH2H ? Math.max(...comparison.map(o => o.away)) : 0;

  return (
    <div className="space-y-4">
      {/* Match Winner */}
      {hasH2H && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">{t('matchDetail.odds.oddsComparison')}</h3>
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Total Runs Over/Under</h3>
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

function PredictionTab({ match, prediction, loading, onGetPrediction }) {
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
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <RobotIcon className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">{t('matchDetail.prediction.aiMatchPrediction')}</h3>
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

  return (
    <div className="space-y-4">
      {/* Winner prediction */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">{t('matchDetail.prediction.predictedWinner')}</h3>
          <span className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{t('matchDetail.prediction.aiPrediction')}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
            style={{ background: winnerTeam.bg, color: winnerTeam.text }}>
            {winnerTeam.short}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-800">{winnerTeam.name || prediction.winner}</p>
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

      {/* Key factors */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('matchDetail.prediction.keyFactors')}</h3>
        <div className="space-y-2.5">
          {prediction.factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px]
                ${f.impact === 'positive' ? 'bg-green-100 text-green-600' :
                  f.impact === 'negative' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-500'}`}>
                {f.impact === 'positive' ? '+' : f.impact === 'negative' ? '-' : '~'}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">{f.label}</p>
                <p className="text-[11px] text-gray-400">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Value bets */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('matchDetail.prediction.valueBets')}</h3>
        <div className="space-y-2">
          {prediction.valueBets.map((bet, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">{bet.market}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                  ${bet.confidence === 'High' ? 'bg-green-100 text-green-700' :
                    bet.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'}`}>
                  {bet.confidence}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{bet.pick}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">@{bet.odds}</span>
                  <span className="text-xs font-bold text-green-600">{bet.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
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

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [scorecardFetched, setScorecardFetched] = useState(false);
  const [squad, setSquad] = useState(null);
  const [squadLoading, setSquadLoading] = useState(false);
  const [squadFetched, setSquadFetched] = useState(false);
  const [totals, setTotals] = useState(null);
  const [totalsFetched, setTotalsFetched] = useState(false);
  const { isPushEnabled, requestPermission, scheduleMatchReminder } = usePushNotifications();
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        const data = await api.getMatch(id);
        setMatch(data);
      } catch {
        setMatch(MOCK_MATCHES[id] || getDefaultMock(id));
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

  async function handleGetPrediction() {
    setPredictionLoading(true);
    try {
      const data = await api.getPrediction(id);
      setPrediction(data);
    } catch {
      // Используем мок для демонстрации
      await new Promise(r => setTimeout(r, 1500));
      setPrediction(MOCK_PREDICTION);
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
    squad: <SquadTab squad={squad} loading={squadLoading} match={match} />,
    venue: <VenueTab match={match} />,
    h2h: <H2HTab match={match} />,
    odds: <OddsTab match={match} totals={totals} />,
    prediction: <PredictionTab match={match} prediction={prediction} loading={predictionLoading} onGetPrediction={handleGetPrediction} />,
  };

  return (
    <div className="min-h-dvh bg-[#F0F2F5]">
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
        <div className="bg-white rounded-2xl shadow-sm p-1 flex gap-0.5 overflow-x-auto no-scrollbar">
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

      {/* Tab content */}
      <div className="px-4 mt-4 pb-8">
        {tabContent[activeTab]}
      </div>

      {/* Floating AI Analysis Button */}
      <button
        onClick={() => navigate(`/ai-chat?match=${match.home}-vs-${match.away}&id=${match.id}`)}
        className="fixed bottom-40 right-4 z-40 bg-[#FF9933] text-white px-4 py-3 rounded-2xl shadow-lg shadow-orange-200 flex items-center gap-2 active:scale-95 transition-transform ring-2 ring-[#138808]/20">
        <RobotIcon className="w-5 h-5" />
        <span className="text-sm font-semibold">{t('matchDetail.prediction.getAiPrediction')}</span>
      </button>

      <BookmakerBanner variant="sticky" />
      <BottomNav />
    </div>
  );
}
