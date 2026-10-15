'use client'

import { useState, useEffect } from 'react'
import {
  UserCog,
  Plus,
  ShieldCheck,
  Building2,
  Wrench,
  UserCheck,
  Loader2,
  Search,
  Check,
  X,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/components/providers/auth-context'
import { formatDate } from '@/lib/utils'

export default function UsersPage() {
  const { user, loginAs, switchLandlord, switchAgent } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'landlord',
    phone: '',
    landlordId: '',
    agentId: '',
  })
  const [errorMsg, setErrorMsg] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const json = await res.json()
        setUsers(json.users || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setCreating(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowModal(false)
        setForm({
          name: '',
          email: '',
          role: 'landlord',
          phone: '',
          landlordId: '',
          agentId: '',
        })
        await fetchUsers()
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to create user')
      }
    } catch {
      setErrorMsg('Network error. Could not create user.')
    } finally {
      setCreating(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase()
    return matchesSearch && matchesRole
  })

  const adminCount = users.filter((u) => u.role === 'admin').length
  const landlordCount = users.filter((u) => u.role === 'landlord').length
  const agentCount = users.filter((u) => u.role === 'agent').length
  const tenantCount = users.filter((u) => u.role === 'tenant').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User & Role Management</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-semibold">
              Admin Power
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create system users and assign roles (Administrator, Landlord, Agent, or Tenant).
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Create User & Assign Role
        </button>
      </div>

      {/* Role Distribution Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Administrators</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Landlords</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{landlordCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Field Agents</span>
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{agentCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Tenants</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenantCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="landlord">Landlords</option>
          <option value="agent">Agents</option>
          <option value="tenant">Tenants</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role Details</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Switch / Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No users match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            u.role === 'admin'
                              ? 'bg-blue-600'
                              : u.role === 'landlord'
                              ? 'bg-emerald-600'
                              : u.role === 'agent'
                              ? 'bg-purple-600'
                              : 'bg-indigo-600'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                            <p className="text-[11px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize inline-flex items-center gap-1 ${
                          u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                            : u.role === 'landlord'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : u.role === 'agent'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                        }`}>
                          {u.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                          {u.role === 'landlord' && <Building2 className="w-3 h-3" />}
                          {u.role === 'agent' && <Wrench className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {u.phone || '—'}
                      </td>

                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {u.role === 'landlord' && (u.landlordId ? `Linked to Landlord #${u.landlordId}` : 'All properties')}
                        {u.role === 'agent' && (u.agentId ? `Assigned Agent #${u.agentId}` : 'Assigned Agent')}
                        {u.role === 'admin' && 'Full System Control'}
                        {u.role === 'tenant' && 'Tenant Profile'}
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {u.role === 'landlord' && (
                          <button
                            onClick={() => switchLandlord(u.landlordId || 1, u.name)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1"
                          >
                            Open Portal <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {u.role === 'agent' && (
                          <button
                            onClick={() => switchAgent(u.agentId || 1, u.name)}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1"
                          >
                            Open Portal <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {u.role === 'admin' && (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            Active Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE USER & ASSIGN ROLE */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Create User & Assign Role</h3>
                  <p className="text-xs text-gray-500">Configure credentials and permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senator David Adeleke"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign System Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="landlord">Landlord (Property Owner)</option>
                  <option value="agent">Agent (Field & Maintenance Manager)</option>
                  <option value="tenant">Tenant</option>
                  <option value="admin">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
