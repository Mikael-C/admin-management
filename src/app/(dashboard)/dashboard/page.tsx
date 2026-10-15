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
  UserCog,
  Wrench,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { RentChart } from '@/components/dashboard/rent-chart'
import { LandlordSearch } from '@/components/dashboard/landlord-search'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-context'

interface DashboardData {
  totalLandlords: number
  totalProperties: number
  totalTenants: number
  activeTenants: number
  vacatedTenants?: number
  overdueTenants?: number
  totalRentCollected: number
  totalExpenses: number
  netBalance: number
  occupancyRate: number
  totalMaintenanceRequests?: number
  pendingRepairs?: number
  monthlyRentData: { month: string; amount: number }[]
  recentRents: any[]
  recentExpenses: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
      {/* Header and Quick Switcher Notice */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Central Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              Super Admin Control
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Company-wide metrics across all properties, landlords, agents, and tenants
          </p>
        </div>

        {/* Action shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/users"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <UserCog className="w-3.5 h-3.5" /> Create Users & Assign Roles
          </Link>
          <Link
            href="/landlord"
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition"
          >
            <Building2 className="w-3.5 h-3.5" /> Landlord Portal
          </Link>
          <Link
            href="/agent"
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition"
          >
            <Wrench className="w-3.5 h-3.5" /> Agent Portal
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Landlords"
          value={data.totalLandlords}
          icon={<Users />}
          description="Property owners registered"
          className="text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-300"
        />
        <StatCard
          title="Total Properties"
          value={data.totalProperties}
          icon={<Building2 />}
          description="Residential & commercial assets"
          className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900 dark:text-indigo-300"
        />
        <StatCard
          title="Total Tenants"
          value={data.totalTenants}
          icon={<UserCheck />}
          description={`${data.occupancyRate}% Occupancy (${data.activeTenants} active, ${data.vacatedTenants || 0} vacated)`}
          className="text-purple-600 bg-purple-50 dark:bg-purple-900 dark:text-purple-300"
        />
        <StatCard
          title="All Properties Rent Revenue"
          value={formatCurrency(data.totalRentCollected)}
          icon={<TrendingUp />}
          description="Total gross rent collected across all properties"
          className="text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-300"
        />
        <StatCard
          title="All Properties Expenses"
          value={formatCurrency(data.totalExpenses)}
          icon={<TrendingDown />}
          description="Operational, repairs & utility outlays"
          className="text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-300"
        />
        <StatCard
          title="Company Net Revenue"
          value={formatCurrency(data.netBalance)}
          icon={<DollarSign />}
          description="Gross rent collected minus all expenses"
          className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900 dark:text-emerald-300"
        />
      </div>

      {/* Role Navigation Promo Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/landlord"
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/20 to-teal-950/10 border border-emerald-500/20 hover:border-emerald-500/50 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                Explore Landlord Dashboard
              </p>
              <p className="text-xs text-gray-500">
                View property-by-property revenues, combined earnings, repair tracker, and filtered rents
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/agent"
          className="p-4 rounded-xl bg-gradient-to-r from-purple-950/20 to-indigo-950/10 border border-purple-500/20 hover:border-purple-500/50 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                Explore Agent Dashboard
              </p>
              <p className="text-xs text-gray-500">
                View assigned properties only, submit maintenance requests, and track vacated tenants
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
        </Link>
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
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Rent Collections</h3>
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
