import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import { PremiumProvider } from './shared/context/PremiumContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import NotificationPrompt from './shared/components/NotificationPrompt';
import SupportChat from './shared/components/SupportChat';
import analyticsTracker from './shared/services/analyticsTracker';

// Eagerly loaded
import Home from './features/matches/pages/Home';

// Lazy loaded
const Matches = lazy(() => import('./features/matches/pages/Matches'));
const MatchDetail = lazy(() => import('./features/matches/pages/MatchDetail'));
const AIChat = lazy(() => import('./features/predictions/pages/AIChat'));
const Settings = lazy(() => import('./features/tools/pages/Settings'));
const IPLEvent = lazy(() => import('./features/events/pages/IPLEvent'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const KellyCalculator = lazy(() => import('./features/tools/pages/KellyCalculator'));
const OddsConverter = lazy(() => import('./features/tools/pages/OddsConverter'));
const BetCalculator = lazy(() => import('./features/tools/pages/BetCalculator'));
const CricketGlossary = lazy(() => import('./features/tools/pages/CricketGlossary'));
const ToolsHub = lazy(() => import('./features/tools/pages/ToolsHub'));
const BetTracker = lazy(() => import('./features/tools/pages/BetTracker'));
const PlayerStats = lazy(() => import('./features/tools/pages/PlayerStats'));
const ReferralPage = lazy(() => import('./features/auth/pages/ReferralPage'));
const OnboardingPage = lazy(() => import('./features/auth/pages/OnboardingPage'));
const Leaderboard = lazy(() => import('./features/predictions/pages/Leaderboard'));
const ProAccess = lazy(() => import('./features/betting/pages/ProAccess'));
const BookmakerPromo = lazy(() => import('./features/betting/pages/BookmakerPromo'));
const AdminRoutes = lazy(() => import('./features/admin/AdminRoutes'));

function Spinner() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1E4D] to-[#162D6B]">
      <div className="w-12 h-12 border-4 border-white/20 border-t-[#FF9933] rounded-full animate-spin" />
      <p className="mt-4 text-white/80 text-sm font-bold">PreScoreAI</p>
      <div className="flex h-[3px] w-16 mt-3 rounded-full overflow-hidden">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  );
}

// Protected route — redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Splash screen — cricket ball + branding
function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1200);
    const t2 = setTimeout(onDone, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1E4D] to-[#162D6B] transition-opacity duration-400 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Cricket ball */}
      <div className="relative mb-6">
        <svg className="w-20 h-20 animate-ball-spin" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" fill="#C0392B" />
          <circle cx="50" cy="50" r="44" stroke="#A93226" strokeWidth="2" />
          {/* Seam */}
          <path d="M30 15c5 12 5 25 0 35s-5 25 0 35" stroke="#FFE0D0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M70 15c-5 12-5 25 0 35s5 25 0 35" stroke="#FFE0D0" strokeWidth="2.5" strokeLinecap="round" />
          {/* Stitches */}
          <path d="M32 20l-4 3M31 28l-5 2M30 36l-5 1M31 44l-5-1M32 52l-5-2M33 60l-4-3M35 67l-4-4M37 74l-3-4" stroke="#FFE0D0" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M68 20l4 3M69 28l5 2M70 36l5 1M69 44l5-1M68 52l5-2M67 60l4-3M65 67l4-4M63 74l3-4" stroke="#FFE0D0" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand */}
      <h1 className="text-3xl font-black text-white mb-1 tracking-tight">PreScoreAI</h1>
      <p className="text-blue-200/60 text-sm mb-6">AI-Powered IPL Predictions</p>

      {/* Tricolor bar */}
      <div className="flex h-[3px] w-24 rounded-full overflow-hidden">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-6">
        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}

// Track page views on every route change
function AnalyticsProvider({ children }) {
  const location = useLocation();
  const prevPath = useRef(null);

  useEffect(() => {
    analyticsTracker.init();
    return () => analyticsTracker.destroy();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path !== prevPath.current) {
      analyticsTracker.trackPageView(path);
      prevPath.current = path;
    }
  }, [location]);

  return children;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit per session
    if (sessionStorage.getItem('splash_shown')) return false;
    sessionStorage.setItem('splash_shown', '1');
    return true;
  });

  return (
    <ThemeProvider>
    <AuthProvider>
      <PremiumProvider>
        <AnalyticsProvider>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
        <NotificationPrompt />
        <SupportChat />
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/referral" element={<ReferralPage />} />

            {/* Protected routes — require login */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
            <Route path="/match/:id" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
            <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/ipl" element={<ProtectedRoute><IPLEvent /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/tools" element={<ProtectedRoute><ToolsHub /></ProtectedRoute>} />
            <Route path="/tools/kelly" element={<ProtectedRoute><KellyCalculator /></ProtectedRoute>} />
            <Route path="/tools/odds" element={<ProtectedRoute><OddsConverter /></ProtectedRoute>} />
            <Route path="/tools/bet-calc" element={<ProtectedRoute><BetCalculator /></ProtectedRoute>} />
            <Route path="/tools/glossary" element={<ProtectedRoute><CricketGlossary /></ProtectedRoute>} />
            <Route path="/tools/tracker" element={<ProtectedRoute><BetTracker /></ProtectedRoute>} />
            <Route path="/tools/players" element={<ProtectedRoute><PlayerStats /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/pro" element={<ProtectedRoute><ProAccess /></ProtectedRoute>} />
            <Route path="/offer" element={<ProtectedRoute><BookmakerPromo /></ProtectedRoute>} />

            {/* Admin panel — separate auth, no ProtectedRoute */}
            <Route path="/admin/*" element={<AdminRoutes />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </AnalyticsProvider>
      </PremiumProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
