import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENV } from '../config/env';

const AFFILIATE_LINK = 'https://siteofficialred.com/Qhs6z2nP?external_id={external_id}&sub_id_1={sub_id_1}&sub_id_2={sub_id_2}&sub_id_3={sub_id_3}&sub_id_4={sub_id_4}&sub_id_5={sub_id_5}&sub_id_6={sub_id_6}&sub_id_7={sub_id_7}&sub_id_8={sub_id_8}&sub_id_9={sub_id_9}&sub_id_10={sub_id_10}&sub_id_11={sub_id_11}&sub_id_12={sub_id_12}&sub_id_13={sub_id_13}&sub_id_14={sub_id_14}&sub_id_15={sub_id_15}&sub_id_16={sub_id_16}';

function getBannerLink() {
  const base = ENV.BOOKMAKER_LINK !== '#' ? ENV.BOOKMAKER_LINK : AFFILIATE_LINK;
  return base
    .replace('{external_id}', 'cricketbaazi')
    .replace(/\{sub_id_\d+\}/g, '');
}

function HeroBanner() {
  const { t } = useTranslation();
  const link = getBannerLink();
  const name = ENV.BOOKMAKER_NAME;
  const bonus = ENV.BOOKMAKER_BONUS || t('banner.welcomeBonus');

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl p-5 text-white shadow-lg active:scale-[0.98] transition-transform overflow-hidden relative"
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-[shimmerBg_3s_ease-in-out_infinite]" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-[#FF9933]/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs text-blue-300 font-medium uppercase tracking-wide">{t('banner.sponsoredShort')}</span>
        </div>

        <h3 className="text-xl font-bold mb-1">{bonus}</h3>
        <p className="text-blue-200/70 text-sm mb-4">{t('banner.startBetting', { name })}</p>

        <div className="flex items-center justify-between">
          <div className="bg-[#FF9933] text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-[#FF9933]/30">
            {ENV.BOOKMAKER_CTA || t('banner.claimBonus')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
          <span className="text-[10px] text-blue-300/50">{t('banner.disclaimer')}</span>
        </div>
      </div>
    </a>
  );
}

function InlineBanner() {
  const { t } = useTranslation();
  const link = getBannerLink();
  const bonus = ENV.BOOKMAKER_BONUS || t('banner.welcomeBonus');

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl p-3.5 shadow-sm border-l-4 border-[#FF9933] active:scale-[0.98] transition-transform my-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#FF9933]/10 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {t('banner.betWithKnowledge')} — {bonus}
          </p>
          <p className="text-[10px] text-gray-400">{t('banner.sponsored')}</p>
        </div>
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </a>
  );
}

function StickyBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('banner_dismissed') === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const { t } = useTranslation();
  const link = getBannerLink();
  const name = ENV.BOOKMAKER_NAME;

  function handleDismiss(e) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem('banner_dismissed', '1'); } catch {}
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 px-4 pb-2 safe-bottom">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] text-white rounded-xl px-4 py-3 shadow-xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#FF9933]/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold">{t('banner.placeBet', { name })}</p>
            <p className="text-[10px] text-blue-200/60">{t('banner.disclaimer')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#FF9933] text-white font-bold px-3 py-1.5 rounded-lg text-xs">
            {t('banner.betNow')}
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
      </a>
    </div>
  );
}

export default function BookmakerBanner({ variant = 'hero' }) {
  if (variant === 'hero') return <HeroBanner />;
  if (variant === 'inline') return <InlineBanner />;
  if (variant === 'sticky') return <StickyBanner />;
  return null;
}
