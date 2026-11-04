const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/tenants
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { search, propertyId, status, page = 1, limit = 100 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}

    // Role-based filtering
    if (req.user.role === 'landlord') {
      const landlordId = req.user.landlordProfile?.id
      if (!landlordId) return res.json({ tenants: [], total: 0 })
      where.property = { landlordId }
    } else if (req.user.role === 'agent') {
      const agentId = req.user.agentProfile?.id
      if (!agentId) return res.json({ tenants: [], total: 0 })
      where.property = { agentId }
    }

    if (propertyId) where.propertyId = parseInt(propertyId)
    if (status) where.status = status

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          property: {
            select: {
              id: true, name: true, address: true, city: true,
              landlord: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.tenant.count({ where })
    ])

    res.json({
      tenants,
      total,
      pages: Math.ceil(total / parseInt(limit)) || 1,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/tenants/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            landlord: { select: { id: true, name: true, phone: true } },
            agent: { select: { id: true, name: true } }
          }
        },
        rents: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    })

    if (!tenant) return res.status(404).json({ error: 'Tenant not found.' })

    // Access control
    if (req.user.role === 'landlord') {
      if (tenant.property.landlord?.id !== req.user.landlordProfile?.id) {
        return res.status(403).json({ error: 'Access denied.' })
      }
    } else if (req.user.role === 'agent') {
      if (tenant.property.agent?.id !== req.user.agentProfile?.id) {
        return res.status(403).json({ error: 'Access denied.' })
      }
    }

    res.json({ tenant })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/tenants
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { propertyId, name, phone, email, rentAmount, accommodation, lastPaymentDate, nextDueDate, status, notes } = req.body

    if (!propertyId || !name) {
      return res.status(400).json({ error: 'Property ID and tenant name are required.' })
    }

    const tenant = await prisma.tenant.create({
      data: {
        propertyId: parseInt(propertyId),
        name: name.trim(),
        phone: phone || null,
        email: email ? email.toLowerCase().trim() : null,
        rentAmount: rentAmount ? parseFloat(rentAmount) : null,
        accommodation: accommodation || null,
        lastPaymentDate: lastPaymentDate || null,
        nextDueDate: nextDueDate || null,
        status: status || 'Current',
        notes: notes || null,
      }
    })

    res.status(201).json({ success: true, tenant })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/tenants/:id
// ===========================
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { name, phone, email, rentAmount, accommodation, lastPaymentDate, nextDueDate, status, notes, vacatedDate } = req.body

    // Agents can update status (vacated, etc.)
    // Admins can update everything

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email ? email.toLowerCase().trim() : null
    if (accommodation !== undefined) updateData.accommodation = accommodation
    if (lastPaymentDate !== undefined) updateData.lastPaymentDate = lastPaymentDate
    if (nextDueDate !== undefined) updateData.nextDueDate = nextDueDate
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (vacatedDate !== undefined) updateData.vacatedDate = vacatedDate
    if (rentAmount !== undefined && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      updateData.rentAmount = parseFloat(rentAmount)
    }

    const tenant = await prisma.tenant.update({ where: { id }, data: updateData })

    res.json({ success: true, tenant })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/tenants/:id (alias for status updates from agent)
router.patch('/:id', async (req, res, next) => {
  const { tenantId, ...body } = req.body
  req.params.id = req.params.id || tenantId
  req.body = body
  return router.handle(req, res, next)
})

// ===========================
// DELETE /api/tenants/:id
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.tenant.delete({ where: { id } })
    res.json({ success: true, message: 'Tenant deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
