'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PrintButton } from '@/components/ui/print-button'

export default function LandlordDetail() {
  const params = useParams()
  const id = params?.id
  const [landlord, setLandlord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/landlords/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => {
        if (d) setLandlord(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (notFound || !landlord) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Landlord not found.</p>
        <Link href="/landlords" className="text-blue-600 text-sm mt-2 inline-block hover:underline">← Back to Landlords</Link>
      </div>
    )
  }

  const totalRent = landlord.totalRentCollected ?? 0
  const totalExpenses = landlord.totalExpenses ?? 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <Link href="/landlords" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to Landlords
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{landlord.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
          <p><strong>ID:</strong> #{landlord.id}</p>
          <p><strong>Phone:</strong> {landlord.phone || 'N/A'}</p>
          <p><strong>Email:</strong> {landlord.email || 'N/A'}</p>
          <p className="md:col-span-3"><strong>Address:</strong> {landlord.address || 'N/A'}</p>
        </div>

        <h2 className="text-xl font-bold mb-4">Financial Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 mb-1">Total Rent Collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRent)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 mb-1">Net Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRent - totalExpenses)}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Properties ({(landlord.properties || []).length})</h2>
        <div className="space-y-4">
          {(landlord.properties || []).map((p: any) => (
            <div key={p.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{p.name || p.address}</h3>
                  <p className="text-sm text-gray-500">{p.city}, {p.state} • {p.type}</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">
                  {p.status}
                </span>
              </div>
              {p.tenants?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-medium">
                      <tr>
                        <th className="px-3 py-2 rounded-l-lg">Tenant</th>
                        <th className="px-3 py-2">Rent</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {p.tenants.map((t: any) => (
                        <tr key={t.id}>
                          <td className="px-3 py-2">{t.name}</td>
                          <td className="px-3 py-2">{formatCurrency(t.rentAmount)}</td>
                          <td className="px-3 py-2">{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No tenants linked.</p>
              )}
            </div>
          ))}
          {(!landlord.properties || landlord.properties.length === 0) && (
            <p className="text-gray-500 text-sm">No properties registered.</p>
          )}
        </div>
      </div>
    </div>
  )
}
