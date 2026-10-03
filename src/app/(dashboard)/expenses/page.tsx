'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Download, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ExpensesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchExpenses = async (searchTerm: string, pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/expenses?search=${searchTerm}&page=${pageNum}&limit=50`)
      const json = await res.json()
      setData(json.expenses || [])
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
      fetchExpenses(search, page)
    }, 300)
    return () => clearTimeout(delay)
  }, [search, page])

  const columns = useMemo(
    () => [
      { accessorKey: 'receiptNo', header: 'Receipt No.', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'property.address', header: 'Property', cell: (info: any) => (info.getValue() || 'General/Unassigned').slice(0, 30) },
      { accessorKey: 'description', header: 'Description', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'period', header: 'Period', cell: (info: any) => info.getValue() || '—' },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track all property and agency expenses.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="w-full sm:max-w-md">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Search by receipt no., description, or period</label>
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          placeholder="Search expenses..."
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No expenses found."
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
