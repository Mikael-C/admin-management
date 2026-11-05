'use client'

import { useState, useEffect } from 'react'
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
  DollarSign,
  Download,
  Image as ImageIcon,
  ZoomIn,
  Receipt,
  Home,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Invoice {
  id: number
  invoiceNo: string
  type: 'Invoice' | 'Receipt'
  recipientType: string
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  landlordId?: number
  propertyId?: number
  amount: number
  description?: string
  items?: string
  status: string
  issueDate: string
  dueDate?: string
  paidDate?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  notes?: string
  imageUrl?: string
  landlord?: { id: number; name: string }
  property?: { id: number; address: string; name?: string }
}

interface GroupedReceipts {
  [landlordName: string]: {
    landlordId: number
    properties: {
      [propertyAddress: string]: {
        propertyId: number
        receipts: Invoice[]
      }
    }
  }
}

export default function InvoicesPage() {
  const { user, role } = useAuth()
  const isSuperAdminOrAdmin = role === 'super_admin' || role === 'admin'

  // View tabs
  const [activeTab, setActiveTab] = useState<'list' | 'gallery'>('list')

  // List Data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 25

  // Gallery Data
  const [galleryReceipts, setGalleryReceipts] = useState<Invoice[]>([])
  const [groupedReceipts, setGroupedReceipts] = useState<GroupedReceipts>({})
  const [expandedLandlords, setExpandedLandlords] = useState<Set<string>>(new Set())
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set())
  const [galleryLoading, setGalleryLoading] = useState(false)

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
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; invoice: Invoice } | null>(null)
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

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) setLightboxImage(null)
        else if (viewingInvoice) setViewingInvoice(null)
        else if (showGenerateModal) setShowGenerateModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage, viewingInvoice, showGenerateModal])

  // Load properties and landlords for filter dropdowns & generator
  useEffect(() => {
    async function loadMeta() {
      try {
        const [propsRes, lndRes] = await Promise.all([
          propertiesApi.list({ limit: '200' }),
          landlordsApi.list({ limit: '200' }),
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

  // Fetch all receipts for gallery view
  const fetchGallery = async () => {
    setGalleryLoading(true)
    try {
      const res = await invoicesApi.list({ type: 'Receipt', limit: '500' })
      const all: Invoice[] = res.invoices || []
      setGalleryReceipts(all)

      // Group by landlord -> property
      const groups: GroupedReceipts = {}
      for (const inv of all) {
        const lName = inv.landlord?.name || inv.recipientName || 'Unassigned Landlord'
        const pAddr = inv.property?.address || inv.property?.name || 'Unassigned Property'
        const lId = inv.landlordId || 0
        const pId = inv.propertyId || 0
        if (!groups[lName]) groups[lName] = { landlordId: lId, properties: {} }
        if (!groups[lName].properties[pAddr]) groups[lName].properties[pAddr] = { propertyId: pId, receipts: [] }
        groups[lName].properties[pAddr].receipts.push(inv)
      }
      setGroupedReceipts(groups)

      // Expand all by default
      setExpandedLandlords(new Set(Object.keys(groups)))
      const propKeys = new Set<string>()
      Object.entries(groups).forEach(([l, { properties }]) => {
        Object.keys(properties).forEach(p => propKeys.add(`${l}::${p}`))
      })
      setExpandedProperties(propKeys)
    } catch (err) {
      console.error('Failed to load gallery receipts', err)
    } finally {
      setGalleryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGallery()
    }
  }, [activeTab])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInvoices()
  }

  const toggleLandlord = (name: string) => {
    setExpandedLandlords(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleProperty = (key: string) => {
    setExpandedProperties(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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

      setStatusMsg({ type: 'success', text: res?.message || `${form.type} generated successfully!` })
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
      if (activeTab === 'gallery') await fetchGallery()
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
        setViewingInvoice(prev => prev ? ({ ...prev, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] }) : null)
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
      if (activeTab === 'gallery') await fetchGallery()
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Invoices &amp; Receipts
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
          <span className="text-xs text-gray-400">Active Landlords</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{landlordsList.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{propertiesList.length} registered properties</p>
        </div>
      </div>

      {/* Tab Switcher: List vs Gallery */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'list'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" /> All Invoices &amp; Receipts
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'gallery'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Landlord Receipt Gallery
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIST VIEW                                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by invoice number, recipient name, description..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                  className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="Invoice">Invoices Only</option>
                  <option value="Receipt">Receipts Only</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                {/* Landlord Filter */}
                <select
                  value={landlordFilter}
                  onChange={(e) => { setLandlordFilter(e.target.value); setPage(1) }}
                  className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white max-w-44 truncate"
                >
                  <option value="all">All Landlords</option>
                  {landlordsList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>

                {/* Property Filter */}
                <select
                  value={propertyFilter}
                  onChange={(e) => { setPropertyFilter(e.target.value); setPage(1) }}
                  className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white max-w-48 truncate"
                >
                  <option value="all">All Properties</option>
                  {propertiesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address || p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Loading invoices and receipts...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              No invoices or receipts found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3">Doc #</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Recipient</th>
                    <th className="px-5 py-3">Property</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Issue Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        {inv.invoiceNo}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.type === 'Receipt'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{inv.recipientName}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{inv.recipientType}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                        {inv.property?.address || inv.property?.name || '—'}
                      </td>
                      <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-5 py-3">{getStatusBadge(inv.status)}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== 'Paid' && isSuperAdminOrAdmin && (
                            <button
                              onClick={() => handleMarkAsPaid(inv.id)}
                              title="Mark as Paid"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            title="View / Print Document"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isSuperAdminOrAdmin && (
                            <button
                              onClick={() => handleDelete(inv.id)}
                              title="Delete Document"
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: RECEIPT GALLERY (CATEGORIZED BY LANDLORD & PROPERTY)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {galleryLoading ? (
            <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Loading categorized receipts...
            </div>
          ) : Object.keys(groupedReceipts).length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700 dark:text-gray-300">No receipts found</p>
              <p className="text-gray-400 mt-1">Receipts categorized by landlord and property will appear here.</p>
            </div>
          ) : (
            Object.entries(groupedReceipts).map(([landlordName, { properties }]) => {
              const landlordReceiptCount = Object.values(properties).reduce((s, p) => s + p.receipts.length, 0)
              const landlordTotalAmount = Object.values(properties).reduce((s, p) => s + p.receipts.reduce((rs, r) => rs + (r.amount || 0), 0), 0)
              const isLandlordExpanded = expandedLandlords.has(landlordName)

              return (
                <div key={landlordName} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                  {/* Landlord Accordion Header */}
                  <button
                    onClick={() => toggleLandlord(landlordName)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{landlordName}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Object.keys(properties).length} {Object.keys(properties).length === 1 ? 'property' : 'properties'} •{' '}
                          {landlordReceiptCount} {landlordReceiptCount === 1 ? 'receipt' : 'receipts'} •{' '}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(landlordTotalAmount)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {isLandlordExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Properties List Under This Landlord */}
                  {isLandlordExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                      {Object.entries(properties).map(([propAddress, { receipts: propReceipts }]) => {
                        const key = `${landlordName}::${propAddress}`
                        const isPropExpanded = expandedProperties.has(key)
                        const propTotal = propReceipts.reduce((s, r) => s + (r.amount || 0), 0)

                        return (
                          <div key={propAddress} className="bg-gray-50/30 dark:bg-gray-900/40">
                            {/* Property Subheader */}
                            <button
                              onClick={() => toggleProperty(key)}
                              className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition text-left"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                  <Home className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{propAddress}</p>
                                  <p className="text-[11px] text-gray-500">
                                    {propReceipts.length} receipts • {formatCurrency(propTotal)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-gray-400">
                                {isPropExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </div>
                            </button>

                            {/* Receipts Grid */}
                            {isPropExpanded && (
                              <div className="px-6 pb-6 pt-2">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                  {propReceipts.map((receipt) => (
                                    <div
                                      key={receipt.id}
                                      onClick={() => setViewingInvoice(receipt)}
                                      className="group relative bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-700/80 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col"
                                    >
                                      {/* Thumbnail area */}
                                      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                                        {receipt.imageUrl ? (
                                          <>
                                            <img
                                              src={receipt.imageUrl}
                                              alt={`Receipt ${receipt.invoiceNo}`}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.style.display = 'none'
                                                target.nextElementSibling?.classList.remove('hidden')
                                              }}
                                            />
                                            <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                                              <Receipt className="w-6 h-6 mb-1 text-gray-300" />
                                              <span className="text-[10px]">Client Receipt</span>
                                            </div>
                                            {/* Hover Zoom overlay */}
                                            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors flex items-center justify-center">
                                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                            </div>
                                          </>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                                            <Receipt className="w-8 h-8 mb-1 text-gray-300" />
                                            <span className="text-[10px]">Document</span>
                                          </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white shadow-xs">
                                            Paid
                                          </span>
                                        </div>
                                      </div>

                                      {/* Card Details */}
                                      <div className="p-2.5 flex-1 flex flex-col justify-between text-left">
                                        <div>
                                          <p className="font-mono text-[11px] font-bold text-gray-900 dark:text-white truncate">
                                            {receipt.invoiceNo}
                                          </p>
                                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                            {formatCurrency(receipt.amount)}
                                          </p>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                                          {formatDate(receipt.issueDate)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: VIEW & PRINT PRINTABLE DOCUMENT MODAL                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewingInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden"
          onClick={() => setViewingInvoice(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:overflow-visible print:border-none print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Sticky Header (Always Visible) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                  {viewingInvoice.invoiceNo}
                </span>
                <span className="text-xs text-gray-400">• ID #{viewingInvoice.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
                  title="Close modal (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Scrollable Printable Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-gray-900 dark:text-white print:p-0 print:overflow-visible">
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
                    <p><strong>Property:</strong> {viewingInvoice.property.address || viewingInvoice.property.name}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-600 dark:text-gray-400 text-[11px]">
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

              {/* Optional: Original Receipt Image Attachment */}
              {viewingInvoice.imageUrl && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 print:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" /> Attached Original Receipt Image
                    </p>
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ url: viewingInvoice.imageUrl!, invoice: viewingInvoice })}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                    </button>
                  </div>
                  <div
                    onClick={() => setLightboxImage({ url: viewingInvoice.imageUrl!, invoice: viewingInvoice })}
                    className="cursor-pointer group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-60 bg-gray-100 flex items-center justify-center"
                  >
                    <img
                      src={viewingInvoice.imageUrl}
                      alt="Original Receipt"
                      className="max-h-60 w-auto object-contain group-hover:scale-102 transition-transform"
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-[10px] text-gray-400">
                This is a computer-generated official {viewingInvoice.type.toLowerCase()} by EstatePro Management System. Valid without signature.
              </div>
            </div>

            {/* Modal Sticky Footer (Always Visible) */}
            <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 flex items-center justify-between shrink-0 print:hidden">
              <span className="text-xs text-gray-400">Press Esc or click outside to dismiss</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-xl transition text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: GENERATE INVOICE / RECEIPT MODAL                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden"
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Sticky Header (Always Visible at Top) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
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
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
                title="Cancel / Close (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleGenerate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
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
                      type="tel"
                      value={form.recipientPhone}
                      onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
                      placeholder="08012345678"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Property & Amount */}
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
                          {p.address || p.name}
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
                      required
                      min="1"
                      step="any"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="e.g. 250000"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
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

                {/* Issue Date & Due Date & Status */}
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
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Settlement Bank Details */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                  <p className="font-bold text-gray-800 dark:text-gray-200">Company Remittance Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      placeholder="Bank Name"
                      className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                    />
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      placeholder="Account Number"
                      className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                    />
                    <input
                      type="text"
                      value={form.accountName}
                      onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                      placeholder="Account Name"
                      className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer (Always Visible at Bottom) */}
              <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Generate &amp; Dispatch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: LIGHTBOX FOR FULL IMAGE PREVIEW                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          {/* Top Bar with Close Button */}
          <div className="w-full max-w-4xl flex items-center justify-between text-white shrink-0 py-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm bg-white/10 px-2.5 py-1 rounded-lg">
                {lightboxImage.invoice.invoiceNo}
              </span>
              <span className="text-xs text-gray-300">
                {lightboxImage.invoice.landlord?.name || lightboxImage.invoice.recipientName}
              </span>
            </div>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>

          {/* Centered Image */}
          <div className="flex-1 flex items-center justify-center p-2 w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={`Receipt ${lightboxImage.invoice.invoiceNo}`}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Bottom Info & Download Bar */}
          <div
            className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between text-white text-xs shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-400">{formatCurrency(lightboxImage.invoice.amount)}</span>
              <span>•</span>
              <span className="text-gray-300">{lightboxImage.invoice.property?.address || 'Property Receipt'}</span>
              <span>•</span>
              <span className="text-gray-300">{formatDate(lightboxImage.invoice.issueDate)}</span>
            </div>
            <a
              href={lightboxImage.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
