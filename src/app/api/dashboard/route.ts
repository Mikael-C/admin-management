import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Run all aggregate queries in parallel for performance
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
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true } },
          property: { select: { name: true, address: true } },
        },
      }),
      prisma.expense.findMany({
        take: 10,
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
      totalTenants > 0
        ? Math.round((activeTenants / totalTenants) * 100 * 10) / 10
        : 0

    // Build last 6 months rent data
    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const monthlyRentData: { month: string; amount: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth() // 0-indexed

      // Build date range for the month
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

    return NextResponse.json({
      totalLandlords,
      totalProperties,
      totalTenants,
      activeTenants,
      totalRentCollected,
      totalExpenses,
      netBalance,
      recentRents,
      recentExpenses,
      occupancyRate,
      monthlyRentData,
    })
  } catch (error) {
    console.error('[DASHBOARD_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 },
    )
  }
}
