import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users,
  Building2,
  UserCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { RentChart } from '@/components/dashboard/rent-chart'
import { LandlordSearch } from '@/components/dashboard/landlord-search'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [
    totalLandlords,
    totalProperties,
    totalTenants,
    activeTenants,
    rentAggregate,
    expenseAggregate,
    recentRents,
    recentExpenses,
  ] = await Promise.all([
    prisma.landlord.count(),
    prisma.property.count(),
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'Current' } }),
    prisma.rent.aggregate({ _sum: { credit: true } }),
    prisma.expense.aggregate({ _sum: { debit: true } }),
    prisma.rent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true } },
        property: { select: { name: true, address: true } },
      },
    }),
    prisma.expense.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { name: true, address: true } },
      },
    }),
  ])

  const totalRentCollected = rentAggregate._sum.credit ?? 0
  const totalExpenses = expenseAggregate._sum.debit ?? 0
  const netBalance = totalRentCollected - totalExpenses
  const occupancyRate =
    totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100 * 10) / 10 : 0

  // Build last 6 months rent data
  const now = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyRentData: { month: string; amount: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    
    // SQLite doesn't easily let us aggregate by month in Prisma without raw queries, 
    // so for this dashboard we will do 6 separate queries
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
    
    const agg = await prisma.rent.aggregate({
      _sum: { credit: true },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })
    
    monthlyRentData.push({
      month: `${monthNames[month]} ${year}`,
      amount: agg._sum.credit ?? 0,
    })
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
          value={totalLandlords}
          icon={<Users />}
          className="text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-300"
        />
        <StatCard
          title="Total Properties"
          value={totalProperties}
          icon={<Building2 />}
          className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900 dark:text-indigo-300"
        />
        <StatCard
          title="Total Tenants"
          value={totalTenants}
          icon={<UserCheck />}
          description={`${occupancyRate}% Occupancy Rate (${activeTenants} active)`}
          className="text-purple-600 bg-purple-50 dark:bg-purple-900 dark:text-purple-300"
        />
        <StatCard
          title="Total Rent Collected"
          value={formatCurrency(totalRentCollected)}
          icon={<TrendingUp />}
          className="text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-300"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown />}
          className="text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-300"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(netBalance)}
          icon={<DollarSign />}
          className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900 dark:text-emerald-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RentChart data={monthlyRentData} />
          <LandlordSearch />
        </div>

        {/* Recent Activity Side */}
        <div className="space-y-6">
          {/* Recent Rents */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Payments</h3>
              <Link href="/rents" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="p-0">
              {recentRents.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No recent payments</div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                  {recentRents.map((rent) => (
                    <li key={rent.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{rent.tenant?.name || 'Unknown Tenant'}</p>
                        <p className="text-xs text-gray-500">{formatDate(rent.paymentDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">+{formatCurrency(rent.amountPaid || rent.credit)}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{rent.property?.address || 'No Property'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
              <Link href="/expenses" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="p-0">
              {recentExpenses.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No recent expenses</div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                  {recentExpenses.map((exp) => (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
