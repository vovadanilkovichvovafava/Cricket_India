import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Eagerly loaded
import Home from './features/matches/pages/Home';

// Lazy loaded
const Matches = lazy(() => import('./features/matches/pages/Matches'));
const MatchDetail = lazy(() => import('./features/matches/pages/MatchDetail'));
const AIChat = lazy(() => import('./features/predictions/pages/AIChat'));
const Settings = lazy(() => import('./features/tools/pages/Settings'));

function Spinner() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-primary-700 to-primary-900">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="mt-4 text-white/80 text-sm font-medium">Loading...</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/match/:id" element={<MatchDetail />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
