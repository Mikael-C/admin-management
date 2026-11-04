const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/activities
// Accessible by Super Admin and Admin staff
// ===========================
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { role, action, search, page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}

    if (role && role !== 'all') {
      where.userRole = role
    }

    if (action && action !== 'all') {
      where.action = action.toUpperCase()
    }

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.activityLog.count({ where })
    ])

    res.json({
      activities,
      total,
      pages: Math.ceil(total / parseInt(limit)) || 1,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
