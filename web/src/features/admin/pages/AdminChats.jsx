import { useState, useEffect } from 'react'
import { adminApi } from '../api'

const TABS = [
  { key: 'ai', label: 'AI Chat' },
  { key: 'support', label: 'Support' },
]

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{(value || 0).toLocaleString()}</p>
    </div>
  )
}

function MessageBubble({ m }) {
  return (
    <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
        m.role === 'user'
          ? 'bg-blue-600/20 text-blue-100'
          : 'bg-slate-800 text-slate-300'
      }`}>
        <p className="text-[9px] text-slate-500 mb-1">{m.role}</p>
        <p className="whitespace-pre-wrap break-words">{m.message}</p>
        {m.value_bets?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <p className="text-[9px] text-emerald-400 mb-1">Value Bets:</p>
            {m.value_bets.map((vb, i) => (
              <p key={i} className="text-[10px] text-slate-400">
                {vb.pick} @{vb.odds} ({vb.risk} risk)
              </p>
            ))}
          </div>
        )}
        <p className="text-[8px] text-slate-600 mt-1">
          {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
        </p>
      </div>
    </div>
  )
}

function AIChatTab() {
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      adminApi.getAIChatStats().catch(() => null),
      adminApi.getAIChatSessions().catch(() => []),
    ]).then(([s, sess]) => {
      setStats(s)
      setSessions(sess || [])
      setLoading(false)
    })
  }, [])

  const loadMessages = (userId) => {
    setSelectedUser(userId)
    setMsgLoading(true)
    adminApi.getAIChatMessages(userId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false))
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <>
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Total Messages" value={stats.total_messages} />
          <StatCard label="Conversations" value={stats.total_conversations} />
          <StatCard label="Unique Users" value={stats.unique_users} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sessions list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold">AI Chat Users</h3>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
            {sessions.map(s => (
              <div
                key={s.user_id}
                onClick={() => loadMessages(s.user_id)}
                className={`px-5 py-3 cursor-pointer transition-colors ${
                  selectedUser === s.user_id ? 'bg-blue-600/10' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-200">{s.name || s.phone}</p>
                    {s.name && <p className="text-[10px] text-slate-500">{s.phone}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">{s.message_count} msgs</span>
                    <span className="text-[10px] text-blue-400 ml-2">{s.user_messages} asks</span>
                  </div>
                </div>
                {s.last_message_at && (
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {new Date(s.last_message_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
            {!sessions.length && <p className="text-center text-sm text-slate-600 py-8">No AI chat sessions yet</p>}
          </div>
        </div>

        {/* Message viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold">
              {selectedUser ? `User #${selectedUser}` : 'Select a user'}
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
            {msgLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length > 0 ? (
              messages.map(m => <MessageBubble key={m.id} m={m} />)
            ) : (
              <p className="text-center text-sm text-slate-600 py-8">
                {selectedUser ? 'No messages' : 'Click a user to view conversation'}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function SupportTab() {
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      adminApi.getSupportStats().catch(() => null),
      adminApi.getSupportSessions().catch(() => []),
    ]).then(([s, sess]) => {
      setStats(s)
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

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <>
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Total Messages" value={stats.total_messages} />
          <StatCard label="Sessions" value={stats.total_sessions} />
          <StatCard label="Unique Users" value={stats.unique_users} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold">
              {selectedSession ? `Session: ${selectedSession.slice(0, 16)}...` : 'Select a session'}
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
            {msgLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length > 0 ? (
              messages.map(m => <MessageBubble key={m.id} m={m} />)
            ) : (
              <p className="text-center text-sm text-slate-600 py-8">
                {selectedSession ? 'No messages' : 'Click a session to view messages'}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function AdminChats() {
  const [tab, setTab] = useState('ai')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Chats</h1>
        <p className="text-sm text-slate-500 mt-1">AI Chat and Support conversations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ai' ? <AIChatTab /> : <SupportTab />}
    </div>
  )
}
