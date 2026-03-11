import { useState, useEffect } from 'react'
import { adminApi } from '../api'

export default function AdminPro() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getOverview()
      .then(setOverview)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const users = overview?.users || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">PRO Users</h1>
        <p className="text-sm text-slate-500 mt-1">Premium subscription analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total PRO</p>
          <p className="text-2xl font-bold mt-1 text-purple-400">{users.pro || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400">New Today</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{users.pro_new_today || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total Users</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">{users.total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400">Conversion Rate</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">
            {users.total > 0 ? `${Math.round((users.pro / users.total) * 100)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Conversion Funnel</h3>
        <div className="space-y-4">
          {[
            { label: 'Registered', value: users.total || 0, color: 'bg-blue-500' },
            { label: 'Active (used AI)', value: Math.round((users.total || 0) * 0.4), color: 'bg-green-500' },
            { label: 'PRO Converted', value: users.pro || 0, color: 'bg-purple-500' },
          ].map((s, i) => {
            const max = Math.max(users.total || 1, 1)
            const pct = Math.round((s.value / max) * 100)
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-slate-400">{s.value.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">{pct}%</span>
                  </div>
                </div>
                <div className="h-5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color}/40 rounded-full transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Revenue (Mock)</h3>
        <p className="text-[11px] text-slate-500 mb-4">Premium tracking coming soon — currently on localStorage mock</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Monthly Revenue</p>
            <p className="text-lg font-bold text-green-400">—</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Avg LTV</p>
            <p className="text-lg font-bold text-blue-400">—</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Churn Rate</p>
            <p className="text-lg font-bold text-amber-400">—</p>
          </div>
        </div>
      </div>
    </div>
  )
}
