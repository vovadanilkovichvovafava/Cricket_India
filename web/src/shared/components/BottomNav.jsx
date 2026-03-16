import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/context/AuthContext';
import { HomeIcon, CricketBatIcon, ToolsIcon, ChatBotIcon } from './Icons';
import { getTrackingLink, trackBannerClick } from '../../features/betting/services/trackingService';

const NAV_ITEMS = [
  { Icon: HomeIcon, key: 'home', path: '/' },
  { Icon: CricketBatIcon, key: 'matches', path: '/matches' },
  { Icon: ChatBotIcon, key: 'aiChat', path: '/ai-chat' },
  { Icon: ToolsIcon, key: 'tools', path: '/tools' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  function isActive(path) {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  }

  function handleClick(item) {
    if (item.requiresAuth && !isAuthenticated) {
      navigate('/login');
    } else {
      navigate(item.path);
    }
  }

  function handleBetClick() {
    trackBannerClick('bottom_nav', 'global');
    const url = getTrackingLink(user?.id, 'bottom_nav');
    window.open(url, '_blank', 'noopener');
  }

  return (
    <>
      {/* Spacer */}
      <div className="h-20" />

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 safe-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleClick(item)}
                className={`bottom-nav-item flex-1 py-1 ${active ? 'active' : ''}`}
              >
                <div className={active
                  ? 'bg-[#FF9933]/10 rounded-full p-1.5'
                  : 'p-1.5'
                }>
                  <item.Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-medium ${
                  active ? 'text-[#FF9933]' : 'text-gray-400'
                }`}>
                  {t(`nav.${item.key}`)}
                </span>
              </button>
            );
          })}

          {/* Bet button — opens offer link */}
          <button
            onClick={handleBetClick}
            className="bottom-nav-item flex-1 py-1"
          >
            <div className="bg-green-500 rounded-full p-1.5 mx-auto w-fit">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-green-500">
              Bet
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
