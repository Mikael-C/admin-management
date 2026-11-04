const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')
const { logActivity } = require('../lib/activity')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/payouts
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}

    // Landlords can only see their own payout requests
    if (req.user.role === 'landlord') {
      const landlordId = req.user.landlordProfile?.id
      if (!landlordId) return res.json({ payouts: [], total: 0 })
      where.landlordId = landlordId
    }

    if (status) where.status = status

    const [payouts, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        include: {
          landlord: { select: { id: true, name: true, bankName: true, accountNumber: true, accountName: true } },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.payoutRequest.count({ where })
    ])

    res.json({ payouts, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/payouts/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    const payout = await prisma.payoutRequest.findUnique({
      where: { id },
      include: {
        landlord: { select: { id: true, name: true, bankName: true, accountNumber: true, accountName: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    })

    if (!payout) return res.status(404).json({ error: 'Payout request not found.' })

    // Landlords can only see their own
    if (req.user.role === 'landlord' && payout.landlordId !== req.user.landlordProfile?.id) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    res.json({ payout })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/payouts
// Landlord requests a payout
// ===========================
router.post('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'landlord' && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only landlords can request payouts.' })
    }

    const { amount, description, bankName, accountNumber, accountName, landlordId } = req.body

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payout amount is required.' })
    }

    // Determine landlord ID
    let resolvedLandlordId = req.user.landlordProfile?.id
    if ((req.user.role === 'super_admin' || req.user.role === 'admin') && landlordId) {
      resolvedLandlordId = parseInt(landlordId)
    }

    if (!resolvedLandlordId) {
      return res.status(400).json({ error: 'Landlord profile not found.' })
    }

    // Get landlord bank details if not provided
    const landlord = await prisma.landlord.findUnique({ where: { id: resolvedLandlordId } })

    const payout = await prisma.payoutRequest.create({
      data: {
        landlordId: resolvedLandlordId,
        userId: req.user.id,
        amount: parseFloat(amount),
        description: description || null,
        bankName: bankName || landlord?.bankName || null,
        accountNumber: accountNumber || landlord?.accountNumber || null,
        accountName: accountName || landlord?.accountName || null,
        status: 'Pending',
      },
      include: {
        landlord: { select: { id: true, name: true, bankName: true, accountNumber: true } }
      }
    })

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'REQUEST_PAYOUT',
      description: `${req.user.name} requested a payout of ₦${parseFloat(amount).toLocaleString()}`,
      entityType: 'Payout',
      entityId: payout.id,
    })

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully. Awaiting super admin approval.',
      payout
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/payouts/:id/approve
// Super admin approves payout
// ===========================
router.put('/:id/approve', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { adminNote } = req.body

    const existing = await prisma.payoutRequest.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Payout request not found.' })
    if (existing.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot approve a payout with status: ${existing.status}` })
    }

    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedAt: new Date(),
        approvedBy: req.user.id,
        adminNote: adminNote || null,
      },
      include: {
        landlord: { select: { id: true, name: true } }
      }
    })

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'APPROVE_PAYOUT',
      description: `${req.user.name} approved payout #${payout.id} (₦${existing.amount.toLocaleString()}) for ${payout.landlord.name}`,
      entityType: 'Payout',
      entityId: payout.id,
    })

    res.json({
      success: true,
      message: `Payout of ₦${existing.amount.toLocaleString()} approved for ${payout.landlord.name}.`,
      payout
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/payouts/:id/disburse
// Super admin marks payout as disbursed
// ===========================
router.put('/:id/disburse', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { adminNote } = req.body

    const existing = await prisma.payoutRequest.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Payout request not found.' })
    if (existing.status !== 'Approved') {
      return res.status(400).json({ error: 'Payout must be approved before disbursement.' })
    }

    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: 'Disbursed',
        disbursedAt: new Date(),
        disbursedBy: req.user.id,
        adminNote: adminNote || existing.adminNote,
      },
      include: {
        landlord: { select: { id: true, name: true } }
      }
    })

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DISBURSE_PAYOUT',
      description: `${req.user.name} marked payout #${payout.id} (₦${existing.amount.toLocaleString()}) as disbursed to ${payout.landlord.name}`,
      entityType: 'Payout',
      entityId: payout.id,
    })

    res.json({
      success: true,
      message: `Payout of ₦${existing.amount.toLocaleString()} disbursed to ${payout.landlord.name}.`,
      payout
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PUT /api/payouts/:id/reject
// Super admin rejects payout
// ===========================
router.put('/:id/reject', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { adminNote } = req.body

    const existing = await prisma.payoutRequest.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Payout request not found.' })
    if (!['Pending', 'Approved'].includes(existing.status)) {
      return res.status(400).json({ error: `Cannot reject a payout with status: ${existing.status}` })
    }

    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        adminNote: adminNote || 'Rejected by administrator.',
      }
    })

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'REJECT_PAYOUT',
      description: `${req.user.name} rejected payout #${existing.id} (₦${existing.amount.toLocaleString()})`,
      entityType: 'Payout',
      entityId: existing.id,
    })

    res.json({ success: true, message: 'Payout request rejected.', payout })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/payouts/:id
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.payoutRequest.delete({ where: { id } })
    res.json({ success: true, message: 'Payout request deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
