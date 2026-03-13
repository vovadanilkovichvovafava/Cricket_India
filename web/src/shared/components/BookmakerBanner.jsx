import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ENV } from '../config/env';
import { usePremium } from '../context/PremiumContext';

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
  return { h, m, s, timeLeft };
}

function TimerDisplay({ h, m, s, t }) {
  return (
    <div className="flex items-center gap-1">
      <div className="bg-white/10 rounded px-1.5 py-0.5 text-center">
        <span className="text-sm font-black text-white tabular-nums">{String(h).padStart(2, '0')}</span>
        <span className="text-[7px] text-white/50 ml-0.5">{t('bannerTimer.hours')}</span>
      </div>
      <span className="text-sm font-bold text-white/40">:</span>
      <div className="bg-white/10 rounded px-1.5 py-0.5 text-center">
        <span className="text-sm font-black text-white tabular-nums">{String(m).padStart(2, '0')}</span>
        <span className="text-[7px] text-white/50 ml-0.5">{t('bannerTimer.minutes')}</span>
      </div>
      <span className="text-sm font-bold text-white/40">:</span>
      <div className="bg-white/10 rounded px-1.5 py-0.5 text-center">
        <span className="text-sm font-black text-[#FF9933] tabular-nums">{String(s).padStart(2, '0')}</span>
        <span className="text-[7px] text-white/50 ml-0.5">{t('bannerTimer.seconds')}</span>
      </div>
    </div>
  );
}

function HeroBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPro } = usePremium();
  const { h, m, s } = useCountdown();

  if (isPro) return null;

  return (
    <div
      onClick={() => navigate('/offer')}
      className="block bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl p-5 text-white shadow-lg active:scale-[0.98] transition-transform overflow-hidden relative cursor-pointer"
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-[shimmerBg_3s_ease-in-out_infinite]" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <span className="text-xs text-[#FF9933] font-bold uppercase tracking-wide">{t('banner.giftForYou')}</span>
          </div>
          <TimerDisplay h={h} m={m} s={s} t={t} />
        </div>

        <h3 className="text-xl font-bold mb-1">{t('banner.thanksForReg')}</h3>
        <p className="text-blue-200/70 text-sm mb-4">{t('banner.freebetAndPro')}</p>

        <div className="flex items-center justify-between">
          <div className="bg-[#FF9933] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-[#FF9933]/30">
            {t('banner.claimGift')}
          </div>
          <span className="text-[10px] text-blue-300/50">{t('banner.disclaimer')}</span>
        </div>
      </div>
    </div>
  );
}

function InlineBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPro } = usePremium();

  if (isPro) return null;

  return (
    <div
      onClick={() => navigate('/offer')}
      className="block bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm border-l-4 border-[#FF9933] active:scale-[0.98] transition-transform my-4 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">🎁</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {t('banner.freebetAndPro')}
          </p>
          <p className="text-[10px] text-gray-400">{t('banner.claimGift')}</p>
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

  if (dismissed || isPro) return null;

  const { t } = useTranslation();
  const navigate = useNavigate();

  function handleDismiss(e) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem('banner_dismissed', '1'); } catch {}
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-2 safe-bottom">
      <div
        onClick={() => navigate('/offer')}
        className="flex items-center justify-between bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] text-white rounded-xl px-4 py-3 shadow-xl cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🎁</span>
          <div>
            <p className="text-sm font-bold">{t('banner.freebetAndPro')}</p>
            <p className="text-[10px] text-blue-200/60">{t('banner.disclaimer')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#FF9933] text-white font-bold px-3 py-1.5 rounded-lg text-xs">
            {t('banner.claimGift')}
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
