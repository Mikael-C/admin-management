'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, UserCheck, Wrench, ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { loginAs, loginWithEmail } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (email) {
      loginWithEmail(email)
    } else {
      router.push('/dashboard')
    }
  }

  const handleQuickLogin = (role: 'admin' | 'landlord' | 'agent') => {
    setLoading(true)
    setTimeout(() => {
      loginAs(role)
    }, 300)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12 text-slate-100">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 mb-2">
            <Building2 className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">EstatePro Multi-Role Portal</h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Unified management system with tailored dashboards for Administrators, Landlords, and Property Agents.
          </p>
        </div>

        {/* 1-Click Role Access Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Quick Role Sign-In (Select Persona to Explore)
            </p>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Instant Access
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin Card */}
            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              className="text-left group relative p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Full Control
                  </span>
                </div>
                <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition">
                  Super Administrator
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Overall authority. Manage all properties, rents, company revenues, and create users with roles.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-blue-400 font-medium">
                <span>Enter Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Landlord Card */}
            <button
              onClick={() => handleQuickLogin('landlord')}
              disabled={loading}
              className="text-left group relative p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Property Owner
                  </span>
                </div>
                <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition">
                  Landlord Dashboard
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  View your properties, revenue breakdown per property & combined, repair tracking, filtered rents & expenses.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-emerald-400 font-medium">
                <span>Enter Landlord Portal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Agent Card */}
            <button
              onClick={() => handleQuickLogin('agent')}
              disabled={loading}
              className="text-left group relative p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500 transition-all shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    Field Agent
                  </span>
                </div>
                <h3 className="font-bold text-white text-base group-hover:text-purple-400 transition">
                  Agent Dashboard
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Assigned properties only. Request maintenance, mark repairs completed, track tenant occupancy & vacated units.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-purple-400 font-medium">
                <span>Enter Agent Portal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Traditional Credentials Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/70 p-6 sm:p-8 shadow-xl max-w-md mx-auto w-full">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white">Or sign in with custom credentials</h2>
            <p className="text-xs text-slate-400 mt-0.5">Use your registered account email and password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@realestate.com"
                className="w-full border border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  Authorizing...
                </>
              ) : (
                'Sign In to Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Enterprise Real Estate Management System &bull; Multi-Role Role-Based Access Control
        </p>
      </div>
    </div>
  )
}
