import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ENV } from '../config/env';
import { usePremium } from '../context/PremiumContext';
import { useAuth } from '../../features/auth/context/AuthContext';
import { trackBannerClick } from '../../features/betting/services/trackingService';

// Shared 24h countdown hook
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const key = 'bannerTimerStart';
    let start = localStorage.getItem(key);
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem(key, start);
    }
    return Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - parseInt(start)));
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      const start = parseInt(localStorage.getItem('bannerTimerStart') || '0');
      const remaining = Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - start));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(timeLeft / (1000 * 60 * 60));
  const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

  // Urgency phase: 'calm' (>16h), 'warning' (4-16h), 'critical' (<4h)
  let phase = 'calm';
  if (timeLeft <= 4 * 60 * 60 * 1000) phase = 'critical';
  else if (timeLeft <= 16 * 60 * 60 * 1000) phase = 'warning';

  return { h, m, s, timeLeft, phase };
}

// Phase-based styles
const PHASE_STYLES = {
  calm: {
    card: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
    shimmer: 'via-white/5',
    tagColor: 'text-[#FF9933]',
    subText: 'text-blue-200/70',
    timerBg: 'bg-white/10',
    timerText: 'text-white',
    timerSeconds: 'text-[#FF9933]',
    timerLabel: 'text-white/50',
    timerSep: 'text-white/40',
    btnBg: 'bg-[#FF9933] shadow-[#FF9933]/30',
    disclaimer: 'text-blue-300/50',
    icon: '🎁',
  },
  warning: {
    card: 'from-[#7B3F00] via-[#CC7722] to-[#FF9933]',
    shimmer: 'via-white/10',
    tagColor: 'text-yellow-100',
    subText: 'text-yellow-100/80',
    timerBg: 'bg-black/20',
    timerText: 'text-white',
    timerSeconds: 'text-yellow-200',
    timerLabel: 'text-white/60',
    timerSep: 'text-white/50',
    btnBg: 'bg-white shadow-white/20 !text-[#CC7722]',
    disclaimer: 'text-yellow-100/50',
    icon: '⏳',
  },
  critical: {
    card: 'from-[#8B0000] via-[#CC0000] to-[#FF1A1A]',
    shimmer: 'via-white/15',
    tagColor: 'text-red-100',
    subText: 'text-red-100/80',
    timerBg: 'bg-black/30',
    timerText: 'text-white',
    timerSeconds: 'text-yellow-300',
    timerLabel: 'text-white/60',
    timerSep: 'text-white/50',
    btnBg: 'bg-white shadow-white/30 !text-red-600',
    disclaimer: 'text-red-200/50',
    icon: '🔥',
  },
};

function TimerDisplay({ h, m, s, t, phase }) {
  const ps = PHASE_STYLES[phase];
  return (
    <div className="flex items-center gap-1">
      <div className={`${ps.timerBg} rounded px-1.5 py-0.5 text-center`}>
        <span className={`text-sm font-black ${ps.timerText} tabular-nums`}>{String(h).padStart(2, '0')}</span>
        <span className={`text-[7px] ${ps.timerLabel} ml-0.5`}>{t('bannerTimer.hours')}</span>
      </div>
      <span className={`text-sm font-bold ${ps.timerSep}`}>:</span>
      <div className={`${ps.timerBg} rounded px-1.5 py-0.5 text-center`}>
        <span className={`text-sm font-black ${ps.timerText} tabular-nums`}>{String(m).padStart(2, '0')}</span>
        <span className={`text-[7px] ${ps.timerLabel} ml-0.5`}>{t('bannerTimer.minutes')}</span>
      </div>
      <span className={`text-sm font-bold ${ps.timerSep}`}>:</span>
      <div className={`${ps.timerBg} rounded px-1.5 py-0.5 text-center`}>
        <span className={`text-sm font-black ${ps.timerSeconds} tabular-nums ${phase === 'critical' ? 'animate-pulse' : ''}`}>{String(s).padStart(2, '0')}</span>
        <span className={`text-[7px] ${ps.timerLabel} ml-0.5`}>{t('bannerTimer.seconds')}</span>
      </div>
    </div>
  );
}

function HeroBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPro } = usePremium();
  const { user } = useAuth();
  const { h, m, s, phase, timeLeft } = useCountdown();
  const name = user?.name?.split(' ')[0] || '';

  if (isPro) return null;
  if (timeLeft <= 0) return null;

  const ps = PHASE_STYLES[phase];

  return (
    <div
      onClick={() => { trackBannerClick('hero_banner', 'home'); navigate('/offer'); }}
      className={`block bg-gradient-to-r ${ps.card} rounded-2xl p-5 text-white shadow-lg active:scale-[0.98] transition-all overflow-hidden relative cursor-pointer ${phase === 'critical' ? 'ring-2 ring-red-400/60 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900' : ''}`}
    >
      {/* Shine overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${ps.shimmer} to-transparent -skew-x-12 animate-[shimmerBg_3s_ease-in-out_infinite]`} />

      {/* Critical: pulsing red glow */}
      {phase === 'critical' && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse rounded-2xl" />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ps.icon}</span>
            <span className={`text-xs ${ps.tagColor} font-bold uppercase tracking-wide`}>
              {phase === 'critical' ? t('banner.lastChance') : phase === 'warning' ? t('banner.hurryUp') : t('banner.giftForYou')}
            </span>
          </div>
          <TimerDisplay h={h} m={m} s={s} t={t} phase={phase} />
        </div>

        <h3 className="text-xl font-bold mb-1">
          {phase === 'critical'
            ? t('banner.bonusDisappearing', { name })
            : name
              ? t('banner.thanksForRegName', { name })
              : t('banner.thanksForReg')}
        </h3>
        <p className={`${ps.subText} text-sm mb-4`}>
          {phase === 'critical' ? t('banner.lastChanceDesc') : t('banner.freebetAndPro')}
        </p>

        <div className="flex items-center justify-between">
          <div className={`${ps.btnBg} font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg`}>
            {phase === 'critical' ? t('banner.claimNow') : t('banner.claimGift')}
          </div>
          <span className={`text-[10px] ${ps.disclaimer}`}>{t('banner.disclaimer')}</span>
        </div>
      </div>
    </div>
  );
}

function InlineBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPro } = usePremium();
  const { phase, timeLeft } = useCountdown();

  if (isPro) return null;
  if (timeLeft <= 0) return null;

  const borderColor = phase === 'critical' ? 'border-red-500' : phase === 'warning' ? 'border-amber-500' : 'border-[#FF9933]';
  const icon = PHASE_STYLES[phase].icon;

  return (
    <div
      onClick={() => { trackBannerClick('inline_banner', 'matches'); navigate('/offer'); }}
      className={`block bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm border-l-4 ${borderColor} active:scale-[0.98] transition-transform my-4 cursor-pointer`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${phase === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'} truncate`}>
            {phase === 'critical' ? t('banner.bonusDisappearing') : t('banner.freebetAndPro')}
          </p>
          <p className="text-[10px] text-gray-400">
            {phase === 'critical' ? t('banner.claimNow') : t('banner.claimGift')}
          </p>
        </div>
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  );
}

function StickyBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('banner_dismissed') === '1'; } catch { return false; }
  });
  const { isPro } = usePremium();
  const { h, m, s, phase, timeLeft } = useCountdown();

  if (dismissed || isPro) return null;
  if (timeLeft <= 0) return null;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const ps = PHASE_STYLES[phase];

  function handleDismiss(e) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem('banner_dismissed', '1'); } catch {}
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-2 safe-bottom">
      <div
        onClick={() => { trackBannerClick('sticky_banner', 'global'); navigate('/offer'); }}
        className={`flex items-center justify-between bg-gradient-to-r ${ps.card} text-white rounded-xl px-4 py-3 shadow-xl cursor-pointer ${phase === 'critical' ? 'animate-pulse' : ''}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{ps.icon}</span>
          <div>
            <p className="text-sm font-bold">
              {phase === 'critical' ? t('banner.bonusDisappearing') : t('banner.freebetAndPro')}
            </p>
            <p className={`text-[10px] ${ps.disclaimer}`}>{t('banner.disclaimer')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${phase === 'critical' ? 'bg-white text-red-600' : 'bg-[#FF9933] text-white'} font-bold px-3 py-1.5 rounded-lg text-xs`}>
            {phase === 'critical' ? t('banner.claimNow') : t('banner.claimGift')}
          </span>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center text-blue-300/50 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookmakerBanner({ variant = 'hero' }) {
  if (variant === 'hero') return <HeroBanner />;
  if (variant === 'inline') return <InlineBanner />;
  if (variant === 'sticky') return <StickyBanner />;
  return null;
}
