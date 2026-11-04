const express = require('express')
const bcrypt = require('bcryptjs')
const { prisma } = require('../lib/db')
const { generateToken, authenticate } = require('../middleware/auth')

const router = express.Router()

// ===========================
// POST /api/auth/login
// ===========================
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        landlordProfile: { select: { id: true, bankName: true, accountNumber: true, accountName: true } },
        agentProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated. Contact administrator.' })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role })

    // Build response
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      landlordId: user.landlordProfile?.id || null,
      agentId: user.agentProfile?.id || null,
      adminId: user.adminProfile?.id || null,
    }

    // Role-specific redirect hint
    let redirectTo = '/dashboard'
    if (user.role === 'landlord') redirectTo = '/landlord'
    else if (user.role === 'agent') redirectTo = '/agent'
    else if (user.role === 'admin') redirectTo = '/dashboard'
    else if (user.role === 'super_admin') redirectTo = '/dashboard'

    const { logActivity } = require('../lib/activity')
    logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      description: `${user.name} (${user.role.replace('_', ' ')}) logged into the portal`,
      entityType: 'User',
      entityId: user.id,
    })

    res.json({
      success: true,
      token,
      user: userData,
      redirectTo,
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/auth/register
// (Super admin can create users)
// ===========================
router.post('/register', authenticate, async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body

    // Only super_admin can register new users directly
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create users.' })
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' })
    }

    const validRoles = ['super_admin', 'admin', 'landlord', 'agent']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` })
    }

    // Non-super_admin cannot create super_admin
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can create another super admin.' })
    }

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    // Hash password
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

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      }
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/auth/me
// ===========================
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        landlordProfile: true,
        agentProfile: true,
        adminProfile: true,
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Exclude password
    const { password, ...userData } = user

    res.json({ user: userData })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/auth/change-password
// ===========================
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const isValid = await bcrypt.compare(currentPassword, user.password)

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' })
    }

    const hashedNew = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNew }
    })

    res.json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
