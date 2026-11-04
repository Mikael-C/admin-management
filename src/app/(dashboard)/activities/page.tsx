'use client'

import { useState, useEffect } from 'react'
import { activitiesApi } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  User,
  ShieldCheck,
  Building2,
  Wrench,
  Briefcase,
  Clock,
  ArrowRight
} from 'lucide-react'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const limit = 30

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      }
      if (roleFilter !== 'all') params.role = roleFilter
      if (search.trim()) params.search = search.trim()

      const res = await activitiesApi.list(params)
      setActivities(res.activities || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [page, roleFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchActivities()
  }

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-3 h-3" /> Super Admin
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Briefcase className="w-3 h-3" /> Admin Staff
          </span>
        )
      case 'landlord':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Building2 className="w-3 h-3" /> Landlord
          </span>
        )
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Wrench className="w-3 h-3" /> Agent
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
            <User className="w-3 h-3" /> {role}
          </span>
        )
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('PAYOUT') || action.includes('DISBURSE')) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
    if (action.includes('INVOICE') || action.includes('RECEIPT')) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
    if (action.includes('NEWSLETTER')) return 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
    if (action.includes('LOGIN')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
    if (action.includes('DELETE') || action.includes('REJECT')) return 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
    return 'text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            System Activities
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time audit log of all actions performed by Admins, Landlords, and Agents across EstatePro.
          </p>
        </div>

        <button
          onClick={() => { setPage(1); fetchActivities() }}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by person name, action, or details..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admins</option>
            <option value="admin">Admin Staff</option>
            <option value="landlord">Landlords</option>
            <option value="agent">Agents</option>
          </select>
        </div>
      </div>

      {/* Activities Timeline List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs text-gray-400">Loading system activity audit trail...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Activity className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No activities recorded yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Any actions performed by admins, landlords, and agents (logins, payouts, rents, invoices, repairs) will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {activities.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0 mt-0.5 border border-gray-200 dark:border-gray-700">
                    {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-xs text-gray-900 dark:text-white">
                        {item.userName}
                      </span>
                      {getRoleBadge(item.userRole)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActionColor(item.action)}`}>
                        {item.action.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {item.description}
                    </p>

                    {item.entityType && (
                      <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span>Entity: {item.entityType}</span>
                        {item.entityId && <span>#{item.entityId}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString('en-NG', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} activities
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                ← Previous
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
