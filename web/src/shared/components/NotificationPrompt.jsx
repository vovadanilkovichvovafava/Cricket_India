import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePushNotifications from '../hooks/usePushNotifications';
import { BellIcon } from './Icons';

export default function NotificationPrompt() {
  const { t } = useTranslation();
  const { supported, permission, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show prompt after 3 seconds if notification permission hasn't been decided
    if (!supported || permission !== 'default') return;
    if (sessionStorage.getItem('notif_dismissed')) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [supported, permission]);

  if (!visible || dismissed || permission !== 'default') return null;

  async function handleEnable() {
    await requestPermission();
    setDismissed(true);
    sessionStorage.setItem('notif_dismissed', '1');
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem('notif_dismissed', '1');
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-slideDown">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mx-auto max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#FF9933]/10 rounded-xl flex items-center justify-center shrink-0">
            <BellIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">{t('notifications.promptTitle')}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t('notifications.promptDesc')}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                className="flex-1 py-2 bg-gradient-to-r from-[#FF9933] to-[#FF8800] text-white text-xs font-semibold rounded-xl active:scale-[0.98] transition-transform"
              >
                {t('notifications.enable')}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-gray-100 text-gray-500 text-xs font-medium rounded-xl active:scale-[0.98] transition-transform"
              >
                {t('notifications.later')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
