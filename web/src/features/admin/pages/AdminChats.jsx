import { useState, useEffect } from 'react'
import { adminApi } from '../api'

export default function AdminChats() {
  const [supportStats, setSupportStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      adminApi.getSupportStats().catch(() => null),
      adminApi.getSupportSessions().catch(() => []),
    ]).then(([stats, sess]) => {
      setSupportStats(stats)
      setSessions(sess || [])
      setLoading(false)
    })
  }, [])

  const loadMessages = (sessionId) => {
    setSelectedSession(sessionId)
    setMsgLoading(true)
    adminApi.getSupportSessionMessages(sessionId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false))
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Chats</h1>
        <p className="text-sm text-slate-500 mt-1">Support and AI chat sessions</p>
      </div>

      {/* Stats */}
      {supportStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">Total Messages</p>
            <p className="text-2xl font-bold mt-1">{supportStats.total_messages.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">Sessions</p>
            <p className="text-2xl font-bold mt-1">{supportStats.total_sessions.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">Unique Users</p>
            <p className="text-2xl font-bold mt-1">{supportStats.unique_users.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sessions list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold">Support Sessions</h3>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
            {sessions.map(s => (
              <div
                key={s.session_id}
                onClick={() => loadMessages(s.session_id)}
                className={`px-5 py-3 cursor-pointer transition-colors ${
                  selectedSession === s.session_id ? 'bg-blue-600/10' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-slate-300 truncate max-w-[160px]">{s.session_id}</p>
                  <span className="text-[10px] text-slate-500">{s.message_count} msgs</span>
                </div>
                {s.last_message_at && (
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {new Date(s.last_message_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
            {!sessions.length && <p className="text-center text-sm text-slate-600 py-8">No sessions yet</p>}
          </div>
        </div>

        {/* Message viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold">
              {selectedSession ? `Session: ${selectedSession.slice(0, 12)}...` : 'Select a session'}
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
            {msgLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length > 0 ? (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                    m.role === 'user'
                      ? 'bg-blue-600/20 text-blue-100'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    <p className="text-[9px] text-slate-500 mb-1">{m.role}</p>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className="text-[8px] text-slate-600 mt-1">
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-slate-600 py-8">
                {selectedSession ? 'No messages' : 'Click a session to view messages'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
