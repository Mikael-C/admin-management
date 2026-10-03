'use client'

import { useEffect, useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Plus, Eye } from 'lucide-react'
import Link from 'next/link'

export default function LandlordsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchLandlords = async (searchTerm: string, pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/landlords?search=${searchTerm}&page=${pageNum}&limit=10`)
      const json = await res.json()
      setData(json.landlords || [])
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
      fetchLandlords(search, page)
    }, 300)
    return () => clearTimeout(delay)
  }, [search, page])

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'phone', header: 'Phone', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'email', header: 'Email', cell: (info: any) => info.getValue() || '—' },
      { accessorKey: 'address', header: 'Address', cell: (info: any) => info.getValue() || '—' },
      {
        accessorKey: '_count.properties',
        header: 'Properties',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info: any) => (
          <Link
            href={`/landlords/${info.row.original.id}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Eye className="w-4 h-4" /> View
          </Link>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Landlords</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage property owners and clients.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
          <Plus className="w-4 h-4" /> Add Landlord
        </button>
      </div>

      <div className="w-full max-w-sm">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          placeholder="Search landlords by name..."
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No landlords found."
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
