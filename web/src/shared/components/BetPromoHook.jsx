import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function BetPromoHook({ onCtaClick }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(() => {
    const key = 'betHookTimerStart';
    let start = localStorage.getItem(key);
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem(key, start);
    }
    const elapsed = Date.now() - parseInt(start);
    return Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      const start = parseInt(localStorage.getItem('betHookTimerStart') || '0');
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-[#FF9933]/30 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF9933] to-[#FF8800] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎁</span>
          <span className="text-sm font-bold text-white">{t('betHook.specialBonus')}</span>
        </div>
        <span className="text-[10px] font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full">{t('betHook.hurryUp')}</span>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-gray-800 px-4 py-3.5">
        {/* Timer */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="text-[10px] text-gray-400 font-medium mr-1">{t('betHook.timeLeft')}:</span>
          <div className="bg-[#0F2744] rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
            <span className="text-lg font-black text-white tabular-nums">{String(hours).padStart(2, '0')}</span>
            <span className="text-[8px] text-white/50 ml-0.5">{t('betHook.hours')}</span>
          </div>
          <span className="text-lg font-bold text-gray-300">:</span>
          <div className="bg-[#0F2744] rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
            <span className="text-lg font-black text-white tabular-nums">{String(minutes).padStart(2, '0')}</span>
            <span className="text-[8px] text-white/50 ml-0.5">{t('betHook.minutes')}</span>
          </div>
          <span className="text-lg font-bold text-gray-300">:</span>
          <div className="bg-[#0F2744] rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
            <span className="text-lg font-black text-[#FF9933] tabular-nums">{String(seconds).padStart(2, '0')}</span>
            <span className="text-[8px] text-white/50 ml-0.5">{t('betHook.seconds')}</span>
          </div>
        </div>

        {/* Bonus amount */}
        <div className="bg-gradient-to-r from-[#0F2744] to-[#1B3A5C] rounded-xl p-3.5 mb-3 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#FF9933]/10" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="text-3xl font-black text-[#FF9933]">{t('betHook.freeBetAmount')}</div>
            <div className="flex-1">
              <div className="text-[11px] text-white/70 leading-snug">{t('betHook.freeBetDesc')}</div>
            </div>
            <span className="text-[9px] font-bold text-[#1DAA61] border border-[#1DAA61]/40 rounded-md px-2 py-1 uppercase">{t('betHook.zeroRisk')}</span>
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={onCtaClick}
          className="w-full flex items-center justify-center gap-2 bg-[#FF9933] text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-orange-200/40 active:scale-[0.98] transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          {t('betHook.claimBonus')}
        </button>

        {/* Limited offer note */}
        <p className="text-[10px] text-gray-400 text-center mt-2">{t('betHook.limitedOffer')}</p>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            {t('betHook.secure')}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {t('betHook.licensed')}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            4.9/5
          </span>
          <span className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {t('betHook.withdraw15min')}
          </span>
        </div>
      </div>
    </div>
  );
}
