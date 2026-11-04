'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, UserCheck, Wrench, ArrowRight, Info } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    setError('')

    const result = await login(email.trim(), password)

    if (result.success) {
      router.push(result.redirectTo || '/dashboard')
    } else {
      setError(result.error || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12 text-slate-100">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 mb-2">
            <Building2 className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">EstatePro Portal</h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Secure multi-role real estate management platform
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/70 p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">Use your registered email and password</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700/50 text-red-300 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@estatepro.com"
                className="w-full border border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-600 rounded-xl px-4 py-2.5 pr-12 text-sm bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500/50 text-white font-semibold rounded-xl py-2.5 text-sm transition flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>
        </div>

        {/* Role Hints */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default Login Credentials</p>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-slate-400">Super Admin:</span>
              <code className="text-blue-300">superadmin@estatepro.com</code>
              <span className="text-slate-500">/</span>
              <code className="text-blue-300">Admin@2024</code>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Wrench className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-slate-400">Agent:</span>
              <code className="text-purple-300">agent.sarah@estatepro.com</code>
              <span className="text-slate-500">/</span>
              <code className="text-purple-300">Agent@2024</code>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Landlords:</span>
              <span className="text-slate-400">see credentials file or contact admin</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          EstatePro Management System • Secure Multi-Role Access Control
        </p>
      </div>
    </div>
  )
}
