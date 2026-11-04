const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/dashboard
// Role-based dashboard overview
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const role = req.user.role

    // === LANDLORD DASHBOARD ===
    if (role === 'landlord') {
      const landlordId = req.user.landlordProfile?.id
      if (!landlordId) return res.json({ error: 'Landlord profile not found.' })

      const landlord = await prisma.landlord.findUnique({
        where: { id: landlordId },
        include: {
          properties: {
            include: { tenants: true, rents: true, expenses: true, maintenanceRequests: true }
          }
        }
      })

      const totalRevenue = landlord.properties.flatMap(p => p.rents).reduce((s, r) => s + (r.credit || r.amountPaid || 0), 0)
      const totalExpenses = landlord.properties.flatMap(p => p.expenses).reduce((s, e) => s + (e.debit || 0), 0)
      const allTenants = landlord.properties.flatMap(p => p.tenants)

      return res.json({
        role: 'landlord',
        totalProperties: landlord.properties.length,
        totalTenants: allTenants.length,
        activeTenants: allTenants.filter(t => t.status === 'Current').length,
        totalRevenue,
        totalExpenses,
        netBalance: totalRevenue - totalExpenses,
        pendingRepairs: landlord.properties.flatMap(p => p.maintenanceRequests).filter(m => m.status === 'Needs Repair').length,
      })
    }

    // === AGENT DASHBOARD ===
    if (role === 'agent') {
      const agentId = req.user.agentProfile?.id
      if (!agentId) return res.json({ error: 'Agent profile not found.' })

      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          properties: { include: { tenants: true } },
          maintenanceRequests: true,
        }
      })

      const tenants = agent.properties.flatMap(p => p.tenants)

      return res.json({
        role: 'agent',
        assignedProperties: agent.properties.length,
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.status === 'Current').length,
        vacatedTenants: tenants.filter(t => t.status === 'Vacated').length,
        pendingRepairs: agent.maintenanceRequests.filter(m => m.status === 'Needs Repair').length,
        inProgressRepairs: agent.maintenanceRequests.filter(m => m.status === 'In Progress').length,
        completedRepairs: agent.maintenanceRequests.filter(m => m.status === 'Repaired').length,
      })
    }

    // === SUPER ADMIN / ADMIN DASHBOARD ===
    const [
      landlords,
      properties,
      tenants,
      rents,
      expenses,
      maintenance,
      users,
      pendingPayouts,
      unreadMessages,
    ] = await Promise.all([
      prisma.landlord.count(),
      prisma.property.count(),
      prisma.tenant.count(),
      prisma.rent.findMany({ select: { credit: true, amountPaid: true, paymentDate: true } }),
      prisma.expense.findMany({ select: { debit: true, createdAt: true } }),
      prisma.maintenanceRequest.findMany({ select: { status: true } }),
      prisma.user.count(),
      prisma.payoutRequest.count({ where: { status: 'Pending' } }),
      prisma.message.count({ where: { receiverId: req.user.id, isRead: false } }),
    ])

    const totalRentCollected = rents.reduce((s, r) => s + (r.credit || r.amountPaid || 0), 0)
    const totalExpenses = expenses.reduce((s, e) => s + (e.debit || 0), 0)
    const activeTenants = await prisma.tenant.count({ where: { status: 'Current' } })
    const vacatedTenants = await prisma.tenant.count({ where: { status: 'Vacated' } })

    // Monthly rent data for chart (last 6 months from DB)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const recentRents = await prisma.rent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true } },
        property: { select: { id: true, name: true, address: true } }
      }
    })

    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { id: true, name: true, address: true } }
      }
    })

    // Build monthly data from actual rents
    const monthlyMap = {}
    rents.forEach(r => {
      if (!r.paymentDate) return
      const d = new Date(r.paymentDate)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = (monthlyMap[key] || 0) + (r.credit || r.amountPaid || 0)
    })

    const monthlyRentData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, amount]) => {
        const [year, month] = key.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return {
          month: date.toLocaleString('en', { month: 'short', year: 'numeric' }),
          amount
        }
      })

    res.json({
      role,
      totalLandlords: landlords,
      totalProperties: properties,
      totalTenants: tenants,
      activeTenants,
      vacatedTenants,
      overdueTenants: await prisma.tenant.count({ where: { status: 'Overdue' } }),
      totalRentCollected,
      totalExpenses,
      netBalance: totalRentCollected - totalExpenses,
      occupancyRate: properties > 0 ? Math.round((activeTenants / properties) * 100) : 0,
      totalMaintenanceRequests: maintenance.length,
      pendingRepairs: maintenance.filter(m => m.status === 'Needs Repair').length,
      inProgressRepairs: maintenance.filter(m => m.status === 'In Progress').length,
      completedRepairs: maintenance.filter(m => m.status === 'Repaired').length,
      totalUsers: users,
      pendingPayouts,
      unreadMessages,
      monthlyRentData,
      recentRents,
      recentExpenses,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
