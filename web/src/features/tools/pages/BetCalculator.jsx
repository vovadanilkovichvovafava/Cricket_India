import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from '../../../shared/components/BottomNav';

export default function BetCalculator() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [betType, setBetType] = useState('single'); // single | accumulator
  const [stake, setStake] = useState('100');
  const [singleOdds, setSingleOdds] = useState('1.85');
  const [selections, setSelections] = useState([
    { label: '', odds: '1.85' },
    { label: '', odds: '2.10' },
  ]);

  // Single bet calculation
  const stakeNum = parseFloat(stake) || 0;
  const singleOddsNum = parseFloat(singleOdds) || 0;
  const singleReturn = stakeNum * singleOddsNum;
  const singleProfit = singleReturn - stakeNum;

  // Accumulator calculation
  const accumOdds = selections.reduce((acc, s) => acc * (parseFloat(s.odds) || 1), 1);
  const accumReturn = stakeNum * accumOdds;
  const accumProfit = accumReturn - stakeNum;

  function addSelection() {
    if (selections.length >= 10) return;
    setSelections([...selections, { label: '', odds: '1.50' }]);
  }

  function removeSelection(idx) {
    if (selections.length <= 2) return;
    setSelections(selections.filter((_, i) => i !== idx));
  }

  function updateSelection(idx, field, value) {
    setSelections(selections.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  const totalReturn = betType === 'single' ? singleReturn : accumReturn;
  const totalProfit = betType === 'single' ? singleProfit : accumProfit;

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
            <h1 className="text-xl font-bold text-white">{t('tools.betCalc.title')}</h1>
            <p className="text-blue-200/60 text-xs">{t('tools.betCalc.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 pb-6">
        {/* Bet type toggle */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5 mb-4 flex">
          <button
            onClick={() => setBetType('single')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              betType === 'single' ? 'bg-[#0B1E4D] text-white' : 'text-gray-400'
            }`}
          >
            {t('tools.betCalc.single')}
          </button>
          <button
            onClick={() => setBetType('accumulator')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              betType === 'accumulator' ? 'bg-[#0B1E4D] text-white' : 'text-gray-400'
            }`}
          >
            {t('tools.betCalc.accumulator')}
          </button>
        </div>

        {/* Stake input */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('tools.betCalc.stake')}</label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl text-gray-400">₹</span>
            <input
              type="number"
              value={stake}
              onChange={e => setStake(e.target.value)}
              className="w-full pl-7 text-2xl font-bold text-[#0B1E4D] bg-transparent border-none outline-none"
              placeholder="100"
            />
          </div>
          {/* Quick stake buttons */}
          <div className="flex gap-2 mt-3">
            {[100, 500, 1000, 5000].map(v => (
              <button key={v} onClick={() => setStake(String(v))}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  stake === String(v) ? 'bg-[#FF9933] text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                ₹{v}
              </button>
            ))}
          </div>
        </div>

        {/* Single odds or Accumulator selections */}
        {betType === 'single' ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('tools.betCalc.odds')}</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={singleOdds}
              onChange={e => setSingleOdds(e.target.value)}
              className="w-full text-2xl font-bold text-[#0B1E4D] bg-transparent border-none outline-none"
              placeholder="1.85"
            />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {selections.map((sel, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <span className="w-6 h-6 bg-[#0B1E4D] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={sel.label}
                    onChange={e => updateSelection(idx, 'label', e.target.value)}
                    className="w-full text-sm text-gray-700 bg-transparent outline-none mb-1"
                    placeholder={t('tools.betCalc.selectionPlaceholder')}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{t('tools.betCalc.odds')}:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      value={sel.odds}
                      onChange={e => updateSelection(idx, 'odds', e.target.value)}
                      className="w-20 text-sm font-bold text-[#FF9933] bg-transparent outline-none"
                    />
                  </div>
                </div>
                {selections.length > 2 && (
                  <button onClick={() => removeSelection(idx)} className="text-gray-300 active:text-red-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {selections.length < 10 && (
              <button onClick={addSelection}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 font-medium active:bg-gray-50 transition-colors">
                + {t('tools.betCalc.addSelection')}
              </button>
            )}
          </div>
        )}

        {/* Result card */}
        <div className="bg-gradient-to-br from-[#0B1E4D] to-[#162D6B] rounded-2xl p-5 text-white">
          {betType === 'accumulator' && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <span className="text-blue-200/60 text-sm">{t('tools.betCalc.combinedOdds')}</span>
              <span className="text-lg font-bold text-[#FF9933]">{accumOdds.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-200/60 text-sm">{t('tools.betCalc.potentialReturn')}</span>
            <span className="text-xl font-bold">₹{totalReturn.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-200/60 text-sm">{t('tools.betCalc.profit')}</span>
            <span className={`text-xl font-bold ${totalProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalProfit > 0 ? '+' : ''}₹{totalProfit.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
