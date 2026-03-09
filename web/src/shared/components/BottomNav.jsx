import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/context/AuthContext';
import { HomeIcon, CricketBatIcon, ToolsIcon, ChatBotIcon, SettingsIcon } from './Icons';

const NAV_ITEMS = [
  { Icon: HomeIcon, key: 'home', path: '/' },
  { Icon: CricketBatIcon, key: 'matches', path: '/matches' },
  { Icon: ToolsIcon, key: 'tools', path: '/tools' },
  { Icon: ChatBotIcon, key: 'aiChat', path: '/ai-chat', requiresAuth: true },
  { Icon: SettingsIcon, key: 'settings', path: '/settings' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

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

  return (
    <>
      {/* Spacer */}
      <div className="h-20" />

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
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
        </div>
      </nav>
    </>
  );
}
