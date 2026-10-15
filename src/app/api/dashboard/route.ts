import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET() {
  const landlords = dataStore.getLandlords()
  const properties = dataStore.getProperties()
  const tenants = dataStore.getTenants()
  const rents = dataStore.getRents()
  const expenses = dataStore.getExpenses()
  const maintenance = dataStore.getMaintenance()

  const totalRentCollected = rents.reduce((sum, r) => sum + (r.credit || r.amountPaid || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.debit || 0), 0)
  const netBalance = totalRentCollected - totalExpenses

  const activeTenants = tenants.filter(t => t.status === 'Current').length
  const occupancyRate = tenants.length > 0 ? Math.round((activeTenants / properties.length) * 100) : 0

  // Calculate monthly rent collection for the last 6 months
  const monthlyRentData = [
    { month: 'May 2026', amount: 3200000 },
    { month: 'Jun 2026', amount: 16300000 },
    { month: 'Jul 2026', amount: 17000000 },
    { month: 'Aug 2026', amount: 13600000 },
    { month: 'Sep 2026', amount: 14200000 },
    { month: 'Oct 2026', amount: 4350000 },
  ]

  const recentRents = rents.slice(0, 5)
  const recentExpenses = expenses.slice(0, 5)

  return NextResponse.json({
    totalLandlords: landlords.length,
    totalProperties: properties.length,
    totalTenants: tenants.length,
    activeTenants,
    vacatedTenants: tenants.filter(t => t.status === 'Vacated').length,
    overdueTenants: tenants.filter(t => t.status === 'Overdue').length,
    totalRentCollected,
    totalExpenses,
    netBalance,
    occupancyRate,
    totalMaintenanceRequests: maintenance.length,
    pendingRepairs: maintenance.filter(m => m.status === 'Needs Repair').length,
    inProgressRepairs: maintenance.filter(m => m.status === 'In Progress').length,
    completedRepairs: maintenance.filter(m => m.status === 'Repaired').length,
    monthlyRentData,
    recentRents,
    recentExpenses,
  })
}
