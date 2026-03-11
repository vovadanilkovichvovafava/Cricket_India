import { useState, useEffect } from 'react'
import { adminApi } from '../api'

export default function AdminML() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getMLStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ML Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">Machine learning models and training data</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Models</p>
          <p className="text-2xl font-bold mt-1">{stats?.models?.length || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Training Data</p>
          <p className="text-2xl font-bold mt-1">{(stats?.total_training_data || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Learning Events</p>
          <p className="text-2xl font-bold mt-1">{stats?.learning_log?.length || 0}</p>
        </div>
      </div>

      {/* Models table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold">Registered Models</h3>
        </div>
        {stats?.models?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs">
                  <th className="text-left px-5 py-3 font-medium">Model</th>
                  <th className="text-left px-3 py-3 font-medium">Type</th>
                  <th className="text-center px-3 py-3 font-medium">Status</th>
                  <th className="text-right px-3 py-3 font-medium">Accuracy</th>
                  <th className="text-right px-5 py-3 font-medium">Samples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stats.models.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/20">
                    <td className="px-5 py-3 text-xs text-slate-300 font-medium">{m.name}</td>
                    <td className="px-3 py-3 text-xs text-slate-400 font-mono">{m.model_type}</td>
                    <td className="px-3 py-3 text-center">
                      {m.is_active ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Active</span>
                      ) : (
                        <span className="text-[10px] text-slate-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-mono">
                      <span className={m.accuracy >= 60 ? 'text-green-400' : m.accuracy >= 45 ? 'text-amber-400' : 'text-red-400'}>
                        {m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-mono text-slate-400">{m.training_samples || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-600 py-8">No models registered yet</p>
        )}
      </div>

      {/* Learning log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold">Learning Log</h3>
        </div>
        <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
          {(stats?.learning_log || []).map(l => (
            <div key={l.id} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">{l.description || l.event_type}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {l.created_at ? new Date(l.created_at).toLocaleString() : ''}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded mt-1 inline-block">{l.event_type}</span>
            </div>
          ))}
          {!stats?.learning_log?.length && <p className="text-center text-sm text-slate-600 py-8">No learning events</p>}
        </div>
      </div>
    </div>
  )
}
