import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { usePremium } from '../../../shared/context/PremiumContext';
import { useTheme } from '../../../shared/context/ThemeContext';
import { ENV } from '../../../shared/config/env';
import BottomNav from '../../../shared/components/BottomNav';
import TricolorBar from '../../../shared/components/TricolorBar';
import {
  LanguageIcon, MoonIcon, ServerIcon, CalculatorIcon, RefreshIcon,
  SmartphoneIcon, WrenchIcon, CricketBatIcon, ShieldCheckIcon, FreeBadgeIcon, SparkleIcon,
} from '../../../shared/components/Icons';

const APP_VERSION = '1.0.0';
const BUILD = '2026.03.09';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
];

const TOOLS = [
  { nameKey: 'settings.tools.kellyCalculator', descKey: 'settings.tools.kellyDescription', IconComp: CalculatorIcon, path: '/tools/kelly' },
  { nameKey: 'settings.tools.oddsConverter', descKey: 'settings.tools.oddsDescription', IconComp: RefreshIcon, path: '/tools/odds' },
  { nameKey: 'settings.tools.betCalculator', descKey: 'settings.tools.betCalcDescription', IconComp: CalculatorIcon, path: '/tools/bet-calc' },
  { nameKey: 'settings.tools.glossary', descKey: 'settings.tools.glossaryDescription', IconComp: CricketBatIcon, path: '/tools/glossary' },
];

