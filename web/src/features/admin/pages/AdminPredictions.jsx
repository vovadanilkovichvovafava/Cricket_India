import { useState, useEffect } from 'react'
import { adminApi } from '../api'

function BarChart({ data, color = 'green' }) {
  if (!data.length) return <p className="text-xs text-slate-600 text-center py-6">No data</p>
  const max = Math.max(...data.map(d => d.count), 1)
  const bg = color === 'green' ? 'bg-emerald-500/50 hover:bg-emerald-400/70' : 'bg-blue-500/50 hover:bg-blue-400/70'
  return (
    <div className="flex items-end gap-[3px] h-32 border-l border-b border-slate-700/50 pl-1 pb-1">
      {data.slice(-30).map((d, i) => (
        <div key={i} className={`flex-1 ${bg} rounded-t min-w-[4px] transition-all relative group`} style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[9px] text-slate-200 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 font-mono">
            {d.date?.slice(5)}: {d.count}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminPredictions() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getPredictionsStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Predictions</h1>
        <p className="text-sm text-slate-500 mt-1">AI prediction analytics and accuracy tracking</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Match Predictions', value: stats?.total || 0, color: 'text-slate-100' },
          { label: 'AI Chat Requests', value: stats?.ai_chat?.total_requests || 0, color: 'text-blue-400' },
          { label: 'Chat Today', value: stats?.ai_chat?.today || 0, color: 'text-cyan-400' },
          { label: 'With Value Bets', value: stats?.ai_chat?.with_value_bets || 0, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
          </div>
        ))}
      </div>

      {/* Accuracy cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Verified', value: stats?.verified || 0, color: 'text-amber-400' },
          { label: 'Correct', value: stats?.correct || 0, color: 'text-green-400' },
          { label: 'Accuracy', value: `${stats?.accuracy || 0}%`, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-1">Daily Predictions</h3>
        <p className="text-[11px] text-slate-500 mb-4">Last 30 days</p>
        <BarChart data={stats?.daily_predictions || []} color="green" />
      </div>

      {/* Confidence distribution */}
      {stats?.confidence_distribution && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Confidence Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'High Confidence (70%+)', value: stats.confidence_distribution.high, color: 'bg-green-500', textColor: 'text-green-400' },
              { label: 'Medium (50-70%)', value: stats.confidence_distribution.medium, color: 'bg-amber-500', textColor: 'text-amber-400' },
              { label: 'Low (<50%)', value: stats.confidence_distribution.low, color: 'bg-red-500', textColor: 'text-red-400' },
            ].map(item => {
              const total = (stats.confidence_distribution.high + stats.confidence_distribution.medium + stats.confidence_distribution.low) || 1
              const pct = Math.round((item.value / total) * 100)
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className={`text-sm font-bold font-mono ${item.textColor}`}>{item.value} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}/50 rounded-full transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
