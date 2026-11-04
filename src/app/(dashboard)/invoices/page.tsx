'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { invoicesApi, propertiesApi, landlordsApi } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Eye,
  Trash2,
  Loader2,
  X,
  CreditCard,
  DollarSign,
  Download,
  Share2
} from 'lucide-react'

export default function InvoicesPage() {
  const { user, role } = useAuth()
  const isSuperAdminOrAdmin = role === 'super_admin' || role === 'admin'

  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 25

  // Filter options loaded from database
  const [propertiesList, setPropertiesList] = useState<any[]>([])
  const [landlordsList, setLandlordsList] = useState<any[]>([])

  // Active filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'Invoice' | 'Receipt'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'Pending' | 'Paid' | 'Overdue'
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [landlordFilter, setLandlordFilter] = useState('all')

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<any>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Generate Form state
  const [form, setForm] = useState({
    type: 'Invoice',
    recipientType: 'landlord', // 'landlord' | 'agent' | 'admin'
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    landlordId: '',
    propertyId: '',
    amount: '',
    description: '',
    status: 'Pending',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'EstatePro Management Ltd',
    notes: 'Thank you for your business. Please make payments to the account details provided above.',
  })

  // Load properties and landlords for filter dropdowns & generator
  useEffect(() => {
    async function loadMeta() {
      try {
        const [propsRes, lndRes] = await Promise.all([
          propertiesApi.list({ limit: '100' }),
          landlordsApi.list({ limit: '100' }),
        ])
        setPropertiesList(propsRes.properties || [])
        setLandlordsList(lndRes.landlords || [])
      } catch (err) {
        console.error('Failed to load filter options', err)
      }
    }
    loadMeta()
  }, [])

  // Fetch invoices with active filters
  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      }
      if (typeFilter !== 'all') params.type = typeFilter
      if (statusFilter !== 'all') params.status = statusFilter
      if (propertyFilter !== 'all') params.propertyId = propertyFilter
      if (landlordFilter !== 'all') params.landlordId = landlordFilter
      if (search.trim()) params.search = search.trim()

      const res = await invoicesApi.list(params)
      setInvoices(res.invoices || [])
      setTotal(res.total || 0)
      setTotalAmount(res.totalAmount || 0)
      setPaidAmount(res.paidAmount || 0)
      setPendingAmount(res.pendingAmount || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [page, typeFilter, statusFilter, propertyFilter, landlordFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInvoices()
  }

  // Handle landlord selection in form to auto-fill recipient info
  const handleSelectLandlordInForm = (idStr: string) => {
    if (!idStr) {
      setForm(prev => ({ ...prev, landlordId: '', recipientName: '', recipientEmail: '', recipientPhone: '' }))
      return
    }
    const found = landlordsList.find(l => String(l.id) === idStr)
    if (found) {
      setForm(prev => ({
        ...prev,
        landlordId: idStr,
        recipientName: found.name || '',
        recipientEmail: found.email || '',
        recipientPhone: found.phone || '',
      }))
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.recipientName.trim() || !form.amount || parseFloat(form.amount) <= 0) {
      setStatusMsg({ type: 'error', text: 'Please fill in recipient name and a valid amount.' })
      return
    }

    setGenerating(true)
    setStatusMsg(null)
    try {
      const res: any = await invoicesApi.create({
        ...form,
        amount: parseFloat(form.amount),
        landlordId: form.landlordId ? parseInt(form.landlordId) : undefined,
        propertyId: form.propertyId ? parseInt(form.propertyId) : undefined,
      })

      setStatusMsg({ type: 'success', text: res?.message || 'Invoice/Receipt generated successfully!' })
      setShowGenerateModal(false)
      // Reset form
      setForm({
        type: 'Invoice',
        recipientType: 'landlord',
        recipientName: '',
        recipientEmail: '',
        recipientPhone: '',
        landlordId: '',
        propertyId: '',
        amount: '',
        description: '',
        status: 'Pending',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'EstatePro Management Ltd',
        notes: 'Thank you for your business. Please make payments to the account details provided above.',
      })
      await fetchInvoices()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to generate invoice.' })
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkAsPaid = async (id: number) => {
    try {
      await invoicesApi.updateStatus(id, 'Paid')
      await fetchInvoices()
      if (viewingInvoice && viewingInvoice.id === id) {
        setViewingInvoice((prev: any) => ({ ...prev, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this invoice?')) return
    try {
      await invoicesApi.delete(id)
      await fetchInvoices()
      if (viewingInvoice && viewingInvoice.id === id) setViewingInvoice(null)
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-3.5 h-3.5" /> Overdue
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Cancelled
          </span>
        )
      default: // Pending
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Invoices & Receipts
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate, issue, and manage official invoices and payment receipts for landlords, agents, and staff.
          </p>
        </div>

        {isSuperAdminOrAdmin && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Generate Invoice / Receipt
          </button>
        )}
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs text-gray-400">Total Value Issued</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalAmount)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{total} total documents</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs text-gray-400">Total Collected / Paid</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(paidAmount)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Verified settlements</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs text-gray-400">Total Pending Settlement</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(pendingAmount)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Awaiting payment</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs text-gray-400">Document Breakdown</span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Invoices
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Receipts
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar with Property and Landlord Selectors */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice #, recipient, description..."
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

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
              className="text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="Invoice">Invoices</option>
              <option value="Receipt">Receipts</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Property and Landlord Dedicated Filter Row */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 shrink-0">Filter Property:</span>
            <select
              value={propertyFilter}
              onChange={(e) => { setPropertyFilter(e.target.value); setPage(1) }}
              className="w-full text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Properties ({propertiesList.length})</option>
              {propertiesList.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.name || p.address}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 shrink-0">Filter Landlord:</span>
            <select
              value={landlordFilter}
              onChange={(e) => { setLandlordFilter(e.target.value); setPage(1) }}
              className="w-full text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Landlords ({landlordsList.length})</option>
              {landlordsList.map(l => (
                <option key={l.id} value={l.id}>
                  #{l.id} - {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs text-gray-400">Loading invoices & receipts...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 px-4">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No invoices or receipts found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {isSuperAdminOrAdmin
                ? 'Generate an invoice or receipt using the button above to begin.'
                : 'No financial documents have been issued to your account yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">Doc #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.type === 'Receipt'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{inv.recipientName}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{inv.recipientType}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                      {inv.property?.name || inv.property?.address || (inv.landlord?.name ? `Landlord: ${inv.landlord.name}` : 'General')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1"
                          title="View & Print"
                        >
                          <Eye className="w-3 h-3" /> View / Print
                        </button>

                        {isSuperAdminOrAdmin && inv.status === 'Pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(inv.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg transition"
                            title="Mark as Paid"
                          >
                            Mark Paid
                          </button>
                        )}

                        {role === 'super_admin' && (
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} documents
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                ← Previous
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Generate {form.type}
                  </h3>
                  <p className="text-xs text-gray-500">Create an official invoice or receipt for stakeholders</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              {/* Document Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'Invoice', status: 'Pending' })}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    form.type === 'Invoice'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <p className="text-sm">Invoice</p>
                  <p className="text-[10px] font-normal opacity-80 mt-0.5">Request for payment</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'Receipt', status: 'Paid' })}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    form.type === 'Receipt'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <p className="text-sm">Receipt</p>
                  <p className="text-[10px] font-normal opacity-80 mt-0.5">Proof of payment received</p>
                </button>
              </div>

              {/* Recipient Role Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'landlord', label: 'Landlord' },
                  { id: 'agent', label: 'Agent' },
                  { id: 'admin', label: 'Staff / Admin' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm({ ...form, recipientType: r.id })}
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition ${
                      form.recipientType === r.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Link Landlord (if landlord) */}
              {form.recipientType === 'landlord' && (
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Select Landlord (Auto-fills details)
                  </label>
                  <select
                    value={form.landlordId}
                    onChange={(e) => handleSelectLandlordInForm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose registered landlord or type custom below --</option>
                    {landlordsList.map(l => (
                      <option key={l.id} value={l.id}>
                        #{l.id} - {l.name} ({l.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    placeholder="e.g. Chief Adebayo"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Phone
                  </label>
                  <input
                    type="text"
                    value={form.recipientPhone}
                    onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
                    placeholder="08012345678"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Link Property & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Related Property (Optional)
                  </label>
                  <select
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">-- No specific property / General --</option>
                    {propertiesList.map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {p.name || p.address}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 250000"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description / Purpose of Payment *
                </label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Property Management Fee (Q4 2026) or Legal Documentation Charge"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Due Date (for Invoices)
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Settlement Bank Details */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                <p className="font-bold text-gray-800 dark:text-gray-200">Company Remittance Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="Bank Name"
                    className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="Account Number"
                    className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    placeholder="Account Name"
                    className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Generate & Dispatch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print Printable Document Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
            {/* Modal Controls (Hidden when printing) */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 print:hidden">
              <span className="text-xs text-gray-400 font-mono">ID #{viewingInvoice.id}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="space-y-6 text-gray-900 dark:text-white print:text-black">
              {/* Top Banner: Logo & Title */}
              <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                      EP
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight leading-tight">EstatePro</h2>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Management Ltd</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 max-w-xs">
                    Victoria Island &bull; Lagos &bull; Abuja &bull; Enugu, Nigeria
                  </p>
                </div>

                <div className="text-right">
                  <h1 className={`text-2xl font-black uppercase tracking-wider ${
                    viewingInvoice.type === 'Receipt' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    {viewingInvoice.type}
                  </h1>
                  <p className="font-mono text-xs font-bold mt-1 text-gray-700 dark:text-gray-300">
                    {viewingInvoice.invoiceNo}
                  </p>
                  <div className="mt-1.5">{getStatusBadge(viewingInvoice.status)}</div>
                </div>
              </div>

              {/* Billed To & Dates */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Recipient</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-1">{viewingInvoice.recipientName}</p>
                  {viewingInvoice.recipientEmail && <p className="text-gray-500">{viewingInvoice.recipientEmail}</p>}
                  {viewingInvoice.recipientPhone && <p className="text-gray-500">{viewingInvoice.recipientPhone}</p>}
                  <p className="text-gray-400 text-[10px] capitalize mt-0.5">Role: {viewingInvoice.recipientType}</p>
                </div>

                <div className="text-right space-y-1 text-gray-600 dark:text-gray-300">
                  <p><strong>Issue Date:</strong> {formatDate(viewingInvoice.issueDate)}</p>
                  {viewingInvoice.dueDate && <p><strong>Due Date:</strong> {formatDate(viewingInvoice.dueDate)}</p>}
                  {viewingInvoice.paidDate && (
                    <p className="text-emerald-600 font-semibold">
                      <strong>Settled On:</strong> {formatDate(viewingInvoice.paidDate)}
                    </p>
                  )}
                  {viewingInvoice.property && (
                    <p><strong>Property:</strong> {viewingInvoice.property.name || viewingInvoice.property.address}</p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Item Description</th>
                      <th className="px-4 py-2.5 text-right">Amount (NGN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {viewingInvoice.description || 'Property management fee and administrative services'}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-sm">
                        {formatCurrency(viewingInvoice.amount)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold border-t border-gray-200 dark:border-gray-700">
                    <tr>
                      <td className="px-4 py-2.5 text-right uppercase text-[10px] text-gray-500">Total Amount</td>
                      <td className="px-4 py-2.5 text-right text-base font-black text-gray-900 dark:text-white">
                        {formatCurrency(viewingInvoice.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Remittance Bank Info */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-xs">
                <p className="font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px] tracking-wider mb-1">
                  Payment Instructions
                </p>
                <div className="grid grid-cols-3 gap-2 text-gray-600 dark:text-gray-400 text-[11px]">
                  <div>Bank: <strong className="text-gray-900 dark:text-white">{viewingInvoice.bankName || 'Access Bank'}</strong></div>
                  <div>Account #: <strong className="text-gray-900 dark:text-white font-mono">{viewingInvoice.accountNumber || '0123456789'}</strong></div>
                  <div>Name: <strong className="text-gray-900 dark:text-white">{viewingInvoice.accountName || 'EstatePro Ltd'}</strong></div>
                </div>
                {viewingInvoice.notes && (
                  <p className="text-gray-500 text-[11px] mt-2 italic border-t border-gray-200/60 dark:border-gray-700 pt-1.5">
                    {viewingInvoice.notes}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-[10px] text-gray-400">
                This is a computer-generated official {viewingInvoice.type.toLowerCase()} by EstatePro Management System. Valid without signature.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
