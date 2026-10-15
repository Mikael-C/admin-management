'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Plus, X, UserCheck, UserX, Edit3, Check, Loader2 } from 'lucide-react'
import { getStatusColor, formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-context'

export default function TenantsPage() {
  const { user, role } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Status update modal
  const [updatingTenant, setUpdatingTenant] = useState<any>(null)
  const [tenantStatus, setTenantStatus] = useState<'Current' | 'Overdue' | 'Vacated'>('Vacated')
  const [tenantNotes, setTenantNotes] = useState('')
  const [vacatedDate, setVacatedDate] = useState(new Date().toISOString().split('T')[0])
  const [savingStatus, setSavingStatus] = useState(false)

  // Add Tenant Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingTenant, setAddingTenant] = useState(false)
  const [newTenant, setNewTenant] = useState({
    name: '',
    phone: '',
    email: '',
    propertyId: '1',
    rentAmount: '2500000',
    lastPaymentDate: new Date().toISOString().split('T')[0],
    nextDueDate: '2027-09-01',
    status: 'Current',
  })

  const fetchTenants = async (searchTerm: string, pageNum: number, stat: string) => {
    setLoading(true)
    try {
      const statusParam = stat === 'All' ? '' : stat
      let url = `/api/tenants?search=${searchTerm}&page=${pageNum}&limit=10&status=${statusParam}`
      if (role === 'agent' && user.agentId) {
        url += `&agentId=${user.agentId}`
      }
      const res = await fetch(url)
      const json = await res.json()
      setData(json.tenants || [])
      setTotalPages(json.pages || 1)
      setTotalItems(json.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTenants(search, page, status)
    }, 300)
    return () => clearTimeout(delay)
  }, [search, page, status, role, user])

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updatingTenant) return

    setSavingStatus(true)
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
        await fetchTenants(search, page, status)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingTenant(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTenant,
          propertyId: parseInt(newTenant.propertyId) || 1,
          rentAmount: parseFloat(newTenant.rentAmount) || 1500000,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setNewTenant({
          name: '',
          phone: '',
          email: '',
          propertyId: '1',
          rentAmount: '2500000',
          lastPaymentDate: new Date().toISOString().split('T')[0],
          nextDueDate: '2027-09-01',
          status: 'Current',
        })
        await fetchTenants(search, page, status)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAddingTenant(false)
    }
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'name',
        header: 'Tenant Name',
        cell: (info: any) => {
          const row = info.row.original
          return (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{row.name}</p>
              {row.phone && <p className="text-[11px] text-gray-400">{row.phone}</p>}
              {row.notes && (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 truncate max-w-xs">
                  {row.notes}
                </p>
              )}
            </div>
          )
        },
      },
      { accessorKey: 'property.name', header: 'Property', cell: (info: any) => info.getValue() || info.row.original.property?.address || '—' },
      {
        accessorKey: 'rentAmount',
        header: 'Rent Amount',
        cell: (info: any) => formatCurrency(info.getValue()),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info: any) => {
          const val = info.getValue() || 'Current'
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
              val === 'Current'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                : val === 'Overdue'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {val === 'Vacated' && <UserX className="w-3 h-3" />}
              {val}
            </span>
          )
        },
      },
      {
        accessorKey: 'nextDueDate',
        header: 'Due / Vacated Date',
        cell: (info: any) => {
          const row = info.row.original
          if (row.status === 'Vacated' && row.vacatedDate) {
            return <span className="text-gray-500 font-medium">Vacated: {formatDate(row.vacatedDate)}</span>
          }
          return formatDate(info.getValue())
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info: any) => {
          const row = info.row.original
          return (
            <button
              onClick={() => {
                setUpdatingTenant(row)
                setTenantStatus(row.status)
                setTenantNotes(row.notes || '')
              }}
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Update
            </button>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {role === 'agent'
              ? `Showing tenants on properties assigned to ${user.name}`
              : 'View and manage all tenant records across all properties.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
            placeholder="Search by tenant name..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
        >
          <option value="All">All Statuses</option>
          <option value="Current">Current Active</option>
          <option value="Overdue">Rent Overdue</option>
          <option value="Vacated">Vacated (Moved Out)</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No tenants found."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={setPage}
      />

      {/* Modal: Update Tenant Status */}
      {updatingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Update Tenant Status</h3>
                  <p className="text-xs text-gray-500">{updatingTenant.name}</p>
                </div>
              </div>
              <button
                onClick={() => setUpdatingTenant(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant Lease Status *
                </label>
                <select
                  value={tenantStatus}
                  onChange={(e: any) => setTenantStatus(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="Current">Current (Active)</option>
                  <option value="Overdue">Rent Overdue</option>
                  <option value="Vacated">Vacated (Tenant Moved Out)</option>
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
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes & Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Move-out details, inspection status, key return notes, etc."
                  value={tenantNotes}
                  onChange={(e) => setTenantNotes(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Modal: Add Tenant */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Add New Tenant</h3>
                  <p className="text-xs text-gray-500">Register new tenant lease agreement</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTenant} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Adeleke Johnson"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="08012345678"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Rent Amount (₦)</label>
                  <input
                    type="number"
                    value={newTenant.rentAmount}
                    onChange={(e) => setNewTenant({ ...newTenant, rentAmount: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign Property (Property ID)
                </label>
                <select
                  value={newTenant.propertyId}
                  onChange={(e) => setNewTenant({ ...newTenant, propertyId: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="1">Emerald Heights Suite 1A (VI, Lagos)</option>
                  <option value="2">Sapphire Commercial Plaza (VI, Lagos)</option>
                  <option value="3">Victoria Crest Court 3 (VI, Lagos)</option>
                  <option value="4">Maitama Luxury Villa 1 (Abuja)</option>
                  <option value="6">Gwarinpa Residential Duplex (Abuja)</option>
                  <option value="7">Lekki Pearl Apartment A (Lagos)</option>
                  <option value="12">Guzape Valley Apartments (Abuja)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTenant}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {addingTenant ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Register Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
