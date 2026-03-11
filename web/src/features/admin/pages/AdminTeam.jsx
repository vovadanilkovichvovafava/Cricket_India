import { useState, useEffect } from 'react'
import { adminApi } from '../api'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminTeam() {
  const { admin } = useAdminAuth()
  const [team, setTeam] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newRole, setNewRole] = useState('admin')
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    Promise.all([
      adminApi.getTeam().catch(() => []),
      adminApi.getInvites().catch(() => []),
    ]).then(([t, i]) => {
      setTeam(t || [])
      setInvites(i || [])
      setLoading(false)
    })
  }, [])

  const handleCreateInvite = async () => {
    setCreating(true)
    try {
      const result = await adminApi.createInvite(newRole)
      // Refresh invites
      const updated = await adminApi.getInvites().catch(() => invites)
      setInvites(updated || invites)
      // Copy code
      if (result?.code) {
        navigator.clipboard?.writeText(result.code)
        setCopiedCode(result.code)
        setTimeout(() => setCopiedCode(null), 3000)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const roleColors = {
    superadmin: 'bg-red-500/20 text-red-400',
    owner: 'bg-red-500/20 text-red-400',
    admin: 'bg-blue-500/20 text-blue-400',
    editor: 'bg-slate-700 text-slate-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="text-sm text-slate-500 mt-1">Manage admin access and invite codes</p>
      </div>

      {/* Team members */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold">Team Members ({team.length})</h3>
        </div>
        <div className="divide-y divide-slate-800/50">
          {team.map(a => (
            <div key={a.id} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  {a.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{a.name}</p>
                  <p className="text-[10px] text-slate-500">@{a.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${roleColors[a.role] || 'bg-slate-800 text-slate-400'}`}>
                  {a.role}
                </span>
                {!a.is_active && <span className="text-[10px] text-red-400">disabled</span>}
                {a.last_login_at && (
                  <span className="text-[10px] text-slate-600">
                    Last: {new Date(a.last_login_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create invite */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Create Invite Code</h3>
        <div className="flex items-end gap-3">
          <div>
            <label className="text-[10px] text-slate-500 uppercase mb-1 block">Role</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              {(admin?.role === 'superadmin' || admin?.role === 'owner') && (
                <option value="superadmin">Superadmin</option>
              )}
            </select>
          </div>
          <button
            onClick={handleCreateInvite}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {creating ? 'Creating...' : 'Generate Invite'}
          </button>
        </div>
      </div>

      {/* Invite codes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold">Invite Codes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs">
                <th className="text-left px-5 py-3 font-medium">Code</th>
                <th className="text-left px-3 py-3 font-medium">Role</th>
                <th className="text-center px-3 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {invites.map(i => (
                <tr key={i.id} className="hover:bg-slate-800/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-slate-300">{i.code}</code>
                      {!i.is_used && (
                        <button
                          onClick={() => copyCode(i.code)}
                          className="text-[10px] text-blue-400 hover:text-blue-300"
                        >
                          {copiedCode === i.code ? 'Copied!' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${roleColors[i.role] || 'bg-slate-800 text-slate-400'}`}>
                      {i.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {i.is_used ? (
                      <span className="text-[10px] text-slate-600">Used</span>
                    ) : (
                      <span className="text-[10px] text-green-400">Available</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-[11px] text-slate-500">
                    {i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {!invites.length && (
                <tr><td colSpan={4} className="text-center text-sm text-slate-600 py-8">No invite codes yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
