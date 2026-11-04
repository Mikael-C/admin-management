const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// Helper: role-based where for rents
function buildRentWhere(user) {
  if (user.role === 'landlord') {
    const landlordId = user.landlordProfile?.id
    if (!landlordId) return { id: -1 }
    return { property: { landlordId } }
  }
  if (user.role === 'agent') {
    const agentId = user.agentProfile?.id
    if (!agentId) return { id: -1 }
    return { property: { agentId } }
  }
  return {}
}

// ===========================
// GET /api/rents
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { propertyId, tenantId, page = 1, limit = 100, search } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = buildRentWhere(req.user)
    if (propertyId) where.propertyId = parseInt(propertyId)
    if (tenantId) where.tenantId = parseInt(tenantId)
    if (search) {
      where.OR = [
        { receiptNo: { contains: search, mode: 'insensitive' } },
        { paymentMethod: { contains: search, mode: 'insensitive' } },
        { tenant: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [rents, total] = await Promise.all([
      prisma.rent.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, address: true, city: true, landlordId: true } },
          tenant: { select: { id: true, name: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.rent.count({ where })
    ])

    const totalCredit = rents.reduce((sum, r) => sum + (r.credit || r.amountPaid || 0), 0)
    const totalDebit = rents.reduce((sum, r) => sum + (r.debit || 0), 0)

    res.json({
      rents,
      total,
      totalRevenue: totalCredit,
      totalCredit,
      totalDebit,
      pages: Math.ceil(total / parseInt(limit)) || 1,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/rents/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const rent = await prisma.rent.findUnique({
      where: { id },
      include: {
        property: { include: { landlord: true, agent: true } },
        tenant: true
      }
    })
    if (!rent) return res.status(404).json({ error: 'Rent record not found.' })
    res.json({ rent })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/rents
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      propertyId, tenantId, receiptNo, amountPaid, paymentDate,
      paymentMethod, debit, credit, balance, period
    } = req.body

    if (!propertyId) return res.status(400).json({ error: 'Property ID is required.' })

    // Auto-generate receipt number if not provided
    const lastRent = await prisma.rent.findFirst({ orderBy: { id: 'desc' } })
    const nextId = (lastRent?.id || 0) + 1
    const autoReceiptNo = receiptNo || `REC-${String(nextId + 1000).padStart(4, '0')}`

    const rent = await prisma.rent.create({
      data: {
        propertyId: parseInt(propertyId),
        tenantId: tenantId ? parseInt(tenantId) : null,
        receiptNo: autoReceiptNo,
        amountPaid: amountPaid ? parseFloat(amountPaid) : null,
        paymentDate: paymentDate || new Date().toISOString(),
        paymentMethod: paymentMethod || 'Bank Transfer',
        debit: debit ? parseFloat(debit) : 0,
        credit: credit ? parseFloat(credit) : (amountPaid ? parseFloat(amountPaid) : 0),
        balance: balance ? parseFloat(balance) : 0,
        period: period || null,
      }
    })

    res.status(201).json({ success: true, rent })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/rents/:id
// ===========================
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { receiptNo, amountPaid, paymentDate, paymentMethod, debit, credit, balance, period } = req.body

    const rent = await prisma.rent.update({
      where: { id },
      data: {
        receiptNo: receiptNo || undefined,
        amountPaid: amountPaid ? parseFloat(amountPaid) : undefined,
        paymentDate: paymentDate || undefined,
        paymentMethod: paymentMethod || undefined,
        debit: debit !== undefined ? parseFloat(debit) : undefined,
        credit: credit !== undefined ? parseFloat(credit) : undefined,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        period: period || undefined,
      }
    })

    res.json({ success: true, rent })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/rents/:id
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.rent.delete({ where: { id } })
    res.json({ success: true, message: 'Rent record deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
