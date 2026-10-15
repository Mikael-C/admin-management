'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Wrench,
  Building2,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  Search,
  Filter,
  Check,
  Edit3,
  Calendar,
  X,
} from 'lucide-react'

export default function AgentDashboardPage() {
  const { user, switchAgent } = useAuth()
  const activeAgentId = user.agentId || 1

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'properties' | 'maintenance' | 'tenants'>('properties')

  // Modals & form state
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [newRequest, setNewRequest] = useState({
    propertyId: '',
    title: '',
    description: '',
    category: 'Plumbing',
    priority: 'Medium',
    estimatedCost: '50000',
  })

  // Update status modal
  const [updatingTicket, setUpdatingTicket] = useState<any>(null)
  const [updateStatus, setUpdateStatus] = useState<'Needs Repair' | 'In Progress' | 'Repaired'>('In Progress')
  const [updateNotes, setUpdateNotes] = useState('')
  const [updateCost, setUpdateCost] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  // Tenant status update modal
  const [updatingTenant, setUpdatingTenant] = useState<any>(null)
  const [tenantStatus, setTenantStatus] = useState<'Current' | 'Overdue' | 'Vacated'>('Vacated')
  const [tenantNotes, setTenantNotes] = useState('')
  const [vacatedDate, setVacatedDate] = useState(new Date().toISOString().split('T')[0])
  const [savingTenant, setSavingTenant] = useState(false)

  // Filters
  const [propSearch, setPropSearch] = useState('')
  const [tenantStatusFilter, setTenantStatusFilter] = useState('all')
  const [maintStatusFilter, setMaintStatusFilter] = useState('all')

  const fetchAgentData = async (agentId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/stats?agentId=${agentId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentData(activeAgentId)
  }, [activeAgentId])

  // Handle Maintenance Request Submit
  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRequest.propertyId || !newRequest.title || !newRequest.description) {
      alert('Please fill out all required fields')
      return
    }

    setSubmittingRequest(true)
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: parseInt(newRequest.propertyId),
          agentId: activeAgentId,
          requestedByName: user.name,
          title: newRequest.title,
          description: newRequest.description,
          category: newRequest.category,
          priority: newRequest.priority,
          estimatedCost: parseFloat(newRequest.estimatedCost) || 0,
        }),
      })

      if (res.ok) {
        setShowRequestModal(false)
        setNewRequest({
          propertyId: '',
          title: '',
          description: '',
          category: 'Plumbing',
          priority: 'Medium',
          estimatedCost: '50000',
        })
        await fetchAgentData(activeAgentId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Handle Maintenance Status Update
  const handleUpdateMaintenanceStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updatingTicket) return

    setSavingStatus(true)
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatingTicket.id,
          status: updateStatus,
          notes: updateNotes,
          actualCost: updateCost ? parseFloat(updateCost) : undefined,
        }),
      })

      if (res.ok) {
        setUpdatingTicket(null)
        setUpdateNotes('')
        setUpdateCost('')
        await fetchAgentData(activeAgentId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingStatus(false)
    }
  }

  // Handle Tenant Status Update (e.g. Mark Vacated)
  const handleUpdateTenantStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updatingTenant) return

    setSavingTenant(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: updatingTenant.id,
          status: tenantStatus,
          notes: tenantNotes,
          vacatedDate: tenantStatus === 'Vacated' ? vacatedDate : undefined,
        }),
      })

      if (res.ok) {
        setUpdatingTenant(null)
        setTenantNotes('')
        await fetchAgentData(activeAgentId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingTenant(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm text-gray-500">Loading assigned properties & field operations...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <p className="text-gray-500">Could not retrieve agent records.</p>
        <button
          onClick={() => fetchAgentData(activeAgentId)}
          className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  const { stats, assignedProperties, tenants, maintenance } = data

  const filteredProperties = assignedProperties.filter((p: any) =>
    !propSearch ||
    p.name.toLowerCase().includes(propSearch.toLowerCase()) ||
    p.address.toLowerCase().includes(propSearch.toLowerCase())
  )

  const filteredTenants = tenants.filter((t: any) =>
    tenantStatusFilter === 'all' ? true : t.status.toLowerCase() === tenantStatusFilter.toLowerCase()
  )

  const filteredMaintenance = maintenance.filter((m: any) =>
    maintStatusFilter === 'all' ? true : m.status.toLowerCase() === maintStatusFilter.toLowerCase()
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner / Agent Identity Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Wrench className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Property Agent Portal
              </span>
              <span className="text-xs text-white/60">• Assigned Agent #{activeAgentId}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1 text-white">{user.name}</h1>
            <p className="text-xs text-white/70">
              Responsible for {stats.assignedPropertiesCount} assigned properties &bull; Maintenance & tenant turnover management
            </p>
          </div>
        </div>

        {/* Action Button & Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Request Maintenance
          </button>

          <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-white/60 pl-2">Viewing as:</span>
            <select
              value={activeAgentId}
              onChange={(e) => switchAgent(parseInt(e.target.value))}
              className="bg-white/10 border-none rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-purple-400 text-xs cursor-pointer"
            >
              <option value={1} className="text-gray-900">Sarah Jenkins (Agent 1)</option>
              <option value={2} className="text-gray-900">Michael Okon (Agent 2)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Properties */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Assigned Properties</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {stats.assignedPropertiesCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Properties under your direct management</p>
        </div>

        {/* Active vs Vacant */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Occupancy & Vacancy</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.activeTenantsCount} Active
            </span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {stats.vacantPropertiesCount} Vacant Units
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Total managed tenants: {stats.totalTenantsCount}</p>
        </div>

        {/* Vacated Tenants */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vacated Tenants</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.vacatedTenantsCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Tenants moved out / units prepared for turnover</p>
        </div>

        {/* Maintenance Tickets */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Maintenance & Repairs</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-red-600 dark:text-red-400">
              {stats.pendingRepairsCount + stats.inProgressRepairsCount}
            </span>
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Active</span>
            <span className="text-xs text-gray-400">/ {stats.completedRepairsCount} Done</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{stats.pendingRepairsCount} pending, {stats.inProgressRepairsCount} in progress</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'properties'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Only My Assigned Properties</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {assignedProperties.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'maintenance'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance & Repairs</span>
          {stats.pendingRepairsCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 font-bold">
              {stats.pendingRepairsCount} Needs Action
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'tenants'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Tenant Occupancy & Vacated Tracker</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {tenants.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ASSIGNED PROPERTIES ONLY */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Properties Assigned to {user.name}
              </h2>
              <p className="text-xs text-gray-500">
                You only have visibility and management permissions over these assigned properties.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assigned properties..."
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((prop: any) => (
              <div
                key={prop.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex flex-col justify-between hover:border-purple-500/50 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {prop.type}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        prop.status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : prop.status === 'Needs Repair'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                    {prop.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">
                    {prop.address}, {prop.city}
                  </p>

                  <div className="space-y-1.5 text-xs py-2 border-t border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                    <p>
                      <strong>Landlord:</strong> {prop.landlord?.name || 'Assigned Owner'}
                    </p>
                    <p>
                      <strong>Contact:</strong> {prop.landlord?.phone || 'N/A'}
                    </p>
                    <p>
                      <strong>Management Fee:</strong> {formatCurrency(prop.managementFee)}
                    </p>
                    <p>
                      <strong>Active Tenants:</strong> {prop._count?.tenants || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setNewRequest({ ...newRequest, propertyId: prop.id.toString() })
                      setShowRequestModal(true)
                    }}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Request Maintenance
                  </button>
                  <span className="text-[10px] text-gray-400">ID: #{prop.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MAINTENANCE REQUESTS & STATUS UPDATING */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Maintenance Requests for Assigned Properties
              </h2>
              <p className="text-xs text-gray-500">
                Create new repair tickets and update the status when maintenance is completed.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={maintStatusFilter}
                onChange={(e) => setMaintStatusFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="Needs Repair">Needs Repair (Pending)</option>
                <option value="In Progress">In Progress</option>
                <option value="Repaired">Repaired / Completed</option>
              </select>

              <button
                onClick={() => setShowRequestModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Request
              </button>
            </div>
          </div>

          {/* Maintenance Items */}
          <div className="space-y-3">
            {filteredMaintenance.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold">No maintenance tickets found</p>
                <p className="text-xs text-gray-500 mt-1">Click "New Request" above to report a property issue.</p>
              </div>
            ) : (
              filteredMaintenance.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                          ticket.status === 'Needs Repair'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                            : ticket.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200'
                            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                        }`}
                      >
                        {ticket.status === 'Needs Repair' ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : ticket.status === 'In Progress' ? (
                          <Clock className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {ticket.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                        {ticket.category}
                      </span>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                        {ticket.property?.name || 'Property'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {ticket.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl">
                      {ticket.description}
                    </p>

                    {ticket.notes && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg mt-1 inline-block">
                        <strong>Resolution Notes:</strong> {ticket.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions & Cost */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-500">Est. Cost</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(ticket.actualCost || ticket.estimatedCost)}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUpdatingTicket(ticket)
                        setUpdateStatus(ticket.status === 'Needs Repair' ? 'In Progress' : 'Repaired')
                        setUpdateNotes(ticket.notes || '')
                        setUpdateCost(ticket.actualCost ? ticket.actualCost.toString() : ticket.estimatedCost.toString())
                      }}
                      className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Update Status
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TENANT OCCUPANCY & VACANCY TRACKER */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Tenant Occupancy & Vacated Tracker
              </h2>
              <p className="text-xs text-gray-500">
                Track tenants on your assigned properties, identify overdue payments, and update vacated tenants.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={tenantStatusFilter}
                onChange={(e) => setTenantStatusFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
              >
                <option value="all">All Tenant Statuses</option>
                <option value="Current">Current Active</option>
                <option value="Overdue">Rent Overdue</option>
                <option value="Vacated">Vacated (Moved Out)</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Tenant Name</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Annual Rent</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Due / Vacated Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No tenants found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                          <p className="text-[11px] text-gray-400">{t.phone} &bull; {t.email}</p>
                          {t.notes && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 italic">
                              Note: {t.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{t.property?.name}</p>
                          <p className="text-[11px] text-gray-400">{t.property?.address}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(t.rentAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              t.status === 'Current'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : t.status === 'Overdue'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {t.status === 'Vacated' && <UserX className="w-3 h-3" />}
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {t.status === 'Vacated' ? (
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              Vacated: {formatDate(t.vacatedDate)}
                            </span>
                          ) : (
                            <span>Due: {formatDate(t.nextDueDate)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setUpdatingTenant(t)
                              setTenantStatus(t.status)
                              setTenantNotes(t.notes || '')
                            }}
                            className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Update Status
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST MAINTENANCE */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Request Property Maintenance</h3>
                  <p className="text-xs text-gray-500">Submit a repair request on your assigned properties</p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Assigned Property *
                </label>
                <select
                  required
                  value={newRequest.propertyId}
                  onChange={(e) => setNewRequest({ ...newRequest, propertyId: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Choose Assigned Property --</option>
                  {assignedProperties.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom Ceiling Leakage"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newRequest.category}
                    onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Structural">Structural</option>
                    <option value="Painting">Painting</option>
                    <option value="HVAC">HVAC / Air Conditioning</option>
                    <option value="General">General Facility</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Repair Cost (₦)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={newRequest.estimatedCost}
                  onChange={(e) => setNewRequest({ ...newRequest, estimatedCost: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description & Observations *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue, affected units, technician requirements, etc."
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {submittingRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE MAINTENANCE STATUS */}
      {updatingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Update Maintenance Status</h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{updatingTicket.title}</p>
                </div>
              </div>
              <button
                onClick={() => setUpdatingTicket(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMaintenanceStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maintenance Status *
                </label>
                <select
                  value={updateStatus}
                  onChange={(e: any) => setUpdateStatus(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="Needs Repair">Needs Repair (Pending)</option>
                  <option value="In Progress">In Progress (Technician Deployed)</option>
                  <option value="Repaired">Repaired / Completed (Work Verified)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actual Repair Cost (₦)
                </label>
                <input
                  type="number"
                  placeholder="Actual amount invoiced"
                  value={updateCost}
                  onChange={(e) => setUpdateCost(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Resolution Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Technician details, parts replaced, invoice receipt numbers, etc."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingTicket(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {savingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE TENANT STATUS (E.G. VACATED) */}
      {updatingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Update Tenant Status</h3>
                  <p className="text-xs text-gray-500">{updatingTenant.name} &bull; {updatingTenant.property?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setUpdatingTenant(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTenantStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant Status *
                </label>
                <select
                  value={tenantStatus}
                  onChange={(e: any) => setTenantStatus(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="Current">Current (Active Lease)</option>
                  <option value="Overdue">Rent Overdue</option>
                  <option value="Vacated">Vacated (Tenant has moved out)</option>
                </select>
              </div>

              {tenantStatus === 'Vacated' && (
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vacated Date
                  </label>
                  <input
                    type="date"
                    value={vacatedDate}
                    onChange={(e) => setVacatedDate(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Handover & Inspection Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Keys surrendered, condition of unit, outstanding bills, refund notes, etc."
                  value={tenantNotes}
                  onChange={(e) => setTenantNotes(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingTenant(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTenant}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {savingTenant ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Update Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
