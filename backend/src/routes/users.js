const express = require('express')
const bcrypt = require('bcryptjs')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/users
// Admin: all users | Others: self only
// ===========================
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' })
    }

    const { search, role, page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, phone: true,
          avatar: true, isActive: true, createdAt: true,
          landlordProfile: { select: { id: true, name: true } },
          agentProfile: { select: { id: true, name: true } },
          adminProfile: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where })
    ])

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/users/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    // Users can only see their own profile unless admin
    if (req.user.id !== id && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        avatar: true, isActive: true, createdAt: true, updatedAt: true,
        landlordProfile: true,
        agentProfile: true,
        adminProfile: true,
      }
    })

    if (!user) return res.status(404).json({ error: 'User not found.' })

    res.json({ user })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/users
// Create user (admin only)
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, email, password, role, phone, landlordId, agentId } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' })
    }

    const validRoles = ['super_admin', 'admin', 'landlord', 'agent']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Valid roles: ${validRoles.join(', ')}` })
    }

    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can create another super admin.' })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return res.status(409).json({ error: 'Email already in use.' })

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        phone: phone || null,
      }
    })

    // Link to landlord profile if role is landlord and landlordId provided
    if (role === 'landlord' && landlordId) {
      await prisma.landlord.update({
        where: { id: parseInt(landlordId) },
        data: { userId: user.id }
      })
    }

    // Link to agent profile if role is agent and agentId provided
    if (role === 'agent' && agentId) {
      await prisma.agent.update({
        where: { id: parseInt(agentId) },
        data: { userId: user.id }
      })
    }

    // Create admin staff profile if role is admin
    if (role === 'admin') {
      await prisma.adminStaff.create({ data: { userId: user.id } })
    }

    const { password: _, ...safeUser } = user
    res.status(201).json({ success: true, user: safeUser })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/users/:id
// Update user
// ===========================
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    // Users can update their own account; admins can update any
    if (req.user.id !== id && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const { name, phone, avatar, isActive, role } = req.body
    const updateData = {}
    if (name) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone
    if (avatar !== undefined) updateData.avatar = avatar

    // Only admins can change role and isActive
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      if (isActive !== undefined) updateData.isActive = isActive
      if (role && req.user.role === 'super_admin') updateData.role = role
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        avatar: true, isActive: true, updatedAt: true
      }
    })

    res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PATCH /api/users/:id/toggle-active
// Enable/Disable user account
// ===========================
router.patch('/:id/toggle-active', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'User not found.' })

    // Prevent deactivating super_admin
    if (existing.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot deactivate super admin.' })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, name: true, isActive: true, role: true }
    })

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/users/:id
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account.' })

    await prisma.user.delete({ where: { id } })
    res.json({ success: true, message: 'User deleted successfully.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
