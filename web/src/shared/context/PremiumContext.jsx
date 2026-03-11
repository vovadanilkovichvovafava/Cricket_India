import { createContext, useContext, useState, useCallback } from 'react';

const PremiumContext = createContext(null);

const STORAGE_KEYS = {
  isPro: 'premium_is_pro',
  aiRequests: 'premium_ai_requests',
  aiResetDate: 'premium_ai_reset_date',
  toolUsage: 'premium_tool_usage',
};

const FREE_AI_LIMIT = 3;
const FREE_TOOL_TRIALS = 1;

function getToday() {
  return new Date().toISOString().split('T')[0]; // "2026-03-09"
}

function loadState() {
  const isPro = localStorage.getItem(STORAGE_KEYS.isPro) === 'true';
  const resetDate = localStorage.getItem(STORAGE_KEYS.aiResetDate) || '';
  const today = getToday();

  // Reset daily AI counter if new day
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

  return { isPro, aiRequestsToday, toolUsage };
}

export function PremiumProvider({ children }) {
  const [state, setState] = useState(loadState);

  const isPro = state.isPro;
  const aiRequestsToday = state.aiRequestsToday;
  const aiRequestsLeft = Math.max(0, FREE_AI_LIMIT - aiRequestsToday);

  const canUseAI = useCallback(() => {
    if (state.isPro) return true;
    return state.aiRequestsToday < FREE_AI_LIMIT;
  }, [state.isPro, state.aiRequestsToday]);

  const useAIRequest = useCallback(() => {
    setState(prev => {
      const next = prev.aiRequestsToday + 1;
      localStorage.setItem(STORAGE_KEYS.aiRequests, String(next));
      localStorage.setItem(STORAGE_KEYS.aiResetDate, getToday());
      return { ...prev, aiRequestsToday: next };
    });
  }, []);

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

  const upgradeToPro = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.isPro, 'true');
    setState(prev => ({ ...prev, isPro: true }));
  }, []);

  const downgradeToFree = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.isPro, 'false');
    setState(prev => ({ ...prev, isPro: false }));
  }, []);

  return (
    <PremiumContext.Provider value={{
      isPro,
      aiRequestsToday,
      aiRequestsLeft,
      canUseAI,
      useAIRequest,
      canUseTool,
      useToolTrial,
      upgradeToPro,
      downgradeToFree,
      FREE_AI_LIMIT,
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
