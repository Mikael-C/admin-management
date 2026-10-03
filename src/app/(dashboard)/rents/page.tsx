'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RentsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // running totals
  const [totals, setTotals] = useState({ debit: 0, credit: 0 })

  const fetchRents = async (searchTerm: string, pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rents?search=${searchTerm}&page=${pageNum}&limit=50`)
      const json = await res.json()
      setData(json.rents || [])
      setTotalPages(json.pages || 1)
      setTotalItems(json.total || 0)
      setTotals({ debit: json.totalDebit || 0, credit: json.totalCredit || 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchRents(search, page)
    }, 300)
    return () => clearTimeout(delay)
  }, [search, page])

  const columns = useMemo(
    () => [
      { accessorKey: 'receiptNo', header: 'Receipt No.', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'tenant.name', header: 'Tenant', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'property.address', header: 'Property', cell: (info: any) => (info.getValue() || '—').slice(0, 30) },
      {
        accessorKey: 'paymentDate',
        header: 'Date',
        cell: (info: any) => formatDate(info.getValue()),
      },
      { accessorKey: 'paymentMethod', header: 'Method', cell: (info: any) => info.getValue() || '—' },
      {
        accessorKey: 'debit',
        header: 'Debit',
        cell: (info: any) => (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {info.getValue() ? formatCurrency(info.getValue()) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'credit',
        header: 'Credit',
        cell: (info: any) => (
          <span className="text-green-600 dark:text-green-400 font-medium">
            {info.getValue() ? formatCurrency(info.getValue()) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: (info: any) => (
          <span className="font-semibold text-gray-900 dark:text-white">
            {info.getValue() !== null ? formatCurrency(info.getValue()) : '—'}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rents & Payments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Complete rent ledger and history.</p>
        </div>
        <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="w-full sm:max-w-md">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Search by tenant, receipt no., or property</label>
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          placeholder="Search ledger..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Debit (Filtered)</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.debit)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Credit (Filtered)</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.credit)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Net Balance</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totals.credit - totals.debit)}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No payments found."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={50}
        onPageChange={setPage}
      />
    </div>
  )
}
