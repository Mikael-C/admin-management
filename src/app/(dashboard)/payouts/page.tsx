'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { payoutsApi } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DollarSign, Loader2, Plus, X, Check, Ban,
  Clock, CheckCircle2, Banknote, AlertCircle, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  Pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200', icon: Clock },
  Approved:  { label: 'Approved',  color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',   icon: CheckCircle2 },
  Disbursed: { label: 'Disbursed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200', icon: Banknote },
  Rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',       icon: Ban },
}

export default function PayoutsPage() {
  const { user } = useAuth()
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [actionTarget, setActionTarget] = useState<{ id: number; action: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  // Form state
  const [form, setForm] = useState({
    amount: '',
    description: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  })

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin'
  const isLandlord = user?.role === 'landlord'

  async function load() {
    setLoading(true)
    try {
      const res = await payoutsApi.list(filterStatus !== 'all' ? { status: filterStatus } : {})
      setPayouts(res.payouts || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [filterStatus])

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      alert('Please enter a valid payout amount.')
      return
    }
    setSubmitting(true)
    try {
      await payoutsApi.request({
        amount: parseFloat(form.amount),
        description: form.description,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
      })
      setShowForm(false)
      setForm({ amount: '', description: '', bankName: '', accountNumber: '', accountName: '' })
      await load()
    } catch (err: any) {
      alert(err.message || 'Failed to submit payout request.')
    }
    setSubmitting(false)
  }

  async function handleAction(id: number, action: string) {
    setSubmitting(true)
    try {
      if (action === 'approve') await payoutsApi.approve(id, actionNote)
      else if (action === 'disburse') await payoutsApi.disburse(id, actionNote)
      else if (action === 'reject') await payoutsApi.reject(id, actionNote)
      setActionTarget(null)
      setActionNote('')
      await load()
    } catch (err: any) {
      alert(err.message || 'Action failed.')
    }
    setSubmitting(false)
  }

  const filtered = filterStatus === 'all' ? payouts : payouts.filter(p => p.status === filterStatus)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Payout Requests
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLandlord ? 'Request and track your payout disbursements' : 'Review and manage landlord payout requests'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Disbursed">Disbursed</option>
            <option value="Rejected">Rejected</option>
          </select>

          {isLandlord && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition"
            >
              <Plus className="w-4 h-4" /> Request Payout
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const Icon = cfg.icon
          const count = payouts.filter(p => p.status === status).length
          const total = payouts.filter(p => p.status === status).reduce((s, p) => s + p.amount, 0)
          return (
            <div key={status} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{status}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{count}</p>
              <p className="text-xs text-gray-400">{formatCurrency(total)}</p>
            </div>
          )
        })}
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Request Payout</h3>
                <p className="text-xs text-gray-500">Submit a payout request to the admin</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitRequest} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500000"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  placeholder="Reason for payout (optional)"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                  <input
                    placeholder="e.g. First Bank"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                  <input
                    placeholder="0123456789"
                    value={form.accountNumber}
                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                <input
                  placeholder="Name on account"
                  value={form.accountName}
                  onChange={e => setForm({ ...form, accountName: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 capitalize">
              {actionTarget.action} Payout
            </h3>
            <p className="text-xs text-gray-500 mb-4">Add an optional note for this action.</p>
            <textarea
              rows={3}
              placeholder="Admin note (optional)..."
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setActionTarget(null); setActionNote('') }} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionTarget.id, actionTarget.action)}
                disabled={submitting}
                className={cn(
                  'flex-1 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2',
                  actionTarget.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  actionTarget.action === 'approve' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payouts Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No payout requests found</p>
          {isLandlord && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-emerald-600 text-sm font-semibold hover:underline">
              Make your first request →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {isAdmin && <th className="px-4 py-3">Landlord</th>}
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Bank Details</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((payout: any) => {
                  const cfg = statusConfig[payout.status] || statusConfig.Pending
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {isAdmin && (
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {payout.landlord?.name}
                        </td>
                      )}
                      <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <p className="font-medium">{payout.bankName || '—'}</p>
                        <p className="text-gray-400">{payout.accountNumber || ''}</p>
                        <p className="text-gray-400">{payout.accountName || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">
                        {payout.description || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold', cfg.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {payout.status}
                        </span>
                        {payout.adminNote && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">{payout.adminNote}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(payout.requestedAt)}
                        {payout.disbursedAt && (
                          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Paid: {formatDate(payout.disbursedAt)}
                          </p>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {payout.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => setActionTarget({ id: payout.id, action: 'approve' })}
                                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => setActionTarget({ id: payout.id, action: 'reject' })}
                                  className="px-2.5 py-1 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800 flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {payout.status === 'Approved' && (
                              <button
                                onClick={() => setActionTarget({ id: payout.id, action: 'disburse' })}
                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                              >
                                <Banknote className="w-3 h-3" /> Disburse
                              </button>
                            )}
                            {(payout.status === 'Disbursed' || payout.status === 'Rejected') && (
                              <span className="text-xs text-gray-400 italic">No action</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
