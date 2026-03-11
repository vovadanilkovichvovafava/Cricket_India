import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api'

function BarChart({ data, color = 'blue' }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const bg = color === 'blue' ? 'bg-blue-500/40 hover:bg-blue-400/60' : 'bg-green-500/40 hover:bg-green-400/60'

  return (
    <div className="flex items-end gap-[2px] h-24 border-l border-b border-slate-700/50">
      {data.map((d, i) => (
        <div
          key={i}
          className={`flex-1 ${bg} rounded-t-sm min-w-[2px] transition-colors`}
          style={{ height: `${Math.max((d.count / max) * 100, 2)}%` }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  )
}

function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    adminApi.getUserProfile(userId)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [userId])

  if (!userId) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !profile ? (
          <div className="p-6 text-center text-slate-500">User not found</div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-200">{profile.user.name}</p>
                <p className="text-xs text-slate-500 mt-1">{profile.user.phone} ({profile.user.country_code})</p>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg">&times;</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6">
              {[
                { label: 'Predictions', value: profile.stats.total_predictions },
                { label: 'AI Sessions', value: profile.stats.ai_sessions },
                { label: 'Support Chats', value: profile.stats.support_sessions },
                { label: 'Referrals', value: profile.stats.referrals_count },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold mt-0.5 text-slate-200">{s.value}</p>
                </div>
              ))}
            </div>

            {profile.recent_predictions?.length > 0 && (
              <div className="px-6 pb-6">
                <h4 className="text-xs font-semibold text-slate-400 mb-3">Recent Predictions</h4>
                <div className="space-y-2">
                  {profile.recent_predictions.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-xs text-slate-300">{p.home_team} vs {p.away_team}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Predicted: {p.predicted_winner}</p>
                      </div>
                      <div className="text-right">
                        {p.is_correct === true && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">WIN</span>}
                        {p.is_correct === false && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">LOSS</span>}
                        {p.is_correct === null && <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">Pending</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('analytics')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [profileUserId, setProfileUserId] = useState(null)

  useEffect(() => {
    adminApi.getUsersStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const doSearch = useCallback((p = 1) => {
    setSearchLoading(true)
    setPage(p)
    adminApi.searchUsers(query, '', 'created_at', p)
      .then(setSearchResults)
      .catch(() => setSearchResults(null))
      .finally(() => setSearchLoading(false))
  }, [query])

  useEffect(() => {
    if (tab === 'search' && !searchResults) doSearch(1)
  }, [tab]) // eslint-disable-line

  const totalPages = searchResults ? Math.ceil(searchResults.total / searchResults.per_page) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-slate-500 mt-1">User analytics and search</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-lg w-fit border border-slate-800">
        {['analytics', 'search'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >{t === 'search' ? 'Search & Browse' : t}</button>
        ))}
      </div>

      {tab === 'analytics' && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-1">Registration Trend</h3>
            <p className="text-[11px] text-slate-500 mb-4">Last 30 days</p>
            <BarChart data={stats?.daily_registrations || []} color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">By Country</h3>
              <div className="space-y-3">
                {(stats?.by_country || []).map((c, i) => {
                  const total = (stats?.by_country || []).reduce((s, x) => s + x.count, 0) || 1
                  const pct = Math.round(c.count / total * 100)
                  return (
                    <div key={c.country}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{c.country || 'Unknown'}</span>
                        <span className="text-xs text-slate-400 font-mono">{c.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Recent Users</h3>
              <div className="space-y-2">
                {(stats?.recent_users || []).slice(0, 10).map(u => (
                  <div
                    key={u.id}
                    onClick={() => setProfileUserId(u.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs text-slate-300">{u.name}</p>
                      <p className="text-[10px] text-slate-600">{u.phone}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'search' && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 uppercase mb-1 block">Search</label>
                <input
                  type="text"
                  placeholder="Phone or name..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSearch(1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button onClick={() => doSearch(1)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Search</button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {searchResults ? `${searchResults.total} users found` : 'Users'}
              </h3>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => doSearch(page - 1)} disabled={page <= 1} className="text-xs px-2 py-1 bg-slate-800 rounded disabled:opacity-30">&larr;</button>
                  <span className="text-xs text-slate-400">{page} / {totalPages}</span>
                  <button onClick={() => doSearch(page + 1)} disabled={page >= totalPages} className="text-xs px-2 py-1 bg-slate-800 rounded disabled:opacity-30">&rarr;</button>
                </div>
              )}
            </div>
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs">
                      <th className="text-left px-5 py-3 font-medium">User</th>
                      <th className="text-left px-3 py-3 font-medium">Country</th>
                      <th className="text-right px-3 py-3 font-medium">Referrals</th>
                      <th className="text-right px-5 py-3 font-medium">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {(searchResults?.users || []).map(u => (
                      <tr key={u.id} onClick={() => setProfileUserId(u.id)} className="hover:bg-slate-800/30 cursor-pointer">
                        <td className="px-5 py-3">
                          <p className="text-xs text-slate-300">{u.name}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{u.phone}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400">{u.country_code}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono text-slate-400">{u.referral_count}</td>
                        <td className="px-5 py-3 text-right text-[11px] text-slate-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!searchResults?.users?.length && (
                  <p className="text-center text-sm text-slate-600 py-8">No users found</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  )
}
