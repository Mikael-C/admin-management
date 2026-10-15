'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wrench,
  CreditCard,
  Receipt,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Search,
  Loader2,
  User,
} from 'lucide-react'
import Link from 'next/link'

export default function LandlordDashboardPage() {
  const { user, switchLandlord } = useAuth()
  const activeLandlordId = user.landlordId || 1

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'repairs' | 'rents' | 'expenses'>('overview')

  // Filters
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [repairStatusFilter, setRepairStatusFilter] = useState<string>('all')
  const [rentSearch, setRentSearch] = useState('')
  const [expenseSearch, setExpenseSearch] = useState('')

  const fetchLandlordData = async (id: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/landlord/stats?landlordId=${id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLandlordData(activeLandlordId)
  }, [activeLandlordId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500">Loading landlord properties & financial data...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <p className="text-gray-500">Could not retrieve landlord records.</p>
        <button
          onClick={() => fetchLandlordData(activeLandlordId)}
          className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  const { landlord, combined, propertyBreakdown, repairs, rents, expenses } = data

  // Filtered Rents
  const filteredRents = rents.filter((r: any) => {
    const matchesProp = propertyFilter === 'all' || r.propertyId === parseInt(propertyFilter)
    const matchesSearch =
      !rentSearch ||
      r.receiptNo.toLowerCase().includes(rentSearch.toLowerCase()) ||
      (r.tenant && r.tenant.name.toLowerCase().includes(rentSearch.toLowerCase())) ||
      (r.property && r.property.name.toLowerCase().includes(rentSearch.toLowerCase()))
    return matchesProp && matchesSearch
  })

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e: any) => {
    const matchesProp = propertyFilter === 'all' || e.propertyId === parseInt(propertyFilter)
    const matchesSearch =
      !expenseSearch ||
      e.receiptNo.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.description.toLowerCase().includes(expenseSearch.toLowerCase())
    return matchesProp && matchesSearch
  })

  // Filtered Repairs
  const filteredRepairs = repairs.filter((m: any) => {
    const matchesProp = propertyFilter === 'all' || m.propertyId === parseInt(propertyFilter)
    const matchesStatus = repairStatusFilter === 'all' || m.status.toLowerCase() === repairStatusFilter.toLowerCase()
    return matchesProp && matchesStatus
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Landlord Selector & Profile */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Building2 className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Landlord Portal
              </span>
              <span className="text-xs text-white/60">• Landlord ID #{landlord.id}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1 text-white">{landlord.name}</h1>
            <p className="text-xs text-white/70">
              {landlord.email} &bull; {landlord.phone} &bull; {landlord.address}
            </p>
          </div>
        </div>

        {/* Landlord Switcher for Testing */}
        <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/10 text-xs">
          <span className="text-white/60 pl-2">Viewing as:</span>
          <select
            value={activeLandlordId}
            onChange={(e) => switchLandlord(parseInt(e.target.value))}
            className="bg-white/10 border-none rounded-lg px-2.5 py-1 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 text-xs cursor-pointer"
          >
            <option value={1} className="text-gray-900">Chief Adebayo (VI, Lagos)</option>
            <option value={2} className="text-gray-900">Alhaji Musa (Abuja)</option>
            <option value={3} className="text-gray-900">Dr. (Mrs) Okafor (Lekki)</option>
            <option value={4} className="text-gray-900">Engr. Folorunsho (Asokoro)</option>
            <option value={5} className="text-gray-900">Barrister Nnamdi (Ikeja)</option>
          </select>
        </div>
      </div>

      {/* Combined Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Combined Revenue */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Combined Revenue</span>
            <div className="p-2 rounded-xl bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {formatCurrency(combined.totalRevenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Sum of all rent across your {combined.totalProperties} properties</p>
        </div>

        {/* Combined Expenses */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Combined Expenses</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {formatCurrency(combined.totalExpenses)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Repairs, maintenance & facility costs</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Net Profit (Take-Home)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(combined.netRevenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Revenue minus all property expenses</p>
        </div>

        {/* Repair Status Badge Card */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Repairs & Maintenance</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {combined.needsRepairCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Needs Repair</span>
            <span className="text-xs text-gray-400">/ {combined.repairedCount} Repaired</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{combined.inProgressCount} currently in progress</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Properties & Revenue Breakdown</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {propertyBreakdown.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('repairs')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'repairs'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Properties Needing Repairs</span>
          {combined.needsRepairCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-bold">
              {combined.needsRepairCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rents')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'rents'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rent Records & Filter</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {rents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Property Expenses</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {expenses.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PROPERTIES & INDIVIDUAL REVENUE BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Revenue Breakdown by Individual Property
              </h2>
              <p className="text-xs text-gray-500">
                Track exact revenue generated by each of your properties alongside individual expenses and net returns.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
              Combined Total: {formatCurrency(combined.totalRevenue)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {propertyBreakdown.map((prop: any) => (
              <div
                key={prop.propertyId}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {prop.type}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        prop.status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : prop.status === 'Needs Repair'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                    {prop.propertyName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 truncate">
                    {prop.address}, {prop.city}
                  </p>

                  {/* Financial Stats for this property */}
                  <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Property Revenue:</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                        +{formatCurrency(prop.revenue)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Property Expenses:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        -{formatCurrency(prop.expense)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Net Profit:</span>
                      <span className="font-black text-gray-900 dark:text-white text-sm">
                        {formatCurrency(prop.net)}
                      </span>
                    </div>
                  </div>

                  {/* Share of total portfolio */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Share of Total Revenue</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{prop.percentOfTotal}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, parseFloat(prop.percentOfTotal) || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer info & filter trigger */}
                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{prop.tenantsCount} Active Tenant(s)</span>
                    {prop.pendingRepairsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                        {prop.pendingRepairsCount} repair(s)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setPropertyFilter(prop.propertyId.toString())
                      setActiveTab('rents')
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    View Rents <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTIES THAT NEED REPAIRS & REPAIR STATUS */}
      {activeTab === 'repairs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Repairs & Maintenance Tracker
              </h2>
              <p className="text-xs text-gray-500">
                Monitor repair requests reported by field agents and track whether they have been resolved.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Property filter */}
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Properties</option>
                {propertyBreakdown.map((p: any) => (
                  <option key={p.propertyId} value={p.propertyId}>
                    {p.propertyName}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={repairStatusFilter}
                onChange={(e) => setRepairStatusFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="Needs Repair">Needs Repair (Pending)</option>
                <option value="In Progress">In Progress</option>
                <option value="Repaired">Repaired / Completed</option>
              </select>
            </div>
          </div>

          {/* Repairs List */}
          <div className="space-y-3">
            {filteredRepairs.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold">No maintenance tickets matching filter</p>
                <p className="text-xs text-gray-500 mt-1">All properties are in good standing.</p>
              </div>
            ) : (
              filteredRepairs.map((repair: any) => (
                <div
                  key={repair.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 transition-all shadow-xs ${
                    repair.status === 'Needs Repair'
                      ? 'border-amber-300 dark:border-amber-800/80'
                      : repair.status === 'In Progress'
                      ? 'border-blue-300 dark:border-blue-800/80'
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                            repair.status === 'Needs Repair'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                              : repair.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200'
                              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                          }`}
                        >
                          {repair.status === 'Needs Repair' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : repair.status === 'In Progress' ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {repair.status === 'Repaired' ? 'Repaired & Verified' : repair.status}
                        </span>

                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                          {repair.category}
                        </span>

                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          repair.priority === 'Emergency'
                            ? 'bg-red-100 text-red-800'
                            : repair.priority === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          Priority: {repair.priority}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white pt-1">
                        {repair.title}
                      </h3>
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Property: {repair.property?.name || 'Assigned Property'} &bull; {repair.property?.address}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 max-w-3xl leading-relaxed">
                        {repair.description}
                      </p>
                      {repair.notes && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg mt-2 inline-block">
                          <strong>Agent Update:</strong> {repair.notes}
                        </p>
                      )}
                    </div>

                    {/* Financial & Timing */}
                    <div className="text-left sm:text-right shrink-0 space-y-1">
                      <p className="text-xs text-gray-500">Estimated Cost</p>
                      <p className="text-base font-black text-gray-900 dark:text-white">
                        {formatCurrency(repair.actualCost || repair.estimatedCost)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Reported: {formatDate(repair.reportedDate)}
                      </p>
                      {repair.repairedDate && (
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Repaired on: {formatDate(repair.repairedDate)}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 italic">
                        By: {repair.requestedByName}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RENT RECORDS & PROPERTY FILTER */}
      {activeTab === 'rents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Rent Payments for Your Properties
              </h2>
              <p className="text-xs text-gray-500">
                Filter rents specifically by property or view all collected revenue.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Property Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  <option value="all">All Properties (Combined)</option>
                  {propertyBreakdown.map((p: any) => (
                    <option key={p.propertyId} value={p.propertyId}>
                      {p.propertyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Receipt, tenant, property..."
                  value={rentSearch}
                  onChange={(e) => setRentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Table of Rents */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Tenant Name</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No rent payments found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRents.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                          {r.receiptNo}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {r.property?.name || r.property?.address}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {r.tenant?.name || 'Tenant'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(r.paymentDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {r.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 text-sm">
                          +{formatCurrency(r.credit || r.amountPaid)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-500">Showing {filteredRents.length} payment records</span>
              <span className="font-bold text-gray-900 dark:text-white">
                Filtered Total: {formatCurrency(filteredRents.reduce((s: number, r: any) => s + (r.credit || r.amountPaid || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROPERTY EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Expenses Incurred on Your Properties
              </h2>
              <p className="text-xs text-gray-500">
                Detailed breakdown of operational and repair expenses per property.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">All Properties (Combined)</option>
                {propertyBreakdown.map((p: any) => (
                  <option key={p.propertyId} value={p.propertyId}>
                    {p.propertyName}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Receipt, description..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Debit (Expense)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No expenses found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((e: any) => (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400">
                          {e.receiptNo}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {e.property?.name || e.property?.address}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {e.description}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {e.category || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {e.period}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400 text-sm">
                          -{formatCurrency(e.debit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-500">Showing {filteredExpenses.length} expense records</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                Total Expenses: -{formatCurrency(filteredExpenses.reduce((s: number, e: any) => s + (e.debit || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
