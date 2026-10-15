'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Plus, X, Building2, Check, Loader2 } from 'lucide-react'
import { getStatusColor, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-context'

export default function PropertiesPage() {
  const { user, role } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newProp, setNewProp] = useState({
    name: '',
    address: '',
    city: 'Lagos',
    state: 'Lagos',
    type: 'Residential',
    managementFee: '60000',
    landlordId: user.landlordId ? user.landlordId.toString() : '1',
    assignedAgentId: user.agentId ? user.agentId.toString() : '1',
  })

  const fetchProperties = async (searchTerm: string, pageNum: number, stat: string) => {
    setLoading(true)
    try {
      const statusParam = stat === 'All' ? '' : stat
      let url = `/api/properties?search=${searchTerm}&page=${pageNum}&limit=10&status=${statusParam}`
      if (role === 'landlord' && user.landlordId) {
        url += `&landlordId=${user.landlordId}`
      } else if (role === 'agent' && user.agentId) {
        url += `&agentId=${user.agentId}`
      }

      const res = await fetch(url)
      const json = await res.json()
      setData(json.properties || [])
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
      fetchProperties(search, page, status)
    }, 300)
    return () => clearTimeout(delay)
  }, [search, page, status, role, user])

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProp,
          managementFee: parseFloat(newProp.managementFee) || 50000,
          landlordId: parseInt(newProp.landlordId) || 1,
          assignedAgentId: parseInt(newProp.assignedAgentId) || 1,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setNewProp({
          name: '',
          address: '',
          city: 'Lagos',
          state: 'Lagos',
          type: 'Residential',
          managementFee: '60000',
          landlordId: user.landlordId ? user.landlordId.toString() : '1',
          assignedAgentId: user.agentId ? user.agentId.toString() : '1',
        })
        await fetchProperties(search, page, status)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Property Name', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'landlord.name', header: 'Landlord', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'assignedAgent.name', header: 'Assigned Agent', cell: (info: any) => info.getValue() || 'Sarah Jenkins' },
      { accessorKey: 'address', header: 'Address', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'city', header: 'City', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'type', header: 'Type', cell: (info: any) => info.getValue() || '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info: any) => {
          const val = info.getValue() || 'Unknown'
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(val)}`}>
              {val}
            </span>
          )
        },
      },
      {
        accessorKey: 'managementFee',
        header: 'Mgmt Fee',
        cell: (info: any) => formatCurrency(info.getValue()),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {role === 'agent'
              ? `Showing properties assigned to ${user.name}`
              : role === 'landlord'
              ? `Showing properties owned by ${user.name}`
              : 'Manage all company real estate assets.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add Property
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
            placeholder="Search by address or name..."
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
          <option value="Active">Active</option>
          <option value="Vacant">Vacant</option>
          <option value="Needs Repair">Needs Repair</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No properties found."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={10}
        onPageChange={setPage}
      />

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Add New Property</h3>
                  <p className="text-xs text-gray-500">Register new asset into the management system</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Crest Apartments"
                  value={newProp.name}
                  onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 15, Admiralty Way, Lekki"
                  value={newProp.address}
                  onChange={(e) => setNewProp({ ...newProp, address: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={newProp.city}
                    onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={newProp.type}
                    onChange={(e) => setNewProp({ ...newProp, type: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign Agent
                  </label>
                  <select
                    value={newProp.assignedAgentId}
                    onChange={(e) => setNewProp({ ...newProp, assignedAgentId: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="1">Sarah Jenkins (Agent 1)</option>
                    <option value="2">Michael Okon (Agent 2)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Management Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={newProp.managementFee}
                    onChange={(e) => setNewProp({ ...newProp, managementFee: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  disabled={adding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
