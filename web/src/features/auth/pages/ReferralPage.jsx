import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../../../shared/api';
import { ShareIcon, UsersIcon, GiftIcon } from '../../../shared/components/Icons';
import BottomNav from '../../../shared/components/BottomNav';
import TricolorBar from '../../../shared/components/TricolorBar';

export default function ReferralPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    api.getReferral()
      .then(data => setReferral(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const referralCode = referral?.referral_code || user?.referral_code || '';
  const referralCount = referral?.referral_count ?? user?.referral_count ?? 0;
  const referralLink = referral?.referral_link || `${window.location.origin}/login?ref=${referralCode}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleWhatsAppShare() {
    const text = t('referral.whatsappMessage', {
      code: referralCode,
      link: referralLink,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleTelegramShare() {
    const text = t('referral.telegramMessage', {
      code: referralCode,
      link: referralLink,
    });
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({
        title: 'CricketBaazi',
        text: t('referral.shareText', { code: referralCode }),
        url: referralLink,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  }

  // Milestone tiers
  const milestones = [
    { count: 3, reward: t('referral.milestone1') },
    { count: 10, reward: t('referral.milestone2') },
    { count: 25, reward: t('referral.milestone3') },
  ];

  const nextMilestone = milestones.find(m => referralCount < m.count) || milestones[milestones.length - 1];
  const progress = Math.min((referralCount / nextMilestone.count) * 100, 100);

  return (
    <div className="min-h-dvh bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B1E4D] via-[#162D6B] to-[#1A357A] text-white px-5 pt-6 pb-8 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF9933]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#138808]/10 rounded-full blur-2xl" />

        <div className="flex items-center gap-3 mb-5 relative z-10">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{t('referral.title')}</h1>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-[#FF9933]">{referralCount}</p>
            <p className="text-xs text-blue-200/70 mt-1">{t('referral.friendsJoined')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-400">{referralCount * 3}</p>
            <p className="text-xs text-blue-200/70 mt-1">{t('referral.bonusPicks')}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4 pb-6">
        {/* Referral Code Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('referral.yourCode')}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 border-2 border-dashed border-[#FF9933]/30 rounded-xl px-4 py-3 text-center">
              <span className="text-2xl font-black text-[#0B1E4D] tracking-[0.2em] font-mono">
                {loading ? '...' : referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="w-12 h-12 bg-[#FF9933]/10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              {copied ? (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">{t('referral.shareWith')}</p>
          <div className="grid grid-cols-3 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-2 py-3 bg-[#25D366]/10 rounded-xl active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-[#25D366]">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegramShare}
              className="flex flex-col items-center gap-2 py-3 bg-[#0088CC]/10 rounded-xl active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-[#0088CC] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-[#0088CC]">Telegram</span>
            </button>

            {/* Share/Copy Link */}
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center gap-2 py-3 bg-[#0B1E4D]/5 rounded-xl active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-[#0B1E4D] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-[#0B1E4D]">{t('referral.shareLink')}</span>
            </button>
          </div>

          {/* Copy link full */}
          <button
            onClick={handleCopyLink}
            className="w-full mt-3 py-3 bg-gradient-to-r from-[#FF9933] to-[#FF8800] text-white font-bold rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {t('referral.copied')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.03a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.25 9.375" />
                </svg>
                {t('referral.copyLink')}
              </>
            )}
          </button>
        </div>

        {/* Progress to milestone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('referral.milestoneTitle')}</p>
            <span className="text-xs text-[#FF9933] font-semibold">{referralCount}/{nextMilestone.count}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#FF9933] to-[#FF8800] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  referralCount >= m.count
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {referralCount >= m.count ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : m.count}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-700">{m.count} {t('referral.friends')}</span>
                </div>
                <span className={`text-xs font-semibold ${referralCount >= m.count ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {m.reward}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">{t('referral.howItWorks')}</p>
          <div className="space-y-3">
            {[
              { step: '1', icon: <ShareIcon className="w-4 h-4 text-[#FF9933]" />, text: t('referral.step1') },
              { step: '2', icon: <UsersIcon className="w-4 h-4 text-[#FF9933]" />, text: t('referral.step2') },
              { step: '3', icon: <GiftIcon className="w-4 h-4 text-[#FF9933]" />, text: t('referral.step3') },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FF9933]/10 rounded-full flex items-center justify-center">
                  {s.icon}
                </div>
                <p className="text-sm text-gray-600 flex-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <TricolorBar />
      </div>

      <BottomNav />
    </div>
  );
}
