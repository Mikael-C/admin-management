'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Download, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-context'

export default function RentsPage() {
  const { user, role } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [propertyIdFilter, setPropertyIdFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // running totals
  const [totals, setTotals] = useState({ debit: 0, credit: 0 })

  const fetchRents = async (searchTerm: string, pageNum: number, propId: string) => {
    setLoading(true)
    try {
      let url = `/api/rents?search=${searchTerm}&page=${pageNum}&limit=50`
      if (role === 'landlord' && user.landlordId) {
        url += `&landlordId=${user.landlordId}`
      }
      if (propId !== 'all') {
        url += `&propertyId=${propId}`
      }

      const res = await fetch(url)
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
      fetchRents(search, page, propertyIdFilter)
    }, 300)
    return () => clearTimeout(delay)
  }, [search, page, propertyIdFilter, role, user])

  const columns = useMemo(
    () => [
      { accessorKey: 'receiptNo', header: 'Receipt No.', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'tenant.name', header: 'Tenant', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'property.name', header: 'Property', cell: (info: any) => info.getValue() || info.row.original.property?.address || '—' },
      {
        accessorKey: 'paymentDate',
        header: 'Payment Date',
        cell: (info: any) => formatDate(info.getValue()),
      },
      { accessorKey: 'paymentMethod', header: 'Method', cell: (info: any) => info.getValue() || '—' },
      {
        accessorKey: 'credit',
        header: 'Amount Paid (Credit)',
        cell: (info: any) => (
          <span className="text-green-600 dark:text-green-400 font-bold">
            +{info.getValue() ? formatCurrency(info.getValue()) : formatCurrency(info.row.original.amountPaid)}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rents & Revenue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {role === 'landlord'
              ? `Rent receipts and collections for properties owned by ${user.name}`
              : 'Complete company rent ledger and revenue history across all properties.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
            placeholder="Search by receipt no., tenant, or property..."
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
            <option value="11">Wuse 2 Retail Mall</option>
            <option value="14">Allen Corporate Tower</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Rent Revenue Collected (Filtered)</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">{formatCurrency(totals.credit)}</p>
        </div>
        <div className="text-xs text-gray-500">
          Showing {totalItems} payment receipts recorded
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
