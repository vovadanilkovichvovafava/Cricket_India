import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Determine text color (black or white) based on background luminance
function getTextColor(hex) {
  const c = (hex || '#6B7280').replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#000' : '#fff';
}

function formatMatchTime(dateStr, t) {
  const dt = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const matchDate = dt.toISOString().slice(0, 10);
  const time = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (matchDate === todayStr) return `${t('common.today')}, ${time}`;
  if (matchDate === tomorrowStr) return `${t('common.tomorrow')}, ${time}`;
  return `${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
}

function getMatchCountdown(dateStr) {
  const dt = new Date(dateStr);
  const now = new Date();
  const diff = dt - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return null; // "Starting soon" will be handled by the component with t()
}

// Check if prediction window is closing soon (< 2 hours)
function isUrgent(dateStr) {
  const dt = new Date(dateStr);
  const diff = dt - new Date();
  return diff > 0 && diff < 7200000; // less than 2 hours
}

// Get innings score for a team by matching team name in inning string
function getTeamInnings(scores, teamName) {
  if (!scores?.length || !teamName) return null;
  const name = teamName.toLowerCase();
  return scores.find(s => s.inning?.toLowerCase().includes(name)) || null;
}

// Compute implied probability from odds
function getOddsPoll(odds) {
  if (!odds?.home || !odds?.away) return null;
  const homeProb = 1 / odds.home;
  const awayProb = 1 / odds.away;
  const total = homeProb + awayProb;
  return {
    home: Math.round((homeProb / total) * 100),
    away: Math.round((awayProb / total) * 100),
  };
}

// Team badge — shows CricAPI logo if available, colored circle with code as fallback
function TeamBadge({ code, color = '#6B7280', img, size = 'sm' }) {
  const textColor = getTextColor(color);
  const cls = size === 'lg'
    ? 'w-14 h-14 text-sm'
    : size === 'md'
      ? 'w-10 h-10 text-[10px]'
      : 'w-6 h-6 text-[8px]';
  if (img) {
    return <img src={img} alt={code} className={`${cls} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-black shrink-0`}
      style={{ background: color, color: textColor }}
    >
      {code}
    </div>
  );
}

// Match type badge label
function matchTypeLabel(type) {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t === 't20' || t === 't20i') return 'T20';
  if (t === 'odi') return 'ODI';
  if (t === 'test') return 'TEST';
  return type.toUpperCase();
}

// Format score line: "180/5 (20 ov)"
function ScoreText({ innings, className = '' }) {
  if (!innings) return null;
  return (
    <span className={className}>
      {innings.runs}/{innings.wickets}
      <span className="text-[10px] opacity-60 ml-0.5">({innings.overs} ov)</span>
    </span>
  );
}

// --- Featured Match Banner (diagonal split + community poll + countdown) ---
export function FeaturedMatchCard({ match }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const homeColor = match.homeColor || '#6B7280';
  const awayColor = match.awayColor || '#6B7280';
  const homeText = getTextColor(homeColor);
  const awayText = getTextColor(awayColor);
  const timeLabel = formatMatchTime(match.date, t);
  const countdown = getMatchCountdown(match.date) || t('common.startingSoon');
  const poll = getOddsPoll(match.odds);
  const isLive = match.status === 'live';
  const hasScores = match.score?.length > 0;
  const homeInnings = getTeamInnings(match.score, match.homeName);
  const awayInnings = getTeamInnings(match.score, match.awayName);
  const voteCount = useMemo(() => Math.floor(((parseInt(match.id, 36) || 1) * 1337) % 3000 + 2500), [match.id]);

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      className="relative overflow-hidden rounded-2xl text-white shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Diagonal split background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ backgroundColor: homeColor, clipPath: 'polygon(0 0, 65% 0, 35% 100%, 0 100%)' }} />
        <div className="absolute inset-0" style={{ backgroundColor: awayColor, clipPath: 'polygon(65% 0, 100% 0, 100% 100%, 35% 100%)' }} />
        <div className="absolute inset-0 bg-white/25" style={{ clipPath: 'polygon(63% 0, 67% 0, 37% 100%, 33% 100%)' }} />
        <div className="absolute inset-0 bg-black/15" />
      </div>

      {/* Shine animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" style={{ animation: 'shine 6s infinite' }} />

      {/* Top bar — LIVE/Countdown + match type badge */}
      <div className="relative flex items-center justify-between px-4 pt-3 z-20">
        {isLive ? (
          <div className="flex items-center gap-1.5 bg-red-500/90 px-2.5 py-1 rounded-lg shadow-lg shadow-red-500/40 animate-pulse-glow">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-wide">{t('common.live')}</span>
          </div>
        ) : countdown ? (
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] font-bold text-white">{countdown}</span>
          </div>
        ) : (
          <div />
        )}
        <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
          {matchTypeLabel(match.matchType)}
        </span>
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between px-5 pt-2 pb-3 z-10" style={{ minHeight: '120px' }}>
        {/* Home team */}
        <div className="flex flex-col items-center gap-1.5 w-24">
          <div className="w-16 h-16 bg-white/90 rounded-xl p-1.5 flex items-center justify-center shadow-lg">
            {match.homeImg ? (
              <img src={match.homeImg} alt={match.home} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: homeColor, color: homeText }}
              >
                {match.home}
              </div>
            )}
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-white drop-shadow-lg block leading-tight">
              {match.home}
            </span>
            {hasScores && homeInnings ? (
              <span className="text-[11px] text-white/80 drop-shadow block font-semibold">
                {homeInnings.runs}/{homeInnings.wickets}
              </span>
            ) : (
              <span className="text-[10px] text-white/60 drop-shadow block truncate max-w-[80px]">
                {match.homeName}
              </span>
            )}
          </div>
        </div>

        {/* Center — VS + Odds */}
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-white/80 font-bold text-xs mb-2 drop-shadow">VS</span>
          {match.odds?.home && match.odds?.away ? (
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center min-w-[48px]">
                <p className="text-white/60 text-[8px] font-medium uppercase">{match.home}</p>
                <p className="text-white text-lg font-black leading-none">{match.odds.home}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center min-w-[48px]">
                <p className="text-white/60 text-[8px] font-medium uppercase">{match.away}</p>
                <p className="text-white text-lg font-black leading-none">{match.odds.away}</p>
              </div>
            </div>
          ) : (
            <div className="mb-2" />
          )}
          <span className="text-white/60 text-[10px] font-medium">{timeLabel}</span>
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-1.5 w-24">
          <div className="w-16 h-16 bg-white/90 rounded-xl p-1.5 flex items-center justify-center shadow-lg">
            {match.awayImg ? (
              <img src={match.awayImg} alt={match.away} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: awayColor, color: awayText }}
              >
                {match.away}
              </div>
            )}
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-white drop-shadow-lg block leading-tight">
              {match.away}
            </span>
            {hasScores && awayInnings ? (
              <span className="text-[11px] text-white/80 drop-shadow block font-semibold">
                {awayInnings.runs}/{awayInnings.wickets}
              </span>
            ) : (
              <span className="text-[10px] text-white/60 drop-shadow block truncate max-w-[80px]">
                {match.awayName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Community Poll Bar — only show if odds available */}
      {poll && (
        <div className="relative z-10 mx-4 mb-3">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/70 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {t('matchCard.communityPick')}
              </span>
              <span className="text-[10px] text-white/50">{voteCount.toLocaleString()} votes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white w-8">{poll.home}%</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-l-full animate-poll-fill"
                  style={{ '--poll-width': `${poll.home}%`, width: `${poll.home}%`, backgroundColor: homeColor, filter: 'brightness(1.3)' }}
                />
                <div
                  className="h-full rounded-r-full"
                  style={{ width: `${poll.away}%`, backgroundColor: awayColor, filter: 'brightness(1.3)' }}
                />
              </div>
              <span className="text-[11px] font-bold text-white w-8 text-right">{poll.away}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Urgency banner on featured card */}
      {!isLive && match.status !== 'completed' && isUrgent(match.date) && (
        <div className="relative z-10 mx-4 mb-2">
          <div className="bg-amber-400/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 text-amber-900 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
            </svg>
            <span className="text-[11px] text-amber-900 font-bold">{t('matchCard.predictionClosing')}</span>
            <span className="text-[11px] text-amber-900 font-black">— {t('matchCard.lockIn')} →</span>
          </div>
        </div>
      )}

      {/* Status text for completed matches */}
      {match.status === 'completed' && match.statusText && (
        <div className="relative z-10 mx-4 mb-3">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center">
            <span className="text-[11px] text-white/80 font-medium">{match.statusText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Compact match card (list item with team color accent) ---
export default function MatchCard({ match }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const homeColor = match.homeColor || '#6B7280';
  const awayColor = match.awayColor || '#6B7280';
  const timeLabel = formatMatchTime(match.date, t);
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const hasScores = match.score?.length > 0;
  const homeInnings = getTeamInnings(match.score, match.homeName);
  const awayInnings = getTeamInnings(match.score, match.awayName);
  // Fallback: if we couldn't match by name, use score order
  const homeScore = homeInnings || (hasScores ? match.score[0] : null);
  const awayScore = awayInnings || (hasScores && match.score.length > 1 ? match.score[1] : null);

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      className="bg-white cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 relative overflow-hidden"
    >
      {/* Team color accent stripe — left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{
        background: isLive
          ? '#EF4444'
          : `linear-gradient(to bottom, ${homeColor} 50%, ${awayColor} 50%)`
      }} />

      <div className="flex items-center py-3 pl-4 pr-3">
        {/* Teams column */}
        <div className="flex-1 min-w-0">
          {/* Home team row */}
          <div className="flex items-center gap-2 mb-1.5">
            <TeamBadge code={match.home} color={homeColor} img={match.homeImg} />
            <span className="text-sm font-medium text-gray-900 min-w-[28px]">{match.home}</span>
            {hasScores && homeScore ? (
              <ScoreText innings={homeScore} className="text-sm font-bold text-gray-900 ml-auto tabular-nums" />
            ) : (
              <span className="text-[11px] text-gray-400 truncate">{match.homeName}</span>
            )}
          </div>
          {/* Away team row */}
          <div className="flex items-center gap-2">
            <TeamBadge code={match.away} color={awayColor} img={match.awayImg} />
            <span className="text-sm font-medium text-gray-900 min-w-[28px]">{match.away}</span>
            {hasScores && awayScore ? (
              <ScoreText innings={awayScore} className="text-sm font-bold text-gray-900 ml-auto tabular-nums" />
            ) : (
              <span className="text-[11px] text-gray-400 truncate">{match.awayName}</span>
            )}
          </div>
        </div>

        {/* Odds column — only for upcoming with odds */}
        {match.odds?.home && match.odds?.away && !hasScores && (
          <div className="flex gap-1 mr-2 flex-shrink-0">
            {[
              { label: '1', val: match.odds.home },
              { label: '2', val: match.odds.away },
            ].map(o => (
              <div
                key={o.label}
                className="bg-[#0B1E4D]/5 border border-[#0B1E4D]/10 rounded px-2 py-1 text-center min-w-[38px]"
              >
                <span className="text-[9px] text-[#0B1E4D]/40 font-medium block leading-tight">{o.label}</span>
                <span className="text-[11px] text-[#0B1E4D] font-bold block leading-tight">{o.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Time/Status column */}
        <div className="flex-shrink-0 text-right ml-1">
          {isLive ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-red-500 font-bold">{t('common.live')}</span>
            </div>
          ) : isCompleted ? (
            <span className="text-[10px] text-gray-400 font-medium">{t('common.ft')}</span>
          ) : (
            <div className="text-right">
              <span className="text-[11px] text-gray-400 font-medium block">{timeLabel}</span>
              {match.matchType && (
                <span className="text-[9px] text-gray-300 font-medium">{matchTypeLabel(match.matchType)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Urgency banner — prediction closing soon */}
      {!isLive && !isCompleted && isUrgent(match.date) && (
        <div className="mx-3 mb-2 -mt-0.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] text-amber-700 font-semibold">{t('matchCard.predictionClosing')}</span>
          <span className="ml-auto text-[10px] text-[#FF9933] font-bold">{t('matchCard.lockIn')} →</span>
        </div>
      )}

      {/* Status text for completed matches */}
      {isCompleted && match.statusText && (
        <div className="px-4 pb-2 -mt-1">
          <span className="text-[10px] text-gray-400">{match.statusText}</span>
        </div>
      )}
    </div>
  );
}
