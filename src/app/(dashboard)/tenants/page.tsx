'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Plus } from 'lucide-react'
import { getStatusColor, formatCurrency } from '@/lib/utils'

export default function TenantsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchTenants = async (searchTerm: string, pageNum: number, stat: string) => {
    setLoading(true)
    try {
      const statusParam = stat === 'All' ? '' : stat
      const res = await fetch(`/api/tenants?search=${searchTerm}&page=${pageNum}&limit=10&status=${statusParam}`)
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
  }, [search, page, status])

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Tenant Name' },
      { accessorKey: 'property.address', header: 'Property', cell: (info: any) => info.getValue() || '—' },
      {
        accessorKey: 'rentAmount',
        header: 'Rent Amount',
        cell: (info: any) => formatCurrency(info.getValue()),
      },
      { accessorKey: 'lastPaymentDate', header: 'Last Payment' },
      { accessorKey: 'nextDueDate', header: 'Next Due' },
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
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and manage tenant records.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
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
          <option value="Current">Current</option>
          <option value="Overdue">Overdue</option>
          <option value="Vacated">Vacated</option>
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
    </div>
  )
}
