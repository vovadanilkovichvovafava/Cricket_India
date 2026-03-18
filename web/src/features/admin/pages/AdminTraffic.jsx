import { useState, useEffect, useCallback, useRef } from 'react'
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
  if (!ms) return '0:00'
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Country code → flag emoji
function countryFlag(code) {
  if (!code || code === '—') return '🌐'
  const upper = code.toUpperCase()
  // Regional indicator symbols
  try {
    return String.fromCodePoint(...[...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
  } catch {
    return '🌐'
  }
}

// OS icon
function osIcon(os) {
  const icons = {
    Android: '🤖',
    iOS: '🍎',
    Windows: '🪟',
    macOS: '💻',
    Linux: '🐧',
  }
  return icons[os] || '❓'
}

// Browser icon
function browserIcon(browser) {
  const icons = {
    Chrome: '🟢',
    Safari: '🔵',
    Firefox: '🟠',
    Edge: '🔷',
  }
  return icons[browser] || '⚪'
}

// Activity dots
function ActivityDots({ level }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= level
              ? level <= 2 ? 'bg-green-500'
                : level <= 3 ? 'bg-yellow-500'
                : 'bg-orange-500'
              : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

// Format time from ISO
function formatTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

// Referrer display
function formatReferrer(ref) {
  if (!ref) return '—'
  try {
    const url = new URL(ref)
    return url.hostname.replace('www.', '')
  } catch {
    return ref.slice(0, 30)
  }
}

// ── Expandable visit row ──
function VisitRow({ visit, index, offset, onPlayReplay }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-t border-slate-800 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* +/- and # */}
        <td className="py-2.5 pl-3 pr-1 text-slate-500 text-xs whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5">
            <span className={`text-[10px] transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
            {offset + index + 1}
          </span>
        </td>

        {/* Icons: country, OS, browser */}
        <td className="py-2.5 px-1">
          <div className="flex items-center gap-1 text-sm">
            <span title={visit.country}>{countryFlag(visit.country)}</span>
            <span title={visit.os}>{osIcon(visit.os)}</span>
            <span title={visit.browser}>{browserIcon(visit.browser)}</span>
          </div>
        </td>

        {/* Date & time */}
        <td className="py-2.5 px-2 whitespace-nowrap">
          <div className="text-xs text-slate-400">{formatDate(visit.visit_time)}</div>
          <div className="text-sm text-slate-200 font-mono">{formatTime(visit.visit_time)}</div>
        </td>

        {/* Activity */}
        <td className="py-2.5 px-2">
          <ActivityDots level={visit.activity} />
        </td>

        {/* Time on site */}
        <td className="py-2.5 px-2 text-sm font-mono text-right">
          {visit.is_live ? (
            <span className="text-green-400 flex items-center justify-end gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {visit.duration_ms > 0 ? formatDuration(visit.duration_ms) : 'live'}
            </span>
          ) : (
            <span className="text-slate-300">{formatDuration(visit.duration_ms)}</span>
          )}
        </td>

        {/* Page views */}
        <td className="py-2.5 px-2 text-sm text-slate-300 text-center">
          {visit.page_views}
        </td>

        {/* Referrer / UTM */}
        <td className="py-2.5 px-2 text-xs text-slate-400 max-w-[140px] truncate">
          {visit.utm_source ? (
            <span className="text-blue-400">{visit.utm_source}</span>
          ) : visit.referrer ? (
            <span title={visit.referrer}>🌐 {formatReferrer(visit.referrer)}</span>
          ) : (
            <span className="text-slate-600">direct</span>
          )}
        </td>

        {/* Visit # */}
        <td className="py-2.5 px-2 text-sm text-slate-400 text-center">
          {visit.visit_number}
        </td>

        {/* Goals */}
        <td className="py-2.5 px-2 text-center">
          {visit.goals > 0 ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-green-500 text-green-400 text-xs font-bold">
              {visit.goals}
            </span>
          ) : (
            <span className="text-slate-700">—</span>
          )}
        </td>

        {/* Replay */}
        <td className="py-2.5 px-2 pr-3 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); onPlayReplay?.(visit.session_id) }}
            className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
            title="Watch session replay"
          >
            ▶
          </button>
        </td>
      </tr>

      {/* Expanded: page journey */}
      {expanded && (
        <tr className="bg-slate-800/30">
          <td colSpan={10} className="px-4 py-3">
            <div className="text-xs text-slate-500 mb-2">
              Session: <span className="font-mono text-slate-400">{visit.session_id?.slice(0, 8)}...</span>
              {visit.user_id && <> · User ID: <span className="text-slate-400">{visit.user_id}</span></>}
              {visit.landing_page && <> · Landing: <span className="font-mono text-slate-400">{visit.landing_page}</span></>}
            </div>

            {visit.pages?.length > 0 ? (
              <div className="space-y-1">
                {visit.pages.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 w-4 text-right">{i + 1}</span>
                    <span className="font-mono text-slate-300 flex-1">{p.path || '/'}</span>
                    <span className="text-slate-500 font-mono">{formatDuration(p.duration_ms)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No page data</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── Replay Modal ──
function ReplayModal({ sessionId, onClose }) {
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const playerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    adminApi.getSessionReplay(sessionId)
      .then(data => {
        if (data.events?.length) {
          setEvents(data.events)
        } else {
          setError('No replay events recorded')
        }
      })
      .catch(err => setError(err.message || 'No replay data for this session'))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (!events?.length || !containerRef.current) return

    let destroyed = false

    // Dynamic import — rrweb-player only loads when admin clicks Play
    Promise.all([
      import('rrweb-player'),
      import('rrweb-player/dist/style.css'),
    ]).then(([mod]) => {
      if (destroyed) return
      const RRWebPlayer = mod.default || mod
      playerRef.current = new RRWebPlayer({
        target: containerRef.current,
        props: {
          events,
          width: 410,
          height: 680,
          autoPlay: true,
          showController: true,
          speedOption: [1, 1.5, 2],
        },
      })
    }).catch(() => {
      setError('Failed to load replay player')
    })

    return () => {
      destroyed = true
      if (playerRef.current) {
        try { playerRef.current.$destroy?.() } catch {}
        playerRef.current = null
      }
    }
  }, [events])

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-6 pb-6 overflow-y-auto"
         onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-[440px] flex flex-col"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-semibold">Session Replay</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{sessionId?.slice(0, 12)}...</p>
          </div>
          <button onClick={onClose}
                  className="text-slate-400 hover:text-white text-lg px-2">
            ✕
          </button>
        </div>

        {/* Body — fixed height for phone viewport + controls */}
        <div className="px-2 py-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Loading replay...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-16">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-xs text-slate-600 mt-2">Session may be too short or still recording</p>
            </div>
          )}
          <div ref={containerRef} className="replay-container flex flex-col items-center [&_.rr-player]:!w-full [&_.rr-player__frame]:!w-full [&_.rr-controller]:!w-full" />
        </div>
      </div>
    </div>
  )
}


// ── Recent Visits Table ──
function RecentVisits() {
  const [visits, setVisits] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [replaySession, setReplaySession] = useState(null)
  const perPage = 30

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getRecentVisits(perPage, page * perPage)
      .then(data => {
        setVisits(data.visits || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / perPage)

  return (
    <>
    <Card title={`Recent Visits (${total})`} className="overflow-hidden">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visits.length === 0 ? (
        <p className="text-center text-sm text-slate-600 py-8">No visits yet</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-slate-500 text-xs border-b border-slate-800">
                  <th className="pb-2 pl-3 pr-1 w-12">#</th>
                  <th className="pb-2 px-1 w-20">Device</th>
                  <th className="pb-2 px-2">Date</th>
                  <th className="pb-2 px-2">Activity</th>
                  <th className="pb-2 px-2 text-right">Time</th>
                  <th className="pb-2 px-2 text-center">Views</th>
                  <th className="pb-2 px-2">Source</th>
                  <th className="pb-2 px-2 text-center">Visit #</th>
                  <th className="pb-2 px-2 text-center">Goals</th>
                  <th className="pb-2 px-2 pr-3 text-center">Replay</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v, i) => (
                  <VisitRow key={v.session_id} visit={v} index={i} offset={page * perPage} onPlayReplay={setReplaySession} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-xs text-slate-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </Card>
    {/* Replay modal */}
    {replaySession && (
      <ReplayModal sessionId={replaySession} onClose={() => setReplaySession(null)} />
    )}
    </>
  )
}

// ── Main page ──
// ── Traffic Sources Section ──
function TrafficSourcesSection() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getTrafficSources()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Card><div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div></Card>
  if (!data) return null

  const { sources = [], trend = [] } = data
  const sourceColors = { google: 'from-blue-600 to-blue-500', organic: 'from-slate-600 to-slate-500', facebook: 'from-indigo-600 to-indigo-500', unknown: 'from-slate-700 to-slate-600' }
  const barColors = { google: 'bg-blue-500', organic: 'bg-slate-500', facebook: 'bg-indigo-500', unknown: 'bg-slate-600' }

  // Find max daily total for chart scale
  const allSrcKeys = sources.map(s => s.source)
  const maxDay = Math.max(1, ...trend.map(d => allSrcKeys.reduce((sum, k) => sum + (d[k] || 0), 0)))

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Traffic Sources</h2>

      {/* Source summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sources.map(s => (
          <div key={s.source} className={`bg-gradient-to-br ${sourceColors[s.source] || sourceColors.unknown} rounded-xl p-4`}>
            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">{s.source}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.total}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-white/70">+{s.today} today</span>
              <span className="text-xs text-white/70">{s.total > 0 ? Math.round((s.premium / s.total) * 100) : 0}% PRO</span>
            </div>
          </div>
        ))}
      </div>

      {/* 14-day registration trend chart */}
      <Card title="Registrations by Source (14 days)">
        {trend.length > 0 ? (
          <div className="flex items-end gap-1.5 h-52">
            {trend.map((day, i) => {
              const total = allSrcKeys.reduce((sum, k) => sum + (day[k] || 0), 0)
              const heightPct = maxDay > 0 ? (total / maxDay) * 100 : 0
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs z-10 whitespace-nowrap">
                    <p className="font-semibold text-slate-300 mb-1">{day.date}</p>
                    {allSrcKeys.map(k => (
                      <div key={k} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${barColors[k] || barColors.unknown}`} />
                        <span className="text-slate-400">{k}: {day[k] || 0}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-700 mt-1 pt-1 text-slate-300 font-semibold">Total: {total}</div>
                  </div>
                  {/* Stacked bar */}
                  <div className="w-full flex flex-col-reverse rounded-t" style={{ height: `${Math.max(heightPct, total > 0 ? 8 : 0)}%` }}>
                    {allSrcKeys.map(k => {
                      const val = day[k] || 0
                      if (!val) return null
                      const segPct = (val / total) * 100
                      return <div key={k} className={`${barColors[k] || barColors.unknown} first:rounded-b last:rounded-t`} style={{ height: `${segPct}%`, minHeight: val > 0 ? 4 : 0 }} />
                    })}
                  </div>
                  {/* Value label on top of bar */}
                  {total > 0 && <span className="text-[10px] text-slate-400 font-mono mb-0.5 absolute bottom-full">{total}</span>}
                  {/* Date label */}
                  <span className="text-[9px] text-slate-600 mt-1 leading-none">{i % 2 === 0 ? day.date.slice(5) : ''}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-600 py-6">No registration data yet</p>
        )}
        {/* Legend */}
        {allSrcKeys.length > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800">
            {allSrcKeys.map(k => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${barColors[k] || barColors.unknown}`} />
                <span className="text-xs text-slate-500">{k}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
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

      {/* ═══ Traffic Sources ═══ */}
      <TrafficSourcesSection />

      {/* ═══ Recent Visits table (like Yandex Metrika) ═══ */}
      <RecentVisits />

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
          <div className="text-slate-600 text-xl">&rarr;</div>
          <div className="flex-1 text-center p-3 bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-400">{funnel.with_banner_click || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Banner Clicks</p>
          </div>
          <div className="text-slate-600 text-xl">&rarr;</div>
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
