const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/profile
// Get current user's full profile
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        landlordProfile: true,
        agentProfile: true,
        adminProfile: true,
      }
    })

    if (!user) return res.status(404).json({ error: 'Profile not found.' })

    const { password, ...userData } = user

    // Build role-specific profile
    let profile = {
      ...userData,
      roleProfile: null,
    }

    if (user.role === 'landlord' && user.landlordProfile) {
      profile.roleProfile = {
        type: 'landlord',
        ...user.landlordProfile,
      }
    } else if (user.role === 'agent' && user.agentProfile) {
      profile.roleProfile = {
        type: 'agent',
        ...user.agentProfile,
      }
    } else if ((user.role === 'admin' || user.role === 'super_admin') && user.adminProfile) {
      // Don't include account number for super_admin in self-view
      const { accountNumber, ...adminData } = user.adminProfile
      profile.roleProfile = {
        type: user.role,
        ...(user.role === 'super_admin' ? adminData : user.adminProfile),
      }
    }

    res.json({ profile })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/profile/:userId
// Get another user's profile (admin only, or self)
// ===========================
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId)

    // Allow self view or admin/super_admin
    if (req.user.id !== userId && !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        landlordProfile: true,
        agentProfile: true,
        adminProfile: true,
      }
    })

    if (!user) return res.status(404).json({ error: 'User not found.' })

    const { password, ...userData } = user

    // Hide account number on super_admin profile pages
    if (userData.role === 'super_admin' && userData.adminProfile) {
      delete userData.adminProfile.accountNumber
    }

    res.json({ profile: userData })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/profile
// Update current user's profile
// ===========================
router.put('/', async (req, res, next) => {
  try {
    const { name, phone, avatar,
      // Role-specific fields
      bankName, accountNumber, accountName,
      address, bio, nin, licenseNo,
      department, position, staffId
    } = req.body

    // Update base user
    const userUpdate = {}
    if (name) userUpdate.name = name.trim()
    if (phone !== undefined) userUpdate.phone = phone
    if (avatar !== undefined) userUpdate.avatar = avatar

    await prisma.user.update({ where: { id: req.user.id }, data: userUpdate })

    // Update role-specific profile
    if (req.user.role === 'landlord' && req.user.landlordProfile?.id) {
      const landlordUpdate = {}
      if (phone !== undefined) landlordUpdate.phone = phone
      if (address !== undefined) landlordUpdate.address = address
      if (bankName !== undefined) landlordUpdate.bankName = bankName
      if (accountNumber !== undefined) landlordUpdate.accountNumber = accountNumber
      if (accountName !== undefined) landlordUpdate.accountName = accountName
      if (bio !== undefined) landlordUpdate.bio = bio
      if (nin !== undefined) landlordUpdate.nin = nin

      await prisma.landlord.update({
        where: { id: req.user.landlordProfile.id },
        data: landlordUpdate
      })
    }

    if (req.user.role === 'agent' && req.user.agentProfile?.id) {
      const agentUpdate = {}
      if (phone !== undefined) agentUpdate.phone = phone
      if (address !== undefined) agentUpdate.address = address
      if (bankName !== undefined) agentUpdate.bankName = bankName
      if (accountNumber !== undefined) agentUpdate.accountNumber = accountNumber
      if (accountName !== undefined) agentUpdate.accountName = accountName
      if (bio !== undefined) agentUpdate.bio = bio
      if (licenseNo !== undefined) agentUpdate.licenseNo = licenseNo

      await prisma.agent.update({
        where: { id: req.user.agentProfile.id },
        data: agentUpdate
      })
    }

    if ((req.user.role === 'admin' || req.user.role === 'super_admin') && req.user.adminProfile?.id) {
      const adminUpdate = {}
      if (department !== undefined) adminUpdate.department = department
      if (position !== undefined) adminUpdate.position = position
      if (staffId !== undefined) adminUpdate.staffId = staffId
      if (bio !== undefined) adminUpdate.bio = bio
      // super_admin: no account number field
      if (req.user.role === 'admin') {
        if (bankName !== undefined) adminUpdate.bankName = bankName
        if (accountNumber !== undefined) adminUpdate.accountNumber = accountNumber
        if (accountName !== undefined) adminUpdate.accountName = accountName
      }

      await prisma.adminStaff.update({
        where: { id: req.user.adminProfile.id },
        data: adminUpdate
      })
    }

    // Fetch updated profile
    const updated = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        landlordProfile: true,
        agentProfile: true,
        adminProfile: true,
      }
    })

    const { password, ...safeUser } = updated
    res.json({ success: true, profile: safeUser })
  } catch (err) {
    next(err)
  }
})

module.exports = router
