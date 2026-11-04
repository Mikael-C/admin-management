const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// ===========================
// GET /api/landlords
// Admin sees all, landlord sees only self
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}

    // Landlords can only see themselves
    if (req.user.role === 'landlord') {
      const landlordId = req.user.landlordProfile?.id
      if (!landlordId) return res.json({ landlords: [], total: 0 })
      where.id = landlordId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [landlords, total] = await Promise.all([
      prisma.landlord.findMany({
        where,
        include: {
          _count: { select: { properties: true } },
          user: { select: { id: true, email: true, isActive: true, createdAt: true } }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.landlord.count({ where })
    ])

    // Hide account numbers from non-admins unless it's their own
    const sanitized = landlords.map(l => {
      if (req.user.role === 'super_admin' || req.user.role === 'admin') return l
      if (req.user.role === 'landlord' && req.user.landlordProfile?.id === l.id) return l
      const { accountNumber, ...rest } = l
      return rest
    })

    res.json({ landlords: sanitized, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/landlords/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    // Landlords can only view their own profile
    if (req.user.role === 'landlord' && req.user.landlordProfile?.id !== id) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const landlord = await prisma.landlord.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, isActive: true, createdAt: true, role: true } },
        properties: {
          include: {
            _count: { select: { tenants: true } },
            agent: { select: { id: true, name: true } },
          }
        },
        payoutRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    })

    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found.' })
    }

    res.json({ landlord })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/landlords
// Admin only
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, phone, email, address, bankName, accountNumber, accountName, nin, bio } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Landlord name is required.' })
    }

    const landlord = await prisma.landlord.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        email: email ? email.toLowerCase().trim() : null,
        address: address || null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        accountName: accountName || null,
        nin: nin || null,
        bio: bio || null,
      }
    })

    res.status(201).json({ success: true, landlord })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/landlords/:id
// Admin can edit all, landlord can edit own
// ===========================
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    // Landlords can only edit themselves
    if (req.user.role === 'landlord' && req.user.landlordProfile?.id !== id) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    // Agents have no access
    if (req.user.role === 'agent') {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const { name, phone, email, address, bankName, accountNumber, accountName, nin, bio } = req.body

    const landlord = await prisma.landlord.update({
      where: { id },
      data: {
        name: name?.trim(),
        phone: phone || undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        address: address || undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        accountName: accountName || undefined,
        nin: nin || undefined,
        bio: bio || undefined,
      }
    })

    res.json({ success: true, landlord })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/landlords/:id
// Super admin only
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    await prisma.landlord.delete({ where: { id } })

    res.json({ success: true, message: 'Landlord deleted successfully.' })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/landlords/:id/stats
// Landlord dashboard stats
// ===========================
router.get('/:id/stats', async (req, res, next) => {
  try {
    const landlordId = parseInt(req.params.id)

    // Landlords can only see their own stats
    if (req.user.role === 'landlord' && req.user.landlordProfile?.id !== landlordId) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const landlord = await prisma.landlord.findUnique({
      where: { id: landlordId },
      include: {
        properties: {
          include: {
            tenants: true,
            rents: true,
            expenses: true,
            maintenanceRequests: true,
          }
        }
      }
    })

    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found.' })
    }

    // Build property breakdown
    const propertyBreakdown = landlord.properties.map(prop => {
      const revenue = prop.rents.reduce((sum, r) => sum + (r.credit || r.amountPaid || 0), 0)
      const expense = prop.expenses.reduce((sum, e) => sum + (e.debit || 0), 0)
      const net = revenue - expense

      return {
        propertyId: prop.id,
        propertyName: prop.name || prop.address,
        address: prop.address,
        city: prop.city,
        type: prop.type,
        status: prop.status,
        revenue,
        expense,
        net,
        tenantsCount: prop.tenants.filter(t => t.status === 'Current').length,
        pendingRepairsCount: prop.maintenanceRequests.filter(m => m.status === 'Needs Repair').length,
        percentOfTotal: '0',
      }
    })

    const totalRevenue = propertyBreakdown.reduce((s, p) => s + p.revenue, 0)
    propertyBreakdown.forEach(p => {
      p.percentOfTotal = totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : '0'
    })

    // Combined
    const combined = {
      totalProperties: landlord.properties.length,
      totalRevenue,
      totalExpenses: propertyBreakdown.reduce((s, p) => s + p.expense, 0),
      netRevenue: propertyBreakdown.reduce((s, p) => s + p.net, 0),
      needsRepairCount: landlord.properties.flatMap(p => p.maintenanceRequests).filter(m => m.status === 'Needs Repair').length,
      inProgressCount: landlord.properties.flatMap(p => p.maintenanceRequests).filter(m => m.status === 'In Progress').length,
      repairedCount: landlord.properties.flatMap(p => p.maintenanceRequests).filter(m => m.status === 'Repaired').length,
    }

    // All rents and expenses for this landlord
    const rents = landlord.properties.flatMap(p => p.rents.map(r => ({
      ...r,
      property: { id: p.id, name: p.name, address: p.address }
    })))

    const expenses = landlord.properties.flatMap(p => p.expenses.map(e => ({
      ...e,
      property: { id: p.id, name: p.name, address: p.address }
    })))

    const repairs = landlord.properties.flatMap(p => p.maintenanceRequests.map(m => ({
      ...m,
      property: { id: p.id, name: p.name, address: p.address }
    })))

    res.json({
      landlord: {
        id: landlord.id,
        name: landlord.name,
        email: landlord.email,
        phone: landlord.phone,
        address: landlord.address,
        bankName: landlord.bankName,
        accountNumber: landlord.accountNumber,
        accountName: landlord.accountName,
      },
      combined,
      propertyBreakdown,
      repairs,
      rents,
      expenses,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
