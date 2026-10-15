'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Plus, Filter, X, Receipt, Check, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-context'

export default function ExpensesPage() {
  const { user, role } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [propertyIdFilter, setPropertyIdFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalDebit, setTotalDebit] = useState(0)

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    propertyId: '1',
    description: '',
    debit: '50000',
    category: 'Maintenance',
    period: 'Oct 2026',
  })

  const fetchExpenses = async (searchTerm: string, pageNum: number, propId: string) => {
    setLoading(true)
    try {
      let url = `/api/expenses?search=${searchTerm}&page=${pageNum}&limit=50`
      if (role === 'landlord' && user.landlordId) {
        url += `&landlordId=${user.landlordId}`
      }
      if (propId !== 'all') {
        url += `&propertyId=${propId}`
      }

      const res = await fetch(url)
      const json = await res.json()
      setData(json.expenses || [])
      setTotalPages(json.pages || 1)
      setTotalItems(json.total || 0)
      setTotalDebit(json.totalDebit || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchExpenses(search, page, propertyIdFilter)
    }, 300)
    return () => clearTimeout(delay)
  }, [search, page, propertyIdFilter, role, user])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingExpense(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExpense,
          propertyId: parseInt(newExpense.propertyId) || 1,
          debit: parseFloat(newExpense.debit) || 0,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setNewExpense({
          propertyId: '1',
          description: '',
          debit: '50000',
          category: 'Maintenance',
          period: 'Oct 2026',
        })
        await fetchExpenses(search, page, propertyIdFilter)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAddingExpense(false)
    }
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'receiptNo', header: 'Receipt No.', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'property.name', header: 'Property', cell: (info: any) => info.getValue() || info.row.original.property?.address || 'General' },
      { accessorKey: 'description', header: 'Description', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'category', header: 'Category', cell: (info: any) => info.getValue() || 'Maintenance' },
      { accessorKey: 'period', header: 'Period', cell: (info: any) => info.getValue() || '—' },
      {
        accessorKey: 'debit',
        header: 'Debit (Expense)',
        cell: (info: any) => (
          <span className="text-red-600 dark:text-red-400 font-bold">
            -{info.getValue() ? formatCurrency(info.getValue()) : '₦0.00'}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {role === 'landlord'
              ? `Expenses recorded for properties owned by ${user.name}`
              : 'Track all property, facility, and administrative operational expenses.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
            placeholder="Search by receipt no., description, or period..."
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={propertyIdFilter}
            onChange={(e) => {
              setPropertyIdFilter(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Properties</option>
            <option value="1">Emerald Heights Suite 1A</option>
            <option value="2">Sapphire Commercial Plaza</option>
            <option value="3">Victoria Crest Court 3</option>
            <option value="4">Maitama Luxury Villa 1</option>
            <option value="5">Abuja Central Offices</option>
            <option value="7">Lekki Pearl Apartment A</option>
            <option value="8">Lekki Tech Hub Office</option>
            <option value="10">Asokoro Diplomatic Suites</option>
            <option value="13">Ikeja Palms Court</option>
            <option value="14">Allen Corporate Tower</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Expenses (Filtered)</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">-{formatCurrency(totalDebit)}</p>
        </div>
        <div className="text-xs text-gray-500">
          Showing {totalItems} expense vouchers recorded
        </div>
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

      {/* Modal: Add Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Record New Expense</h3>
                  <p className="text-xs text-gray-500">Log an operational or repair disbursement</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Generator Diesel & Engine Oil Filter"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Debit Amount (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newExpense.debit}
                    onChange={(e) => setNewExpense({ ...newExpense, debit: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Security">Security</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Turnover">Tenant Turnover</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Property
                  </label>
                  <select
                    value={newExpense.propertyId}
                    onChange={(e) => setNewExpense({ ...newExpense, propertyId: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Emerald Heights Suite 1A</option>
                    <option value="2">Sapphire Commercial Plaza</option>
                    <option value="3">Victoria Crest Court 3</option>
                    <option value="4">Maitama Luxury Villa 1</option>
                    <option value="7">Lekki Pearl Apartment A</option>
                    <option value="10">Asokoro Diplomatic Suites</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Accounting Period
                  </label>
                  <input
                    type="text"
                    value={newExpense.period}
                    onChange={(e) => setNewExpense({ ...newExpense, period: e.target.value })}
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
                  disabled={addingExpense}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {addingExpense ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
