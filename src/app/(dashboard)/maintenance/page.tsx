'use client'

import { useState, useEffect } from 'react'
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  Search,
  Filter,
  Check,
  Edit3,
  Building2,
  X,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-context'

export default function MaintenancePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Update modal
  const [updatingTicket, setUpdatingTicket] = useState<any>(null)
  const [updateStatus, setUpdateStatus] = useState<'Needs Repair' | 'In Progress' | 'Repaired'>('In Progress')
  const [updateNotes, setUpdateNotes] = useState('')
  const [updateCost, setUpdateCost] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchMaintenance = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/maintenance')
      if (res.ok) {
        const json = await res.json()
        setItems(json.maintenance || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaintenance()
  }, [])

  const handleUpdateStatus = async (e: React.FormEvent) => {
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
        await fetchMaintenance()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingStatus(false)
    }
  }

  const filteredItems = items.filter((i) => {
    const matchesSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      (i.property && i.property.name.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || i.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const pendingCount = items.filter((i) => i.status === 'Needs Repair').length
  const inProgressCount = items.filter((i) => i.status === 'In Progress').length
  const repairedCount = items.filter((i) => i.status === 'Repaired').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance & Repairs Tracker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track issues reported across properties, oversee repairs, and verify completion.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Needs Repair (Pending)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Awaiting technician dispatch or quotation</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">In Progress</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {inProgressCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Technicians currently performing work on site</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Repaired & Verified</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {repairedCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Resolved repairs verified by assigned agents</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search repairs by title, property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
        >
          <option value="all">All Repair Statuses</option>
          <option value="Needs Repair">Needs Repair (Pending)</option>
          <option value="In Progress">In Progress</option>
          <option value="Repaired">Repaired / Completed</option>
        </select>
      </div>

      {/* List of Tickets */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-gray-700 dark:text-gray-300 font-semibold">No maintenance requests found</p>
          </div>
        ) : (
          filteredItems.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 shadow-xs transition flex flex-col md:flex-row justify-between md:items-center gap-4 ${
                ticket.status === 'Needs Repair'
                  ? 'border-amber-300 dark:border-amber-800/80'
                  : ticket.status === 'In Progress'
                  ? 'border-blue-300 dark:border-blue-800/80'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
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
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {ticket.property?.name}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {ticket.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                  {ticket.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 pt-1">
                  <span>Reported by: <strong>{ticket.requestedByName}</strong></span>
                  <span>&bull;</span>
                  <span>Owner: <strong>{ticket.landlord?.name}</strong></span>
                  <span>&bull;</span>
                  <span>Date: {formatDate(ticket.reportedDate)}</span>
                  {ticket.repairedDate && (
                    <>
                      <span>&bull;</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Resolved: {formatDate(ticket.repairedDate)}
                      </span>
                    </>
                  )}
                </div>

                {ticket.notes && (
                  <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg mt-1 inline-block">
                    <strong>Update Note:</strong> {ticket.notes}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-500">Estimated / Cost</p>
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
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Update Status
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: UPDATE STATUS */}
      {updatingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Update Repair Ticket</h3>
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

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ticket Status *
                </label>
                <select
                  value={updateStatus}
                  onChange={(e: any) => setUpdateStatus(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="Needs Repair">Needs Repair (Pending)</option>
                  <option value="In Progress">In Progress (Work Ongoing)</option>
                  <option value="Repaired">Repaired / Completed</option>
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
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Technician details, parts replaced, invoice receipt numbers, etc."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {savingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
