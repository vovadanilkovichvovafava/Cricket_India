import { useState, useEffect } from 'react'
import { adminApi } from '../api'

export default function AdminTraffic() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getTrafficStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Traffic Sources</h1>
        <p className="text-sm text-slate-500 mt-1">User acquisition and traffic analytics</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Traffic Sources</p>
          <p className="text-2xl font-bold mt-1">{stats?.by_source?.length || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Banner Clicks</p>
          <p className="text-2xl font-bold mt-1">{(stats?.total_banner_clicks || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* By source */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Users by UTM Source</h3>
        {stats?.by_source?.length > 0 ? (
          <div className="space-y-3">
            {stats.by_source.map((s, i) => {
              const maxCount = stats.by_source[0]?.count || 1
              const pct = Math.round((s.count / maxCount) * 100)
              return (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                      <span className="text-sm text-slate-300">{s.source}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{s.count}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden ml-6">
                    <div className="h-full bg-blue-500/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-600 py-8">No traffic data yet. Add UTM parameters to your links.</p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-2">Setup Guide</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Add UTM parameters to your links to track traffic sources.
          Example: <code className="text-blue-400 bg-slate-800 px-1 rounded">?utm_source=telegram&utm_medium=group</code>
        </p>
      </div>
    </div>
  )
}
