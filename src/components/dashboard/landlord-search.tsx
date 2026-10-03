'use client'

import { useState } from 'react'
import { Search, Printer, Building2, Users, Phone, Mail, MapPin, Loader2 } from 'lucide-react'
import { formatCurrency, getStatusColor } from '@/lib/utils'

interface LandlordProperty {
  id: number
  name: string | null
  address: string | null
  city: string | null
  state: string | null
  type: string | null
  status: string | null
  tenantCount: number
  activeTenants: number
  tenants: { id: number; name: string; status: string | null; rentAmount: number | null }[]
}

interface LandlordResult {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  properties: LandlordProperty[]
  totalRentCollected: number
  totalExpenses: number
  netBalance: number
}

export function LandlordSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LandlordResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    setResult(null)
    setNotFound(false)
    setError(null)
    setSearched(false)

    try {
      const res = await fetch(`/api/landlords/search?name=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Search failed. Please try again.')
        return
      }

      setSearched(true)
      if (data.landlord) {
        setResult(data.landlord)
      } else {
        setNotFound(true)
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Landlord Report Search
      </h2>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search landlord by name…"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Not found state */}
      {notFound && searched && (
        <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 text-sm text-yellow-700 dark:text-yellow-400">
          No landlord found matching &quot;<strong>{query}</strong>&quot;. Try a different name.
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 print-area">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{result.name}</h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {result.phone && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Phone className="h-3.5 w-3.5" />
                    {result.phone}
                  </span>
                )}
                {result.email && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Mail className="h-3.5 w-3.5" />
                    {result.email}
                  </span>
                )}
                {result.address && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {result.address}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="print:hidden inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </button>
          </div>

          {/* Financial summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-center">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Rent Collected
              </p>
              <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
                {formatCurrency(result.totalRentCollected)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-center">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                Total Expenses
              </p>
              <p className="mt-1 text-lg font-bold text-red-700 dark:text-red-300">
                {formatCurrency(result.totalExpenses)}
              </p>
            </div>
            <div
              className={`rounded-lg border p-4 text-center ${
                result.netBalance >= 0
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${
                  result.netBalance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                Net Balance
              </p>
              <p
                className={`mt-1 text-lg font-bold ${
                  result.netBalance >= 0
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}
              >
                {formatCurrency(result.netBalance)}
              </p>
            </div>
          </div>

          {/* Properties list */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Building2 className="h-4 w-4" />
              Properties ({result.properties.length})
            </h4>

            {result.properties.length === 0 ? (
              <p className="text-sm text-gray-400">No properties on record.</p>
            ) : (
              <div className="space-y-3">
                {result.properties.map((property) => (
                  <div
                    key={property.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {property.name ?? `Property #${property.id}`}
                        </p>
                        {(property.address || property.city) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {[property.address, property.city, property.state]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {property.type && (
                          <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">
                            {property.type}
                          </span>
                        )}
                        {property.status && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(property.status)}`}
                          >
                            {property.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Users className="h-3 w-3" />
                      {property.activeTenants} active / {property.tenantCount} total tenant
                      {property.tenantCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2rem;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
