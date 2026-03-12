import { createContext, useContext, useState, useCallback } from 'react';

const PremiumContext = createContext(null);

const STORAGE_KEYS = {
  isPro: 'premium_is_pro',
  proExpiresAt: 'premium_pro_expires_at', // timestamp (ms) when Pro expires
  aiRequests: 'premium_ai_requests',
  aiResetDate: 'premium_ai_reset_date',
  toolUsage: 'premium_tool_usage',
};

const FREE_AI_LIMIT = 3;
const FREE_TOOL_TRIALS = 1;
const PRO_DURATION_DAYS = 15;

function getToday() {
  return new Date().toISOString().split('T')[0]; // "2026-03-09"
}

function loadState() {
  // --- Pro status with expiration ---
  let isPro = localStorage.getItem(STORAGE_KEYS.isPro) === 'true';
  const proExpiresAt = parseInt(localStorage.getItem(STORAGE_KEYS.proExpiresAt) || '0', 10);

  // Auto-downgrade if Pro expired
  if (isPro && proExpiresAt > 0 && Date.now() >= proExpiresAt) {
    isPro = false;
    localStorage.setItem(STORAGE_KEYS.isPro, 'false');
    localStorage.removeItem(STORAGE_KEYS.proExpiresAt);
  }

  // --- Daily AI counter (silent, no UI) ---
  const resetDate = localStorage.getItem(STORAGE_KEYS.aiResetDate) || '';
  const today = getToday();

  let aiRequestsToday = parseInt(localStorage.getItem(STORAGE_KEYS.aiRequests) || '0', 10);
  if (resetDate !== today) {
    aiRequestsToday = 0;
    localStorage.setItem(STORAGE_KEYS.aiRequests, '0');
    localStorage.setItem(STORAGE_KEYS.aiResetDate, today);
  }

  let toolUsage = {};
  try {
    toolUsage = JSON.parse(localStorage.getItem(STORAGE_KEYS.toolUsage) || '{}');
  } catch { /* ignore */ }

  return { isPro, proExpiresAt, aiRequestsToday, toolUsage };
}

export function PremiumProvider({ children }) {
  const [state, setState] = useState(loadState);

  const isPro = state.isPro;

  // Days left for Pro subscription (0 if free)
  const proDaysLeft = isPro && state.proExpiresAt > 0
    ? Math.max(0, Math.ceil((state.proExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Check if user can make an AI request (silent, no UI)
  const canUseAI = useCallback(() => {
    // Pro users — unlimited, don't count
    if (state.isPro) return true;
    return state.aiRequestsToday < FREE_AI_LIMIT;
  }, [state.isPro, state.aiRequestsToday]);

  // Count an AI request (only for free users)
  const useAIRequest = useCallback(() => {
    if (state.isPro) return; // Don't count for Pro
    setState(prev => {
      const next = prev.aiRequestsToday + 1;
      localStorage.setItem(STORAGE_KEYS.aiRequests, String(next));
      localStorage.setItem(STORAGE_KEYS.aiResetDate, getToday());
      return { ...prev, aiRequestsToday: next };
    });
  }, [state.isPro]);

  const canUseTool = useCallback((toolId) => {
    if (state.isPro) return true;
    return (state.toolUsage[toolId] || 0) < FREE_TOOL_TRIALS;
  }, [state.isPro, state.toolUsage]);

  const useToolTrial = useCallback((toolId) => {
    setState(prev => {
      const toolUsage = { ...prev.toolUsage, [toolId]: (prev.toolUsage[toolId] || 0) + 1 };
      localStorage.setItem(STORAGE_KEYS.toolUsage, JSON.stringify(toolUsage));
      return { ...prev, toolUsage };
    });
  }, []);

  // Activate Pro for 15 days
  const upgradeToPro = useCallback(() => {
    const expiresAt = Date.now() + PRO_DURATION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.isPro, 'true');
    localStorage.setItem(STORAGE_KEYS.proExpiresAt, String(expiresAt));
    setState(prev => ({ ...prev, isPro: true, proExpiresAt: expiresAt }));
  }, []);

  // Downgrade to free (manual or auto-expiry)
  const downgradeToFree = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.isPro, 'false');
    localStorage.removeItem(STORAGE_KEYS.proExpiresAt);
    setState(prev => ({ ...prev, isPro: false, proExpiresAt: 0 }));
  }, []);

  return (
    <PremiumContext.Provider value={{
      isPro,
      proDaysLeft,
      canUseAI,
      useAIRequest,
      canUseTool,
      useToolTrial,
      upgradeToPro,
      downgradeToFree,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used inside PremiumProvider');
  return ctx;
}