// Football-style settings item — icon + label + value + chevron
function SettingsItem({ icon, label, value, onClick, children }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
        onClick ? 'active:bg-gray-50 dark:active:bg-gray-700 transition-colors' : ''
      }`}
    >
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {value && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{value}</p>}
      </div>
      {children || (
        onClick && (
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )
      )}
    </Wrapper>
  );
}

function SectionLabel({ text }) {
  return (
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 pt-5 pb-2">{text}</p>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isPro, aiRequestsLeft, FREE_AI_LIMIT, downgradeToFree } = usePremium();
  const { isDark, toggleDarkMode } = useTheme();
  const [language, setLanguage] = useState(() => i18n.language?.split('-')[0] || 'en');
  const [apiStatus, setApiStatus] = useState('checking');
  const [showLangPicker, setShowLangPicker] = useState(false);

  const checkApiStatus = useCallback(async () => {
    setApiStatus('checking');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${ENV.API_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      setApiStatus(res.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkApiStatus();
  }, [checkApiStatus]);

  function handleLanguageChange(code) {
    setLanguage(code);
    localStorage.setItem('app_language', code);
    i18n.changeLanguage(code);
    setShowLangPicker(false);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="min-h-dvh bg-[#F0F2F5] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        </div>
      </div>

      <div className="px-5 pb-8">
        {/* Account */}
        <SectionLabel text={t('settings.sections.account')} />
        {isAuthenticated ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF9933] to-[#FF8800] rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">{user?.name?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.country_code} {user?.phone?.replace(user?.country_code, '')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg active:bg-red-100 transition-colors"
              >
                {t('settings.logout')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#FF9933]">{t('settings.loginRegister')}</p>
                <p className="text-xs text-gray-400">{t('settings.loginDesc')}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}

        {/* Premium */}
        <SectionLabel text={t('premium.planSection') || 'Plan'} />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {isPro ? (
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                  <SparkleIcon className="w-5 h-5 text-yellow-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('premium.proPlan')}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{t('premium.unlimited')}</p>
                </div>
                <button
                  onClick={downgradeToFree}
                  className="text-[11px] text-gray-400 px-2 py-1"
                >
                  {t('premium.downgrade') || 'Downgrade'}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FreeBadgeIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('premium.freePlan')}</p>
                  <p className="text-[11px] text-gray-400">{t('premium.requestsLeft', { count: aiRequestsLeft })} ({FREE_AI_LIMIT}/day)</p>
                </div>
                <a
                  href={ENV.BOOKMAKER_LINK !== '#' ? ENV.BOOKMAKER_LINK : 'https://siteofficialred.com/Qhs6z2nP'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-[#FF9933] to-[#FF8800] text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                  {t('premium.upgradeNow')}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* General */}
        <SectionLabel text={t('settings.sections.general')} />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {/* Language */}
          <SettingsItem
            icon={<LanguageIcon className="w-5 h-5 text-amber-600" />}
            label={t('settings.language')}
            value={currentLang.native}
            onClick={() => setShowLangPicker(!showLangPicker)}
          >
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showLangPicker ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </SettingsItem>

          {/* Language picker */}
          {showLangPicker && (
            <div className="px-4 py-2 bg-gray-50">
              {LANGUAGES.map(lang => (
                <button key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 transition-colors
                    ${language === lang.code ? 'bg-[#FF9933]/10' : 'active:bg-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{lang.label}</span>
                    <span className="text-xs text-gray-400">{lang.native}</span>
                  </div>
                  {language === lang.code && (
                    <svg className="w-4 h-4 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Dark Mode */}
          <SettingsItem
            icon={<MoonIcon className="w-5 h-5 text-[#0B1E4D] dark:text-blue-300" />}
            label={t('settings.darkMode')}
          >
            <button onClick={toggleDarkMode}
              className={`w-12 h-7 rounded-full transition-colors relative ${isDark ? 'bg-[#FF9933]' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-transform
                ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </SettingsItem>
        </div>

        {/* System */}
        <SectionLabel text={t('settings.sections.system')} />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          <SettingsItem
            icon={<ServerIcon className="w-5 h-5 text-emerald-600" />}
            label={t('settings.apiStatus')}
            onClick={checkApiStatus}
          >
            <div className="flex items-center gap-2">
              {apiStatus === 'checking' ? (
                <>
                  <div className="w-2.5 h-2.5 border-2 border-gray-300 border-t-[#FF9933] rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">{t('settings.checking')}</span>
                </>
              ) : apiStatus === 'online' ? (
                <>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm shadow-green-200" />
                  <span className="text-xs text-green-600 font-medium">{t('settings.online')}</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-200" />
                  <span className="text-xs text-red-500 font-medium">{t('settings.offline')}</span>
                </>
              )}
            </div>
          </SettingsItem>

          <div className="px-4 py-3">
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{ENV.API_URL}</span>
            </p>
          </div>
        </div>

        {/* Tools */}
        <SectionLabel text={t('settings.sections.tools')} />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {TOOLS.map(tool => (
            <SettingsItem
              key={tool.nameKey}
              icon={<tool.IconComp className="w-5 h-5 text-amber-600" />}
              label={t(tool.nameKey)}
              value={t(tool.descKey)}
              onClick={() => navigate(tool.path)}
            />
          ))}
        </div>

        {/* About */}
        <SectionLabel text={t('settings.sections.about')} />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          <SettingsItem icon={<SmartphoneIcon className="w-5 h-5 text-gray-500" />} label={t('settings.version')}>
            <span className="text-xs text-gray-400 font-mono">v{APP_VERSION}</span>
          </SettingsItem>
          <SettingsItem icon={<WrenchIcon className="w-5 h-5 text-gray-500" />} label={t('settings.build')}>
            <span className="text-xs text-gray-400 font-mono">{BUILD}</span>
          </SettingsItem>
          <SettingsItem icon={<CricketBatIcon className="w-5 h-5 text-[#138808]" />} label={t('settings.season')}>
            <span className="text-xs text-gray-400">{t('settings.seasonLabel')}</span>
          </SettingsItem>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <TricolorBar className="mb-3" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('app.name')}</span>
            <p className="text-[11px] text-gray-400 mb-2 mt-1">{t('app.tagline')}</p>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-[#138808]" />
              <span className="text-[10px] text-[#138808] font-medium">{t('app.responsibleGaming')}</span>
            </div>
            <p className="text-[9px] text-gray-400">{t('app.disclaimer')}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
