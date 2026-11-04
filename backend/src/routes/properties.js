const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// Helper: build where clause based on role
function buildPropertyWhere(user, extra = {}) {
  if (user.role === 'landlord') {
    const landlordId = user.landlordProfile?.id
    if (!landlordId) return { id: -1 } // No results
    return { landlordId, ...extra }
  }
  if (user.role === 'agent') {
    const agentId = user.agentProfile?.id
    if (!agentId) return { id: -1 }
    return { agentId, ...extra }
  }
  return extra // admin/super_admin sees all
}

// ===========================
// GET /api/properties
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { search, landlordId, agentId, type, status, page = 1, limit = 100 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = buildPropertyWhere(req.user)

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (landlordId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      where.landlordId = parseInt(landlordId)
    }
    if (agentId && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      where.agentId = parseInt(agentId)
    }
    if (type) where.type = type
    if (status) where.status = status

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          landlord: { select: { id: true, name: true, phone: true } },
          agent: { select: { id: true, name: true } },
          _count: { select: { tenants: true, rents: true, expenses: true } }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.property.count({ where })
    ])

    res.json({ properties, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/properties/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const where = buildPropertyWhere(req.user, { id })

    const property = await prisma.property.findFirst({
      where,
      include: {
        landlord: true,
        agent: true,
        tenants: { orderBy: { createdAt: 'asc' } },
        rents: { orderBy: { createdAt: 'desc' }, take: 20 },
        expenses: { orderBy: { createdAt: 'desc' }, take: 20 },
        maintenanceRequests: { orderBy: { createdAt: 'desc' } }
      }
    })

    if (!property) return res.status(404).json({ error: 'Property not found or access denied.' })

    res.json({ property })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/properties
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { landlordId, agentId, name, address, city, state, type, status, managementFee } = req.body

    if (!landlordId) return res.status(400).json({ error: 'Landlord ID is required.' })

    const property = await prisma.property.create({
      data: {
        landlordId: parseInt(landlordId),
        agentId: agentId ? parseInt(agentId) : null,
        name: name || null,
        address: address || null,
        city: city || null,
        state: state || null,
        type: type || 'Residential',
        status: status || 'Active',
        managementFee: managementFee ? parseFloat(managementFee) : null,
      },
      include: {
        landlord: { select: { id: true, name: true } },
        agent: { select: { id: true, name: true } }
      }
    })

    res.status(201).json({ success: true, property })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/properties/:id
// ===========================
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    // Check access
    if (req.user.role === 'landlord' || req.user.role === 'agent') {
      const existing = await prisma.property.findFirst({
        where: buildPropertyWhere(req.user, { id })
      })
      if (!existing) return res.status(403).json({ error: 'Access denied.' })
    }

    const { landlordId, agentId, name, address, city, state, type, status, managementFee } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (managementFee !== undefined) updateData.managementFee = parseFloat(managementFee)
    if (landlordId !== undefined && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      updateData.landlordId = parseInt(landlordId)
    }
    if (agentId !== undefined && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      updateData.agentId = agentId ? parseInt(agentId) : null
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        landlord: { select: { id: true, name: true } },
        agent: { select: { id: true, name: true } }
      }
    })

    res.json({ success: true, property })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/properties/:id
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.property.delete({ where: { id } })
    res.json({ success: true, message: 'Property deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
