'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users,
  Building2,
  UserCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { RentChart } from '@/components/dashboard/rent-chart'
import { LandlordSearch } from '@/components/dashboard/landlord-search'
import Link from 'next/link'

interface DashboardData {
  totalLandlords: number
  totalProperties: number
  totalTenants: number
  activeTenants: number
  totalRentCollected: number
  totalExpenses: number
  netBalance: number
  occupancyRate: number
  monthlyRentData: { month: string; amount: number }[]
  recentRents: any[]
  recentExpenses: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Failed to load dashboard data. Please refresh.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Company-wide real estate metrics and search
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Landlords"
          value={data.totalLandlords}
          icon={<Users />}
          className="text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-300"
        />
        <StatCard
          title="Total Properties"
          value={data.totalProperties}
          icon={<Building2 />}
          className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900 dark:text-indigo-300"
        />
        <StatCard
          title="Total Tenants"
          value={data.totalTenants}
          icon={<UserCheck />}
          description={`${data.occupancyRate}% Occupancy Rate (${data.activeTenants} active)`}
          className="text-purple-600 bg-purple-50 dark:bg-purple-900 dark:text-purple-300"
        />
        <StatCard
          title="Total Rent Collected"
          value={formatCurrency(data.totalRentCollected)}
          icon={<TrendingUp />}
          className="text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-300"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(data.totalExpenses)}
          icon={<TrendingDown />}
          className="text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-300"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(data.netBalance)}
          icon={<DollarSign />}
          className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900 dark:text-emerald-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RentChart data={data.monthlyRentData} />
          <LandlordSearch />
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          {/* Recent Rents */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Payments</h3>
              <Link href="/rents" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.recentRents.length === 0 ? (
                <li className="p-4 text-sm text-gray-500 text-center">No recent payments</li>
              ) : data.recentRents.map((rent: any) => (
                <li key={rent.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{rent.tenant?.name || 'Tenant'}</p>
                    <p className="text-xs text-gray-500">{formatDate(rent.paymentDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">+{formatCurrency(rent.credit || rent.amountPaid)}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{rent.property?.address || ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Expenses */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
              <Link href="/expenses" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.recentExpenses.length === 0 ? (
                <li className="p-4 text-sm text-gray-500 text-center">No recent expenses</li>
              ) : data.recentExpenses.map((exp: any) => (
                <li key={exp.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="max-w-[180px]">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{exp.description || 'Expense'}</p>
                    <p className="text-xs text-gray-500 truncate">{exp.property?.address || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">-{formatCurrency(exp.debit)}</p>
                    <p className="text-xs text-gray-500">{formatDate(exp.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
