import { useState, useEffect, useCallback } from 'react';

const SW_PATH = '/sw.js';

export default function usePushNotifications() {
  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [supported, setSupported] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'Notification' in window;
    setSupported(isSupported);

    if (isSupported) {
      navigator.serviceWorker.register(SW_PATH).then(reg => {
        setRegistration(reg);
      }).catch(() => {});
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return 'denied';
    }
  }, [supported]);

  // Schedule a local notification after a delay (ms)
  const scheduleNotification = useCallback((title, body, delayMs = 0, url = '/') => {
    if (permission !== 'granted' || !registration) return false;

    if (registration.active) {
      registration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title,
        body,
        delay: delayMs,
        url,
      });
      return true;
    }
    return false;
  }, [permission, registration]);

  // Show a notification immediately
  const showNotification = useCallback((title, body, url = '/') => {
    if (permission !== 'granted') return false;

    if (registration) {
      registration.showNotification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [100, 50, 100],
        data: { url },
      });
      return true;
    }
    return false;
  }, [permission, registration]);

  // Schedule match reminder notification
  const scheduleMatchReminder = useCallback((match) => {
    if (!match?.date || permission !== 'granted') return false;

    const matchTime = new Date(match.date).getTime();
    const now = Date.now();
    const oneHourBefore = matchTime - 3600000;

    // Only schedule if match is in the future
    if (oneHourBefore <= now) return false;

    const delay = oneHourBefore - now;
    const homeTeam = match.home || match.homeName || '?';
    const awayTeam = match.away || match.awayName || '?';

    return scheduleNotification(
      `🏏 ${homeTeam} vs ${awayTeam} starts in 1 hour!`,
      'Your AI prediction is ready. Don\'t miss this match!',
      delay,
      match.id ? `/match/${match.id}` : '/'
    );
  }, [permission, scheduleNotification]);

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    scheduleMatchReminder,
    isPushEnabled: permission === 'granted',
    isDenied: permission === 'denied',
  };
}
