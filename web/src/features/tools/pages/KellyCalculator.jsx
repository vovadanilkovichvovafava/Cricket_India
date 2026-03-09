import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from '../../../shared/components/BottomNav';

export default function KellyCalculator() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [probability, setProbability] = useState(55);
  const [odds, setOdds] = useState('1.85');

  const oddsNum = parseFloat(odds) || 0;
  const p = probability / 100;
  const q = 1 - p;
  const b = oddsNum - 1;

  // Kelly formula: f* = (bp - q) / b
  const kelly = b > 0 ? ((b * p - q) / b) * 100 : 0;
  const kellyPct = Math.max(0, kelly);
  const halfKelly = kellyPct / 2;
  const hasEdge = kelly > 0;

  // Expected value
  const ev = b > 0 ? (p * b - q) * 100 : 0;

  return (
    <div className="min-h-dvh bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{t('tools.kelly.title')}</h1>
            <p className="text-blue-200/60 text-xs">{t('tools.kelly.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 pb-6">
        {/* Input card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          {/* Probability slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{t('tools.kelly.probability')}</label>
              <span className="text-lg font-bold text-[#0B1E4D]">{probability}%</span>
            </div>
            <input
              type="range"
              min="1" max="99"
              value={probability}
              onChange={e => setProbability(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF9933]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1%</span>
              <span>50%</span>
              <span>99%</span>
            </div>
          </div>

          {/* Decimal odds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('tools.kelly.odds')}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">×</span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={odds}
                onChange={e => setOdds(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30 focus:border-[#FF9933] transition-all"
                placeholder="1.85"
              />
            </div>
          </div>
        </div>

        {/* Result card */}
        <div className={`rounded-2xl shadow-sm p-5 mb-4 ${hasEdge ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasEdge ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {hasEdge ? (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-semibold ${hasEdge ? 'text-emerald-700' : 'text-red-600'}`}>
              {hasEdge ? t('tools.kelly.valueFound') : t('tools.kelly.noValue')}
            </span>
          </div>

          {hasEdge ? (
            <div className="space-y-4">
              {/* Kelly % */}
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('tools.kelly.optimalBet')}</p>
                <p className="text-3xl font-black text-[#0B1E4D]">{kellyPct.toFixed(1)}%</p>
                <div className="w-full h-3 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF9933] to-[#FF8800] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kellyPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Half Kelly */}
              <div className="bg-white/60 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{t('tools.kelly.halfKelly')}</p>
                    <p className="text-lg font-bold text-[#0B1E4D]">{halfKelly.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('tools.kelly.expectedValue')}</p>
                    <p className="text-lg font-bold text-emerald-600">+{ev.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-600/80">{t('tools.kelly.noValueDesc')}</p>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('tools.kelly.howItWorks')}</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{t('tools.kelly.formula')}</p>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">{t('tools.kelly.example')}</p>
            <p className="text-xs text-gray-600">{t('tools.kelly.exampleText')}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
