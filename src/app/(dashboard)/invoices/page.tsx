'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { invoicesApi, propertiesApi, landlordsApi } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText, Plus, Search, Filter, Printer, CheckCircle2, Clock,
  AlertCircle, Building2, Users, Eye, Trash2, Loader2, X, ChevronDown,
  ChevronRight, Image as ImageIcon, Download, ZoomIn, Receipt, Home,
  DollarSign, Calendar
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Invoice {
  id: number
  invoiceNo: string
  type: 'Invoice' | 'Receipt'
  recipientName: string
  recipientEmail?: string
  landlordId?: number
  propertyId?: number
  amount: number
  description?: string
  status: string
  issueDate: string
  paidDate?: string
  imageUrl?: string
  notes?: string
  landlord?: { id: number; name: string }
  property?: { id: number; address: string }
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

  // Tab: 'gallery' (image receipts) or 'list' (all invoices/text)
  const [activeTab, setActiveTab] = useState<'gallery' | 'list'>('gallery')

  // Gallery state
  const [receipts, setReceipts] = useState<Invoice[]>([])
  const [grouped, setGrouped] = useState<GroupedReceipts>({})
  const [expandedLandlords, setExpandedLandlords] = useState<Set<string>>(new Set())
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set())
  const [lightboxImage, setLightboxImage] = useState<{ url: string; invoice: Invoice } | null>(null)

  // List/invoice state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  const [propertiesList, setPropertiesList] = useState<any[]>([])
  const [landlordsList, setLandlordsList] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [landlordFilter, setLandlordFilter] = useState('all')

  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    type: 'Invoice', recipientType: 'landlord', recipientName: '',
    recipientEmail: '', recipientPhone: '', landlordId: '', propertyId: '',
    amount: '', description: '', status: 'Pending',
    issueDate: new Date().toISOString().split('T')[0], dueDate: '',
    bankName: 'Access Bank', accountNumber: '0123456789',
    accountName: 'EstatePro Management Ltd',
    notes: 'Thank you for your business.',
  })

  // ─── Load meta data ───────────────────────────────────────────────────────
  useEffect(() => {
    async function loadMeta() {
      try {
        const [pRes, lRes] = await Promise.all([propertiesApi.list(1, 200), landlordsApi.list(1, 200)])
        setPropertiesList(pRes.properties || [])
        setLandlordsList(lRes.landlords || [])
      } catch { /* non-critical */ }
    }
    loadMeta()
  }, [])

  // ─── Load receipts for gallery ────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'gallery') loadGallery()
  }, [activeTab])

  async function loadGallery() {
    setLoading(true)
    try {
      // Fetch ALL receipts (type=Receipt) with images
      const res = await invoicesApi.list(1, 500, { type: 'Receipt' })
      const all: Invoice[] = res.invoices || []
      setReceipts(all)

      // Group by landlord → property
      const groups: GroupedReceipts = {}
      for (const inv of all) {
        const lName = inv.landlord?.name || inv.recipientName || 'Unknown Landlord'
        const pAddr = inv.property?.address || 'Unknown Property'
        const lId = inv.landlordId || 0
        const pId = inv.propertyId || 0
        if (!groups[lName]) groups[lName] = { landlordId: lId, properties: {} }
        if (!groups[lName].properties[pAddr]) groups[lName].properties[pAddr] = { propertyId: pId, receipts: [] }
        groups[lName].properties[pAddr].receipts.push(inv)
      }
      setGrouped(groups)

      // Auto-expand all landlords and properties
      setExpandedLandlords(new Set(Object.keys(groups)))
      const propKeys = new Set<string>()
      Object.entries(groups).forEach(([l, { properties }]) => {
        Object.keys(properties).forEach(p => propKeys.add(`${l}::${p}`))
      })
      setExpandedProperties(propKeys)
    } catch (err) {
      console.error('Failed to load receipts:', err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Load invoices for list tab ───────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'list') loadInvoices()
  }, [activeTab, page, search, typeFilter, statusFilter, propertyFilter, landlordFilter])

  async function loadInvoices() {
    setLoading(true)
    try {
      const filters: any = {}
      if (search) filters.search = search
      if (typeFilter !== 'all') filters.type = typeFilter
      if (statusFilter !== 'all') filters.status = statusFilter
      if (propertyFilter !== 'all') filters.propertyId = propertyFilter
      if (landlordFilter !== 'all') filters.landlordId = landlordFilter
      const res = await invoicesApi.list(page, limit, filters)
      setInvoices(res.invoices || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to load invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Toggles ──────────────────────────────────────────────────────────────
  function toggleLandlord(name: string) {
    setExpandedLandlords(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }
  function toggleProperty(key: string) {
    setExpandedProperties(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ─── Generate invoice ─────────────────────────────────────────────────────
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.recipientName || !form.amount || !form.issueDate) {
      setStatusMsg({ type: 'error', text: 'Recipient name, amount, and issue date are required.' })
      return
    }
    setGenerating(true)
    setStatusMsg(null)
    try {
      await invoicesApi.create({
        ...form,
        amount: parseFloat(form.amount),
        landlordId: form.landlordId ? parseInt(form.landlordId) : undefined,
        propertyId: form.propertyId ? parseInt(form.propertyId) : undefined,
      })
      setStatusMsg({ type: 'success', text: `${form.type} generated successfully!` })
      setShowGenerateModal(false)
      if (activeTab === 'list') loadInvoices()
      if (activeTab === 'gallery') loadGallery()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to generate.' })
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this record? This cannot be undone.')) return
    try {
      await invoicesApi.delete(id)
      setStatusMsg({ type: 'success', text: 'Deleted successfully.' })
      if (activeTab === 'list') loadInvoices()
      if (activeTab === 'gallery') loadGallery()
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to delete.' })
    }
  }

  const statusColor: Record<string, string> = {
    Paid: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Overdue: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-600',
  }

  const totalReceipts = receipts.length
  const totalReceiptAmount = receipts.reduce((s, r) => s + (r.amount || 0), 0)
  const landlordCount = Object.keys(grouped).length

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices &amp; Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage invoices and view landlord receipt images</p>
        </div>
        {isSuperAdminOrAdmin && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
        )}
      </div>

      {statusMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-lg text-sm ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {statusMsg.text}
          <button onClick={() => setStatusMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg"><ImageIcon className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-gray-500">Total Receipts</p><p className="text-xl font-bold text-gray-900">{totalReceipts}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xs text-gray-500">Total Amount</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalReceiptAmount)}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xs text-gray-500">Landlords</p><p className="text-xl font-bold text-gray-900">{landlordCount}</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'gallery' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Receipt Gallery</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> All Invoices</span>
        </button>
      </div>

      {/* ── GALLERY TAB ── */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-500">Loading receipt images...</span>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No receipt images yet</h3>
              <p className="text-gray-500 text-sm">Run the import script to load landlord receipts.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([landlordName, { landlordId, properties }]) => (
              <div key={landlordName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Landlord Header */}
                <button
                  onClick={() => toggleLandlord(landlordName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h2 className="font-semibold text-gray-900">{landlordName}</h2>
                      <p className="text-xs text-gray-500">
                        {Object.keys(properties).length} {Object.keys(properties).length === 1 ? 'property' : 'properties'} •{' '}
                        {Object.values(properties).reduce((s, p) => s + p.receipts.length, 0)} receipts •{' '}
                        {formatCurrency(Object.values(properties).reduce((s, p) => s + p.receipts.reduce((rs, r) => rs + (r.amount || 0), 0), 0))}
                      </p>
                    </div>
                  </div>
                  {expandedLandlords.has(landlordName)
                    ? <ChevronDown className="w-5 h-5 text-gray-400" />
                    : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </button>

                {/* Properties */}
                {expandedLandlords.has(landlordName) && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {Object.entries(properties).map(([propAddress, { propertyId, receipts: propReceipts }]) => {
                      const key = `${landlordName}::${propAddress}`
                      const propTotal = propReceipts.reduce((s, r) => s + (r.amount || 0), 0)
                      return (
                        <div key={propAddress}>
                          {/* Property sub-header */}
                          <button
                            onClick={() => toggleProperty(key)}
                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-green-50 rounded-md">
                                <Home className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-800 text-sm">{propAddress}</p>
                                <p className="text-xs text-gray-500">
                                  {propReceipts.length} receipts • {formatCurrency(propTotal)}
                                </p>
                              </div>
                            </div>
                            {expandedProperties.has(key)
                              ? <ChevronDown className="w-4 h-4 text-gray-400" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </button>

                          {/* Receipt Image Grid */}
                          {expandedProperties.has(key) && (
                            <div className="px-6 pb-5 pt-2">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {propReceipts.map(receipt => (
                                  <div
                                    key={receipt.id}
                                    className="group relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => receipt.imageUrl && setLightboxImage({ url: receipt.imageUrl, invoice: receipt })}
                                  >
                                    {/* Receipt image thumbnail */}
                                    {receipt.imageUrl ? (
                                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                        <img
                                          src={receipt.imageUrl}
                                          alt={`Receipt ${receipt.invoiceNo}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          onError={e => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                            target.nextElementSibling?.classList.remove('hidden')
                                          }}
                                        />
                                        {/* Fallback if image fails */}
                                        <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                                          <Receipt className="w-8 h-8 text-gray-300" />
                                        </div>
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center">
                                          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="aspect-[3/4] flex items-center justify-center bg-gray-100">
                                        <Receipt className="w-8 h-8 text-gray-300" />
                                      </div>
                                    )}

                                    {/* Receipt info below image */}
                                    <div className="p-2">
                                      <p className="text-xs font-semibold text-gray-700 truncate">{receipt.invoiceNo}</p>
                                      <p className="text-xs text-green-700 font-medium">{formatCurrency(receipt.amount)}</p>
                                      <p className="text-xs text-gray-400">{receipt.issueDate}</p>
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
            ))
          )}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by name or invoice no..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(['type', 'status', 'landlord', 'property'] as const).map(filterKey => (
                <select
                  key={filterKey}
                  value={filterKey === 'type' ? typeFilter : filterKey === 'status' ? statusFilter : filterKey === 'landlord' ? landlordFilter : propertyFilter}
                  onChange={e => {
                    setPage(1)
                    if (filterKey === 'type') setTypeFilter(e.target.value)
                    else if (filterKey === 'status') setStatusFilter(e.target.value)
                    else if (filterKey === 'landlord') setLandlordFilter(e.target.value)
                    else setPropertyFilter(e.target.value)
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {filterKey === 'type' && (<><option value="all">All Types</option><option value="Invoice">Invoices</option><option value="Receipt">Receipts</option></>)}
                  {filterKey === 'status' && (<><option value="all">All Status</option><option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Overdue">Overdue</option></>)}
                  {filterKey === 'landlord' && (<><option value="all">All Landlords</option>{landlordsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</>)}
                  {filterKey === 'property' && (<><option value="all">All Properties</option>{propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</>)}
                </select>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">No records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Invoice No', 'Type', 'Recipient', 'Property', 'Amount', 'Status', 'Date', 'Image', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNo}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.type === 'Receipt' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {inv.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-32 truncate">{inv.recipientName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{inv.property?.address || '—'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{inv.issueDate}</td>
                        <td className="px-4 py-3">
                          {inv.imageUrl ? (
                            <button onClick={() => setLightboxImage({ url: inv.imageUrl!, invoice: inv })} className="text-blue-600 hover:text-blue-800">
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setViewingInvoice(inv)} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600" title="View details">
                              <Eye className="w-4 h-4" />
                            </button>
                            {isSuperAdminOrAdmin && (
                              <button onClick={() => handleDelete(inv.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600" title="Delete">
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIGHTBOX (full-size image viewer) ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Image */}
            <img
              src={lightboxImage.url}
              alt={`Receipt ${lightboxImage.invoice.invoiceNo}`}
              className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Info bar below image */}
            <div className="mt-3 bg-white/10 backdrop-blur rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-white text-sm">
                <span className="font-semibold">{lightboxImage.invoice.invoiceNo}</span>
                <span>•</span>
                <span>{lightboxImage.invoice.landlord?.name || lightboxImage.invoice.recipientName}</span>
                <span>•</span>
                <span>{lightboxImage.invoice.property?.address}</span>
                <span>•</span>
                <span className="text-green-400 font-medium">{formatCurrency(lightboxImage.invoice.amount)}</span>
                {lightboxImage.invoice.issueDate && <><span>•</span><span>{lightboxImage.invoice.issueDate}</span></>}
              </div>
              <a
                href={lightboxImage.url}
                download
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE DETAIL MODAL ── */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setViewingInvoice(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{viewingInvoice.invoiceNo}</h2>
              <button onClick={() => setViewingInvoice(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Type', viewingInvoice.type],
                ['Recipient', viewingInvoice.recipientName],
                ['Property', viewingInvoice.property?.address || '—'],
                ['Amount', formatCurrency(viewingInvoice.amount)],
                ['Status', viewingInvoice.status],
                ['Issue Date', viewingInvoice.issueDate],
                ['Paid Date', viewingInvoice.paidDate || '—'],
                ['Description', viewingInvoice.description || '—'],
                ['Notes', viewingInvoice.notes || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className="text-gray-900 text-right">{value}</span>
                </div>
              ))}
            </div>
            {viewingInvoice.imageUrl && (
              <div className="mt-4">
                <img src={viewingInvoice.imageUrl} alt="Receipt" className="w-full rounded-lg border border-gray-200 cursor-pointer"
                  onClick={() => { setViewingInvoice(null); setLightboxImage({ url: viewingInvoice.imageUrl!, invoice: viewingInvoice }) }} />
                <p className="text-xs text-center text-gray-400 mt-1">Click image to enlarge</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GENERATE INVOICE MODAL ── */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowGenerateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Generate Invoice / Receipt</h2>
              <button onClick={() => setShowGenerateModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              {statusMsg && (
                <div className={`p-3 rounded-lg text-sm ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {statusMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option>Invoice</option><option>Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Recipient Type</label>
                  <select value={form.recipientType} onChange={e => setForm(f => ({ ...f, recipientType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="landlord">Landlord</option><option value="agent">Agent</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {(['recipientName', 'recipientEmail', 'recipientPhone'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Landlord</label>
                  <select value={form.landlordId} onChange={e => setForm(f => ({ ...f, landlordId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {landlordsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Property</label>
                  <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₦) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option>Pending</option><option>Paid</option><option>Overdue</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={generating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : `Generate ${form.type}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
