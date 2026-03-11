import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from '../../../shared/components/BottomNav';
import { HourglassIcon, CheckCircleIcon, XCircleIcon, RefreshIcon, MemoIcon } from '../../../shared/components/Icons';

const STORAGE_KEY = 'bet_tracker_bets';

function loadBets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveBets(bets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-600', icon: <HourglassIcon className="w-4 h-4 inline" /> },
  { value: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-600', icon: <CheckCircleIcon className="w-4 h-4 inline text-emerald-500" /> },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-500', icon: <XCircleIcon className="w-4 h-4 inline text-red-500" /> },
  { value: 'void', label: 'Void', color: 'bg-gray-100 text-gray-500', icon: <RefreshIcon className="w-4 h-4 inline" /> },
];

function AddBetModal({ onAdd, onClose }) {
  const { t } = useTranslation();
  const [match, setMatch] = useState('');
  const [market, setMarket] = useState('');
  const [pick, setPick] = useState('');
  const [odds, setOdds] = useState('');
  const [stake, setStake] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!match || !pick || !odds || !stake) return;
    onAdd({
      id: Date.now(),
      match: match.trim(),
      market: market.trim() || 'Match Winner',
      pick: pick.trim(),
      odds: parseFloat(odds),
      stake: parseFloat(stake),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-5 animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('betTracker.addBet')}</h3>
          <button onClick={onClose} className="w-8 h-8 text-gray-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={match} onChange={e => setMatch(e.target.value)}
            placeholder={t('betTracker.matchPlaceholder')}
            className="w-full bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30" required />
          <div className="grid grid-cols-2 gap-3">
            <input value={market} onChange={e => setMarket(e.target.value)}
              placeholder={t('betTracker.marketPlaceholder')}
              className="bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30" />
            <input value={pick} onChange={e => setPick(e.target.value)}
              placeholder={t('betTracker.pickPlaceholder')}
              className="bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" min="1.01" value={odds} onChange={e => setOdds(e.target.value)}
              placeholder={t('betTracker.oddsPlaceholder')}
              className="bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30" required />
            <input type="number" step="1" min="1" value={stake} onChange={e => setStake(e.target.value)}
              placeholder={t('betTracker.stakePlaceholder')}
              className="bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30" required />
          </div>
          <button type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#FF9933] to-[#FF8800] text-white font-bold rounded-xl text-sm active:scale-95 transition-transform">
            {t('betTracker.addBet')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BetTracker() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bets, setBets] = useState(loadBets);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { saveBets(bets); }, [bets]);

  function addBet(bet) {
    setBets(prev => [bet, ...prev]);
    setShowAdd(false);
  }

  function updateStatus(id, status) {
    setBets(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }

  function deleteBet(id) {
    setBets(prev => prev.filter(b => b.id !== id));
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return bets;
    return bets.filter(b => b.status === filter);
  }, [bets, filter]);

  // P&L calculation
  const stats = useMemo(() => {
    let totalStaked = 0, totalReturn = 0, wins = 0, losses = 0;
    bets.forEach(b => {
      if (b.status === 'won') {
        totalStaked += b.stake;
        totalReturn += b.stake * b.odds;
        wins++;
      } else if (b.status === 'lost') {
        totalStaked += b.stake;
        losses++;
      }
    });
    const profit = totalReturn - totalStaked;
    const roi = totalStaked > 0 ? ((profit / totalStaked) * 100).toFixed(1) : '0.0';
    const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '0';
    return { totalStaked, totalReturn, profit, roi, wins, losses, winRate, pending: bets.filter(b => b.status === 'pending').length };
  }, [bets]);

  return (
    <div className="min-h-dvh bg-[#F0F2F5] dark:bg-gray-900">
      {showAdd && <AddBetModal onAdd={addBet} onClose={() => setShowAdd(false)} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] px-5 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{t('betTracker.title')}</h1>
            <p className="text-blue-200/60 text-xs">{t('betTracker.subtitle')}</p>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/60">{t('betTracker.stats.profit')}</p>
            <p className={`text-lg font-bold ${stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(0)}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/60">ROI</p>
            <p className={`text-lg font-bold ${parseFloat(stats.roi) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.roi}%
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/60">{t('betTracker.stats.winRate')}</p>
            <p className="text-lg font-bold text-white">{stats.winRate}%</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/60">{t('betTracker.stats.bets')}</p>
            <p className="text-lg font-bold text-white">{bets.length}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 pb-6">
        {/* Filter tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-1 flex gap-0.5 mb-4 overflow-x-auto no-scrollbar">
          {['all', 'pending', 'won', 'lost'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 text-xs font-medium py-2 rounded-xl transition-colors whitespace-nowrap px-3 ${
                filter === f
                  ? 'bg-[#0B1E4D] text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
              {f === 'all' ? t('betTracker.filter.all') :
               f === 'pending' ? t('betTracker.filter.pending') :
               f === 'won' ? t('betTracker.filter.won') :
               t('betTracker.filter.lost')} {f !== 'all' && `(${bets.filter(b => b.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Bets list */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
            <MemoIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('betTracker.empty')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('betTracker.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(bet => {
              const statusInfo = STATUS_OPTIONS.find(s => s.value === bet.status) || STATUS_OPTIONS[0];
              const potentialWin = (bet.stake * bet.odds).toFixed(0);
              return (
                <div key={bet.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{bet.match}</p>
                      <p className="text-[11px] text-gray-400">{bet.market}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <p className="text-[10px] text-gray-400">{t('betTracker.pick')}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{bet.pick}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">{t('betTracker.oddsLabel')}</p>
                      <p className="text-sm font-bold text-[#FF9933]">{bet.odds}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">{t('betTracker.stakeLabel')}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{bet.stake}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">{t('betTracker.potentialWin')}</p>
                      <p className="text-sm font-bold text-emerald-600">{potentialWin}</p>
                    </div>
                  </div>
                  {/* Status buttons */}
                  {bet.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(bet.id, 'won')}
                        className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold rounded-xl active:scale-95 transition-transform">
                        {t('betTracker.markWon')}
                      </button>
                      <button onClick={() => updateStatus(bet.id, 'lost')}
                        className="flex-1 py-2 bg-red-50 dark:bg-red-900/30 text-red-500 text-xs font-bold rounded-xl active:scale-95 transition-transform">
                        {t('betTracker.markLost')}
                      </button>
                      <button onClick={() => deleteBet(bet.id)}
                        className="w-10 py-2 bg-gray-50 dark:bg-gray-700 text-gray-400 text-xs rounded-xl active:scale-95 transition-transform flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB — Add Bet */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 bg-gradient-to-br from-[#FF9933] to-[#FF8800] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      <BottomNav />
    </div>
  );
}
