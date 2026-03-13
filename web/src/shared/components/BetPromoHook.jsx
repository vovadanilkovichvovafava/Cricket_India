import { useTranslation } from 'react-i18next';

export default function BetPromoHook({ matchContext, confidence, onCtaClick }) {
  const { t } = useTranslation();
  const matchName = matchContext || 'IPL Match';
  const conf = confidence || 74;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-[#0F2744] to-[#1B3A5C] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1DAA61] animate-pulse" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{t('betHook.exclusive')}</span>
        </div>
        <span className="text-[9px] font-bold text-[#FF9933] bg-[#FF9933]/15 px-2.5 py-0.5 rounded-full uppercase">{t('betHook.onlyNow')}</span>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-gray-800 px-4 py-3.5">
        {/* AI analysis context */}
        <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: t('betHook.aiAnalyzed', { match: matchName, confidence: conf }) }} />

        {/* Free bet card */}
        <div className="bg-gradient-to-r from-[#0F2744] to-[#1B3A5C] rounded-xl p-3.5 mb-3 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#FF9933]/10" />
          <div className="flex items-center gap-3 relative z-10">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-0.5">{t('betHook.freeBet')}</div>
              <div className="text-xl font-black text-[#FF9933]">{t('betHook.freeBetAmount')}</div>
              <div className="text-[11px] text-white/60 mt-0.5 leading-snug">{t('betHook.freeBetDesc')}</div>
            </div>
            <span className="text-[9px] font-bold text-[#1DAA61] border border-[#1DAA61]/40 rounded-md px-2 py-1 uppercase">{t('betHook.zeroRisk')}</span>
          </div>
        </div>

        {/* Steps flow */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-[#1DAA61] text-white text-[11px] font-bold flex items-center justify-center">1</div>
            <span className="text-[9px] text-gray-500 font-medium">{t('betHook.flowRegister')}</span>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-[#1DAA61] text-white text-[11px] font-bold flex items-center justify-center">2</div>
            <span className="text-[9px] text-gray-500 font-medium">{t('betHook.flowGetBonus')}</span>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-[#2B7AE8] text-white text-[11px] font-bold flex items-center justify-center">3</div>
            <span className="text-[9px] text-gray-500 font-medium">{t('betHook.flowBet')}</span>
          </div>
        </div>

        {/* Auto-bonus note */}
        <p className="text-[10px] text-gray-400 text-center mb-3">{t('betHook.autoBonus')}</p>

        {/* CTA button */}
        <button
          onClick={onCtaClick}
          className="w-full flex items-center justify-center gap-2 bg-[#FF9933] text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-orange-200/40 active:scale-[0.98] transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          {t('betHook.ctaBtn')}
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-2.5">
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
