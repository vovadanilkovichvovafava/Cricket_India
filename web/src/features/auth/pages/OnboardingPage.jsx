import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { CricketBatIcon, RobotIcon, TargetIcon, BarChartIcon, LightBulbIcon, TrendingUpIcon } from '../../../shared/components/Icons';

const SCREENS = [
  {
    icon: <CricketBatIcon className="w-12 h-12 text-white" />,
    bg: 'from-[#FF9933] to-[#FF8800]',
    titleKey: 'onboarding.screen1Title',
    descKey: 'onboarding.screen1Desc',
  },
  {
    icon: <RobotIcon className="w-12 h-12 text-white" />,
    bg: 'from-purple-500 to-indigo-600',
    titleKey: 'onboarding.screen2Title',
    descKey: 'onboarding.screen2Desc',
  },
  {
    icon: <TargetIcon className="w-12 h-12 text-white" />,
    bg: 'from-[#138808] to-emerald-600',
    titleKey: 'onboarding.screen3Title',
    descKey: 'onboarding.screen3Desc',
  },
];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  function handleNext() {
    if (step < SCREENS.length - 1) {
      setStep(step + 1);
    } else {
      sessionStorage.setItem('onboarding_done', '1');
      navigate('/', { replace: true });
    }
  }

  function handleSkip() {
    sessionStorage.setItem('onboarding_done', '1');
    navigate('/', { replace: true });
  }

  const screen = SCREENS[step];
  const isLast = step === SCREENS.length - 1;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0B1E4D] to-[#162D6B] flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end px-6 pt-6">
        <button
          onClick={handleSkip}
          className="text-white/50 text-sm font-medium active:text-white/80 transition-colors"
        >
          {t('onboarding.skip')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Greeting */}
        {user?.name && step === 0 && (
          <p className="text-white/60 text-sm mb-2">
            {t('onboarding.welcome', { name: user.name })}
          </p>
        )}

        {/* Icon */}
        <div className={`w-24 h-24 bg-gradient-to-br ${screen.bg} rounded-3xl flex items-center justify-center mb-8 shadow-lg`}>
          {screen.icon}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white text-center mb-3 leading-tight">
          {t(screen.titleKey)}
        </h2>

        {/* Description */}
        <p className="text-blue-200/60 text-center text-sm leading-relaxed max-w-[280px]">
          {t(screen.descKey)}
        </p>

        {/* Feature highlights on screen 1 */}
        {step === 0 && (
          <div className="flex gap-3 mt-8">
            {[
              { icon: <BarChartIcon className="w-5 h-5 text-white mx-auto" />, label: t('onboarding.feature1') },
              { icon: <LightBulbIcon className="w-5 h-5 text-white mx-auto" />, label: t('onboarding.feature2') },
              { icon: <TrendingUpIcon className="w-5 h-5 text-white mx-auto" />, label: t('onboarding.feature3') },
            ].map((f, i) => (
              <div key={i} className="bg-white/10 rounded-xl px-3 py-2 text-center">
                <span className="block mb-0.5">{f.icon}</span>
                <span className="text-[10px] text-white/70 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom area */}
      <div className="px-8 pb-10">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-[#FF9933]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 bg-gradient-to-r from-[#FF9933] to-[#FF8800] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#FF9933]/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {isLast ? t('onboarding.start') : t('onboarding.next')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
