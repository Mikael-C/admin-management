'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { api } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { BookOpen, Loader2, Search } from 'lucide-react'

export default function LedgerPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const limit = 50

  useEffect(() => { load() }, [page, type])

  async function load() {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) }
      if (type !== 'all') params.type = type
      const res = await api.get<any>('/ledger', params)
      setEntries(res.entries || [])
      setTotal(res.total || 0)
    } catch {}
    setLoading(false)
  }

  const filtered = search
    ? entries.filter(e =>
        e.particulars?.toLowerCase().includes(search.toLowerCase()) ||
        e.receiptNo?.toString().includes(search) ||
        e.period?.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Financial ledger entries — {total.toLocaleString()} total records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search particulars..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
          </div>
          <select
            value={type}
            onChange={e => { setType(e.target.value); setPage(1) }}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Ledgers</option>
            <option value="Ledger">Ledger</option>
            <option value="CompleteLedger">Complete Ledger</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Particulars</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">No ledger entries found.</td>
                  </tr>
                ) : filtered.map((entry: any, i: number) => (
                  <tr key={entry.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{entry.date || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-400">{entry.receiptNo || '—'}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{entry.particulars || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{entry.period || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-red-600 dark:text-red-400 font-medium">
                      {entry.debit ? formatCurrency(entry.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      {entry.credit ? formatCurrency(entry.credit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900 dark:text-white">
                      {entry.balance ? formatCurrency(entry.balance) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                        {entry.ledgerType === 'CompleteLedger' ? 'Complete' : 'Ledger'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
                  ← Previous
                </button>
                <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
