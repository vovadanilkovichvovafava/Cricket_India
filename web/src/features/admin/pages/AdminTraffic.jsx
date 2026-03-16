import { useState, useEffect } from 'react'
import { adminApi } from '../api'

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function BarList({ items, labelKey, valueKey, color = 'bg-blue-500/50' }) {
  if (!items?.length) return <p className="text-center text-sm text-slate-600 py-6">No data yet</p>
  const max = items[0]?.[valueKey] || 1
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = Math.round((item[valueKey] / max) * 100)
        return (
          <div key={item[labelKey] || i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                <span className="text-sm text-slate-300">{item[labelKey]}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{item[valueKey]}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden ml-6">
              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatDuration(ms) {
  if (!ms) return '0s'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rs = s % 60
  return `${m}m ${rs}s`
}

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

  const s = stats?.sessions || {}
  const funnel = stats?.banner_funnel || {}
  const refs = stats?.referrals || {}
  const refShares = stats?.referral_shares || {}
  const predShares = stats?.prediction_shares || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Traffic & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Sessions, pages, banner funnel, referrals, shares</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Sessions Today" value={s.total_today || 0} />
        <StatCard label="Avg Duration" value={formatDuration(s.avg_duration_ms)} sub={`${s.avg_pages_per_session || 0} pages/session`} />
        <StatCard label="Banner Click Rate" value={`${funnel.conversion_pct || 0}%`} sub={`${funnel.with_banner_click || 0} clicks`} />
        <StatCard label="Total Shares" value={(refShares.total || 0) + (predShares.total || 0)} sub={`${refShares.total || 0} ref / ${predShares.total || 0} pred`} />
      </div>

      {/* Top Pages */}
      <Card title="Top Pages (7 days)">
        {stats?.top_pages?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Path</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_pages.map((p, i) => (
                  <tr key={p.path} className="border-t border-slate-800">
                    <td className="py-2 text-slate-500">{i + 1}</td>
                    <td className="py-2 text-slate-300 font-mono text-xs">{p.path}</td>
                    <td className="py-2 text-right text-slate-400">{p.views}</td>
                    <td className="py-2 text-right text-slate-400">{formatDuration(p.avg_duration_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-600 py-6">No page view data yet</p>
        )}
      </Card>

      {/* Banner Funnel */}
      <Card title="Banner Click Funnel (today)">
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center p-3 bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold">{funnel.total_sessions || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Sessions</p>
          </div>
          <div className="text-slate-600 text-xl">→</div>
          <div className="flex-1 text-center p-3 bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-400">{funnel.with_banner_click || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Banner Clicks</p>
          </div>
          <div className="text-slate-600 text-xl">→</div>
          <div className="flex-1 text-center p-3 bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold text-green-400">{funnel.conversion_pct || 0}%</p>
            <p className="text-xs text-slate-500 mt-1">Conversion</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Avg time to click: {formatDuration(funnel.avg_time_to_click_ms)}
        </p>
      </Card>

      {/* Banner clicks by source page */}
      <Card title="Banner Clicks by Page">
        <BarList items={stats?.user_journeys} labelKey="path" valueKey="count" color="bg-orange-500/50" />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Referrals */}
        <Card title="Referrals">
          <div className="flex gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold">{refs.total_referrers || 0}</p>
              <p className="text-xs text-slate-500">Referrers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{refs.total_referred || 0}</p>
              <p className="text-xs text-slate-500">Referred</p>
            </div>
          </div>
          {refs.top_referrers?.length > 0 ? (
            <div className="space-y-2">
              {refs.top_referrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 truncate">{r.name || r.phone}</span>
                  <span className="text-slate-400 font-mono ml-2">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-4">No referrals yet</p>
          )}
        </Card>

        {/* Shares by channel */}
        <Card title="Referral Shares by Channel">
          {refShares.by_channel?.length > 0 ? (
            <div className="space-y-3">
              {refShares.by_channel.map(ch => {
                const icons = { whatsapp: '💬', telegram: '✈️', copy: '📋', native: '📤' }
                return (
                  <div key={ch.channel} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      {icons[ch.channel] || '•'} {ch.channel}
                    </span>
                    <span className="text-sm font-mono text-slate-400">{ch.count}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-4">No share data yet</p>
          )}
        </Card>
      </div>

      {/* Prediction Shares */}
      <Card title="Prediction Shares">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-bold">{predShares.total || 0}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          {predShares.by_channel?.map(ch => (
            <div key={ch.channel} className="text-center">
              <p className="text-lg font-semibold text-slate-300">{ch.count}</p>
              <p className="text-xs text-slate-500">{ch.channel}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* UTM Sources */}
      <Card title="UTM Sources">
        <BarList items={stats?.by_source} labelKey="source" valueKey="count" />
      </Card>

      {/* Total banner clicks */}
      <div className="text-center text-xs text-slate-600 pb-4">
        Total banner clicks (all time): {(stats?.total_banner_clicks || 0).toLocaleString()}
      </div>
    </div>
  )
}
