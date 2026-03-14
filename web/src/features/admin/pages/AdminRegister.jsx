import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminRegister() {
  const { register } = useAdminAuth()
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(inviteCode, username, password, name)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white">
            OP
          </div>
          <h1 className="text-lg font-semibold text-slate-100">Admin Registration</h1>
          <p className="text-xs text-slate-500 mt-1">Enter your invite code to register</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Invite Code</label>
          <input
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none transition-colors font-mono"
            placeholder="optional"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="John"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="admin"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/admin/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
