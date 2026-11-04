const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/agents
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query

    // Agents can only see themselves
    if (req.user.role === 'agent') {
      const agentId = req.user.agentProfile?.id
      if (!agentId) return res.json({ agents: [] })
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          user: { select: { id: true, email: true, isActive: true } },
          _count: { select: { properties: true } }
        }
      })
      return res.json({ agents: agent ? [agent] : [] })
    }

    let where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const agents = await prisma.agent.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        _count: { select: { properties: true, maintenanceRequests: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ agents })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/agents/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (req.user.role === 'agent' && req.user.agentProfile?.id !== id) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, isActive: true, createdAt: true } },
        properties: {
          include: {
            landlord: { select: { id: true, name: true } },
            _count: { select: { tenants: true } }
          }
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { property: { select: { id: true, name: true, address: true } } }
        }
      }
    })

    if (!agent) return res.status(404).json({ error: 'Agent not found.' })

    res.json({ agent })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/agents
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, phone, email, address, bankName, accountNumber, accountName, bio, licenseNo } = req.body

    if (!name) return res.status(400).json({ error: 'Agent name is required.' })

    const agent = await prisma.agent.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        email: email ? email.toLowerCase().trim() : null,
        address: address || null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        accountName: accountName || null,
        bio: bio || null,
        licenseNo: licenseNo || null,
      }
    })

    res.status(201).json({ success: true, agent })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/agents/:id
// ===========================
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    if (req.user.role === 'agent' && req.user.agentProfile?.id !== id) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    if (req.user.role === 'landlord') {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const { name, phone, email, address, bankName, accountNumber, accountName, bio, licenseNo } = req.body

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name: name?.trim(),
        phone: phone || undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        address: address || undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        accountName: accountName || undefined,
        bio: bio || undefined,
        licenseNo: licenseNo || undefined,
      }
    })

    res.json({ success: true, agent })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/agents/:id
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.agent.delete({ where: { id } })
    res.json({ success: true, message: 'Agent deleted successfully.' })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/agents/:id/stats
// Agent dashboard stats
// ===========================
router.get('/:id/stats', async (req, res, next) => {
  try {
    const agentId = parseInt(req.params.id)

    if (req.user.role === 'agent' && req.user.agentProfile?.id !== agentId) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        properties: {
          include: {
            landlord: { select: { id: true, name: true, phone: true } },
            tenants: true,
            maintenanceRequests: true,
            _count: { select: { tenants: true } }
          }
        },
        maintenanceRequests: {
          include: { property: { select: { id: true, name: true, address: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!agent) return res.status(404).json({ error: 'Agent not found.' })

    const tenants = agent.properties.flatMap(p => p.tenants.map(t => ({
      ...t,
      property: { id: p.id, name: p.name, address: p.address }
    })))

    const stats = {
      assignedPropertiesCount: agent.properties.length,
      totalTenantsCount: tenants.length,
      activeTenantsCount: tenants.filter(t => t.status === 'Current').length,
      vacatedTenantsCount: tenants.filter(t => t.status === 'Vacated').length,
      vacantPropertiesCount: agent.properties.filter(p => p.status === 'Vacant').length,
      pendingRepairsCount: agent.maintenanceRequests.filter(m => m.status === 'Needs Repair').length,
      inProgressRepairsCount: agent.maintenanceRequests.filter(m => m.status === 'In Progress').length,
      completedRepairsCount: agent.maintenanceRequests.filter(m => m.status === 'Repaired').length,
    }

    res.json({
      agent: { id: agent.id, name: agent.name, email: agent.email, phone: agent.phone },
      stats,
      assignedProperties: agent.properties,
      tenants,
      maintenance: agent.maintenanceRequests,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
