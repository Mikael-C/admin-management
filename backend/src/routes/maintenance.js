const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

function buildMaintWhere(user) {
  if (user.role === 'landlord') {
    const landlordId = user.landlordProfile?.id
    if (!landlordId) return { id: -1 }
    return { property: { landlordId } }
  }
  if (user.role === 'agent') {
    const agentId = user.agentProfile?.id
    if (!agentId) return { id: -1 }
    return { agentId }
  }
  return {}
}

// GET /api/maintenance
router.get('/', async (req, res, next) => {
  try {
    const { propertyId, status, priority, page = 1, limit = 100 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = buildMaintWhere(req.user)
    if (propertyId) where.propertyId = parseInt(propertyId)
    if (status) where.status = status
    if (priority) where.priority = priority

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, address: true, city: true,
              landlord: { select: { id: true, name: true } }
            }
          },
          agent: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.maintenanceRequest.count({ where })
    ])

    res.json({
      requests,
      maintenance: requests,
      total,
      pages: Math.ceil(total / parseInt(limit)) || 1,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/maintenance/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: { include: { landlord: true } },
        agent: true
      }
    })
    if (!request) return res.status(404).json({ error: 'Maintenance request not found.' })
    res.json({ request })
  } catch (err) {
    next(err)
  }
})

// POST /api/maintenance
router.post('/', async (req, res, next) => {
  try {
    // Agents and admins can create maintenance requests
    if (!['super_admin', 'admin', 'agent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const {
      propertyId, agentId, requestedByName, title, description,
      category, priority, estimatedCost
    } = req.body

    if (!title || !propertyId) {
      return res.status(400).json({ error: 'Title and property ID are required.' })
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        propertyId: parseInt(propertyId),
        agentId: agentId ? parseInt(agentId) : (req.user.agentProfile?.id || null),
        requestedByName: requestedByName || req.user.name,
        title: title.trim(),
        description: description || null,
        category: category || 'General',
        priority: priority || 'Medium',
        status: 'Needs Repair',
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      },
      include: {
        property: { select: { id: true, name: true, address: true } }
      }
    })

    res.status(201).json({ success: true, request })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/maintenance/:id - Update status/notes/cost
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { status, notes, actualCost, repairedDate } = req.body

    const updateData = {}
    if (status) {
      updateData.status = status
      if (status === 'Repaired' && !repairedDate) {
        updateData.repairedDate = new Date()
      }
    }
    if (notes !== undefined) updateData.notes = notes
    if (actualCost !== undefined) updateData.actualCost = parseFloat(actualCost)
    if (repairedDate) updateData.repairedDate = new Date(repairedDate)

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true, address: true } }
      }
    })

    res.json({ success: true, request })
  } catch (err) {
    next(err)
  }
})

// PUT /api/maintenance/:id - Full update (admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { title, description, category, priority, status, estimatedCost, actualCost, notes, agentId, repairedDate } = req.body

    const updateData = {}
    if (title) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description
    if (category) updateData.category = category
    if (priority) updateData.priority = priority
    if (status) {
      updateData.status = status
      if (status === 'Repaired') updateData.repairedDate = repairedDate ? new Date(repairedDate) : new Date()
    }
    if (estimatedCost !== undefined) updateData.estimatedCost = parseFloat(estimatedCost)
    if (actualCost !== undefined) updateData.actualCost = parseFloat(actualCost)
    if (notes !== undefined) updateData.notes = notes
    if (agentId !== undefined) updateData.agentId = agentId ? parseInt(agentId) : null

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData
    })

    res.json({ success: true, request })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/maintenance/:id
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.maintenanceRequest.delete({ where: { id } })
    res.json({ success: true, message: 'Maintenance request deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
