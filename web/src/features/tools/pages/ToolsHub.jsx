import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../../../shared/context/PremiumContext';
import BottomNav from '../../../shared/components/BottomNav';
import { CalculatorIcon, RefreshIcon, CricketBatIcon, ChartIcon, RocketIcon, SparkleIcon, UserIcon } from '../../../shared/components/Icons';
import TricolorBar from '../../../shared/components/TricolorBar';

const TOOLS = [
  {
    key: 'kelly',
    toolId: 'kelly',
    IconComp: CalculatorIcon,
    path: '/tools/kelly',
    color: 'from-orange-500 to-amber-500',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    key: 'odds',
    toolId: 'odds',
    IconComp: RefreshIcon,
    path: '/tools/odds',
    color: 'from-blue-500 to-indigo-500',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    key: 'betCalc',
    toolId: 'betCalc',
    IconComp: CalculatorIcon,
    path: '/tools/bet-calc',
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    key: 'glossary',
    toolId: 'glossary',
    IconComp: CricketBatIcon,
    path: '/tools/glossary',
    color: 'from-purple-500 to-violet-500',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    key: 'tracker',
    toolId: 'tracker',
    IconComp: ChartIcon,
    path: '/tools/tracker',
    color: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    free: true, // always free
  },
  {
    key: 'players',
    toolId: 'players',
    IconComp: UserIcon,
    path: '/tools/players',
    color: 'from-cyan-500 to-sky-500',
    bgLight: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    free: true, // always free
  },
];

export default function ToolsHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPro, canUseTool, useToolTrial } = usePremium();

  function handleToolClick(tool) {
    if (tool.free || isPro || canUseTool(tool.toolId)) {
      if (!isPro && !tool.free) useToolTrial(tool.toolId);
      navigate(tool.path);
    }
    // If trial used and not pro — do nothing (card shows "Pro Only")
  }

  return (
    <div className="min-h-dvh bg-[#F0F2F5] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] px-5 pt-6 pb-8">
        <h1 className="text-xl font-bold text-white">{t('toolsHub.title')}</h1>
        <p className="text-blue-200/60 text-xs mt-1">{t('toolsHub.subtitle')}</p>
      </div>

      <div className="px-5 -mt-4 pb-6">
        {/* Premium Card */}
        {!isPro ? (
          <div className="mb-4 bg-gradient-to-br from-[#FF9933] via-[#FF8800] to-[#E67300] rounded-2xl p-5 shadow-lg relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <RocketIcon className="w-7 h-7 text-white" />
                <h2 className="text-lg font-black text-white">{t('premium.getPro')}</h2>
              </div>
              <p className="text-white/90 text-sm font-medium mb-3">{t('premium.unlockAll')}</p>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/95 text-sm">{t('premium.unlimitedAi')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/95 text-sm">{t('premium.allTools')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/95 text-sm">{t('premium.prioritySupport')}</span>
                </div>
              </div>

              <p className="text-white/80 text-xs mb-3">{t('premium.upgradeDesc')}</p>
              <button
                onClick={() => navigate('/pro')}
                className="block w-full bg-white text-[#FF8800] font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-transform shadow-md text-center"
              >
                {t('premium.upgradeNow')} →
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <SparkleIcon className="w-5 h-5 text-yellow-300" />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{t('premium.proActive')}</p>
              <p className="text-white/80 text-[11px]">{t('premium.unlimited')}</p>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-lg">PRO</span>
          </div>
        )}

        {/* Tools grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(tool => {
            const available = tool.free || isPro || canUseTool(tool.toolId);
            return (
              <button
                key={tool.key}
                onClick={() => handleToolClick(tool)}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-left transition-transform relative ${
                  available ? 'active:scale-[0.97]' : 'opacity-75'
                }`}
              >
                {/* Badge */}
                {!isPro && !tool.free && (
                  <div className="absolute top-2.5 right-2.5">
                    {available ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
                        {t('premium.trialAvailable')}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-500 flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        {t('premium.trialUsed')}
                      </span>
                    )}
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3`}>
                  <tool.IconComp className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {t(`toolsHub.tools.${tool.key}.name`)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                  {t(`toolsHub.tools.${tool.key}.desc`)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Info card */}
        <div className="mt-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('toolsHub.tipTitle')}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t('toolsHub.tipDesc')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <TricolorBar className="mb-3" />
          <p className="text-center text-[10px] text-gray-400">{t('app.responsibleGaming')}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
