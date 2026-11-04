const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/messages
// Get inbox messages for logged-in user
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { type = 'inbox', page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}
    if (type === 'inbox') {
      where.receiverId = req.user.id
    } else if (type === 'sent') {
      where.senderId = req.user.id
    } else {
      where.OR = [{ senderId: req.user.id }, { receiverId: req.user.id }]
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { ...where, parentId: null }, // top-level only
        include: {
          sender: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          receiver: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          _count: { select: { replies: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.message.count({ where: { ...where, parentId: null } })
    ])

    // Unread count
    const unreadCount = await prisma.message.count({
      where: { receiverId: req.user.id, isRead: false }
    })

    res.json({ messages, total, unreadCount, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/messages/conversations
// Get list of conversations
// ===========================
router.get('/conversations', async (req, res, next) => {
  try {
    // Get all users I've had conversations with
    const sent = await prisma.message.findMany({
      where: { senderId: req.user.id, parentId: null },
      select: { receiverId: true },
      distinct: ['receiverId']
    })
    const received = await prisma.message.findMany({
      where: { receiverId: req.user.id, parentId: null },
      select: { senderId: true },
      distinct: ['senderId']
    })

    const contactIds = new Set([
      ...sent.map(m => m.receiverId),
      ...received.map(m => m.senderId)
    ])
    contactIds.delete(req.user.id)

    const conversations = await Promise.all(
      Array.from(contactIds).map(async (contactId) => {
        const contact = await prisma.user.findUnique({
          where: { id: contactId },
          select: { id: true, name: true, email: true, role: true, avatar: true }
        })

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: req.user.id, receiverId: contactId },
              { senderId: contactId, receiverId: req.user.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        })

        const unreadCount = await prisma.message.count({
          where: { senderId: contactId, receiverId: req.user.id, isRead: false }
        })

        return { contact, lastMessage, unreadCount }
      })
    )

    // Sort by last message date
    conversations.sort((a, b) => {
      const aDate = a.lastMessage?.createdAt || new Date(0)
      const bDate = b.lastMessage?.createdAt || new Date(0)
      return new Date(bDate) - new Date(aDate)
    })

    res.json({ conversations })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/messages/thread/:userId
// Get conversation thread with a specific user
// ===========================
router.get('/thread/:userId', async (req, res, next) => {
  try {
    const otherUserId = parseInt(req.params.userId)
    const { page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.user.id }
        ]
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
        receiver: { select: { id: true, name: true, role: true, avatar: true } },
        replies: {
          include: {
            sender: { select: { id: true, name: true, role: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: parseInt(limit),
    })

    // Mark as read
    await prisma.message.updateMany({
      where: { senderId: otherUserId, receiverId: req.user.id, isRead: false },
      data: { isRead: true }
    })

    // Get contact info
    const contact = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, email: true, role: true, avatar: true }
    })

    res.json({ messages, contact })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/messages
// Send a new message
// ===========================
router.post('/', async (req, res, next) => {
  try {
    const { receiverId, subject, content, parentId } = req.body

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required.' })
    }

    // Validate allowed communication:
    // super_admin <-> landlord, super_admin <-> agent, admin <-> any
    const receiver = await prisma.user.findUnique({
      where: { id: parseInt(receiverId) },
      select: { id: true, name: true, role: true }
    })

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found.' })
    }

    // Communication rules:
    const senderRole = req.user.role
    const receiverRole = receiver.role

    const isAllowed =
      senderRole === 'super_admin' || receiverRole === 'super_admin' ||
      senderRole === 'admin' || receiverRole === 'admin' ||
      (senderRole === 'landlord' && receiverRole === 'landlord') // same group can optionally chat

    if (!isAllowed) {
      return res.status(403).json({ error: 'You are not allowed to message this user.' })
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId: parseInt(receiverId),
        subject: subject || null,
        content: content.trim(),
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
        receiver: { select: { id: true, name: true, role: true, avatar: true } },
      }
    })

    res.status(201).json({ success: true, message })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PATCH /api/messages/:id/read
// Mark message as read
// ===========================
router.patch('/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.message.updateMany({
      where: { id, receiverId: req.user.id },
      data: { isRead: true }
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/messages/contacts
// Get list of users you can message (super_admin, admin, and your group)
// ===========================
router.get('/contacts', async (req, res, next) => {
  try {
    let where = {}

    if (req.user.role === 'landlord' || req.user.role === 'agent') {
      // Can only message super_admin and admin
      where.role = { in: ['super_admin', 'admin'] }
    } else if (req.user.role === 'admin') {
      // Can message everyone
      where.id = { not: req.user.id }
    } else if (req.user.role === 'super_admin') {
      // Can message everyone
      where.id = { not: req.user.id }
    }

    const contacts = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, avatar: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    })

    res.json({ contacts })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/messages/:id
// ===========================
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const message = await prisma.message.findUnique({ where: { id } })

    if (!message) return res.status(404).json({ error: 'Message not found.' })
    if (message.senderId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'You can only delete your own messages.' })
    }

    await prisma.message.delete({ where: { id } })
    res.json({ success: true, message: 'Message deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
