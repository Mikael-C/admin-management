const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin } = require('../middleware/auth')
const { logActivity } = require('../lib/activity')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/newsletters
// Admins see all; Landlords/Agents see newsletters targeted to them
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}
    if (req.user.role === 'landlord') {
      where.targetRole = { in: ['all', 'landlord'] }
    } else if (req.user.role === 'agent') {
      where.targetRole = { in: ['all', 'agent'] }
    }

    const [newsletters, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.newsletter.count({ where })
    ])

    res.json({
      newsletters,
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
// POST /api/newsletters
// Super Admin / Admin creates and broadcasts newsletter
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { title, content, targetRole = 'all' } = req.body

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' })
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        targetRole,
        senderId: req.user.id,
        senderName: req.user.name,
      }
    })

    // Also send an in-app message copy to all matching users so they see it in their inbox!
    let recipientUsersWhere = {}
    if (targetRole === 'landlord') {
      recipientUsersWhere.role = 'landlord'
    } else if (targetRole === 'agent') {
      recipientUsersWhere.role = 'agent'
    } else {
      recipientUsersWhere.role = { in: ['landlord', 'agent'] }
    }

    const recipientUsers = await prisma.user.findMany({
      where: recipientUsersWhere,
      select: { id: true }
    })

    if (recipientUsers.length > 0) {
      const messagesData = recipientUsers.map(u => ({
        senderId: req.user.id,
        receiverId: u.id,
        subject: `📢 Newsletter: ${title.trim()}`,
        content: content.trim(),
      }))
      await prisma.message.createMany({ data: messagesData })
    }

    // Log activity
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SEND_NEWSLETTER',
      description: `${req.user.name} broadcasted newsletter "${title.trim()}" to ${targetRole === 'all' ? 'all landlords & agents' : `${targetRole}s`} (${recipientUsers.length} recipients)`,
      entityType: 'Newsletter',
      entityId: newsletter.id,
    })

    res.status(201).json({
      success: true,
      message: `Newsletter sent successfully to ${recipientUsers.length} recipients.`,
      newsletter
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/newsletters/:id
// ===========================
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.newsletter.delete({ where: { id } })
    res.json({ success: true, message: 'Newsletter deleted successfully.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
