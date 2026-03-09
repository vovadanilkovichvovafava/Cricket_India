import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from '../../../shared/components/BottomNav';
import { CalculatorIcon, RefreshIcon, CricketBatIcon } from '../../../shared/components/Icons';
import TricolorBar from '../../../shared/components/TricolorBar';

const TOOLS = [
  {
    key: 'kelly',
    IconComp: CalculatorIcon,
    path: '/tools/kelly',
    color: 'from-orange-500 to-amber-500',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    key: 'odds',
    IconComp: RefreshIcon,
    path: '/tools/odds',
    color: 'from-blue-500 to-indigo-500',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    key: 'betCalc',
    IconComp: CalculatorIcon,
    path: '/tools/bet-calc',
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    key: 'glossary',
    IconComp: CricketBatIcon,
    path: '/tools/glossary',
    color: 'from-purple-500 to-violet-500',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
];

export default function ToolsHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] px-5 pt-6 pb-8">
        <h1 className="text-xl font-bold text-white">{t('toolsHub.title')}</h1>
        <p className="text-blue-200/60 text-xs mt-1">{t('toolsHub.subtitle')}</p>
      </div>

      <div className="px-5 -mt-4 pb-6">
        {/* Tools grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(tool => (
            <button
              key={tool.key}
              onClick={() => navigate(tool.path)}
              className="bg-white rounded-2xl shadow-sm p-4 text-left active:scale-[0.97] transition-transform"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3`}>
                <tool.IconComp className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {t(`toolsHub.tools.${tool.key}.name`)}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                {t(`toolsHub.tools.${tool.key}.desc`)}
              </p>
            </button>
          ))}
        </div>

        {/* Info card */}
        <div className="mt-5 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t('toolsHub.tipTitle')}</p>
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
