const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')
const { logActivity } = require('../lib/activity')

const router = express.Router()
router.use(authenticate)

// ===========================
// GET /api/invoices
// Filterable by property, landlord, type, status, recipient
// ===========================
router.get('/', async (req, res, next) => {
  try {
    const {
      type,
      status,
      propertyId,
      landlordId,
      recipientType,
      search,
      page = 1,
      limit = 50
    } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}

    // Role-based visibility
    if (req.user.role === 'landlord') {
      const lid = req.user.landlordProfile?.id
      where.OR = [
        ...(lid ? [{ landlordId: lid }] : []),
        { userId: req.user.id }
      ]
    } else if (req.user.role === 'agent') {
      where.userId = req.user.id
    }

    if (type && type !== 'all') where.type = type
    if (status && status !== 'all') where.status = status
    if (propertyId && propertyId !== 'all') where.propertyId = parseInt(propertyId)
    if (landlordId && landlordId !== 'all') where.landlordId = parseInt(landlordId)
    if (recipientType && recipientType !== 'all') where.recipientType = recipientType

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          landlord: { select: { id: true, name: true, phone: true, email: true } },
          property: { select: { id: true, name: true, address: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where })
    ])

    const totalAmount = invoices.reduce((s, i) => s + (i.amount || 0), 0)
    const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0)
    const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (i.amount || 0), 0)

    res.json({
      invoices,
      total,
      totalAmount,
      paidAmount,
      pendingAmount,
      pages: Math.ceil(total / parseInt(limit)) || 1,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// GET /api/invoices/:id
// ===========================
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        landlord: { select: { id: true, name: true, phone: true, email: true, address: true, bankName: true, accountNumber: true, accountName: true } },
        property: { select: { id: true, name: true, address: true, city: true, state: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      }
    })

    if (!invoice) return res.status(404).json({ error: 'Invoice/Receipt not found.' })

    // Non-admins can only see their own
    if (req.user.role === 'landlord' && invoice.landlordId !== req.user.landlordProfile?.id && invoice.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' })
    }
    if (req.user.role === 'agent' && invoice.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    res.json({ invoice })
  } catch (err) {
    next(err)
  }
})

// ===========================
// POST /api/invoices
// Super Admin / Admin generates invoice or receipt
// ===========================
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      type = 'Invoice',
      recipientType = 'landlord',
      recipientName,
      recipientEmail,
      recipientPhone,
      userId,
      landlordId,
      propertyId,
      amount,
      description,
      items,
      status = 'Pending',
      issueDate = new Date().toISOString().split('T')[0],
      dueDate,
      bankName,
      accountNumber,
      accountName,
      notes
    } = req.body

    if (!recipientName || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Recipient name and a valid amount are required.' })
    }

    // Auto-generate invoice or receipt number
    const year = new Date().getFullYear()
    const prefix = type === 'Receipt' ? 'REC' : 'INV'
    const count = await prisma.invoice.count({ where: { type } })
    const invoiceNo = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type,
        recipientType,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail ? recipientEmail.trim() : null,
        recipientPhone: recipientPhone ? recipientPhone.trim() : null,
        userId: userId ? parseInt(userId) : null,
        landlordId: landlordId ? parseInt(landlordId) : null,
        propertyId: propertyId ? parseInt(propertyId) : null,
        amount: parseFloat(amount),
        description: description ? description.trim() : null,
        items: items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null,
        status,
        issueDate,
        dueDate: dueDate || null,
        paidDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        accountName: accountName || null,
        notes: notes ? notes.trim() : null,
        createdById: req.user.id,
      },
      include: {
        landlord: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } }
      }
    })

    // If recipient is a linked User, send an in-app notification message
    let targetUserId = userId ? parseInt(userId) : null
    if (!targetUserId && landlordId) {
      const l = await prisma.landlord.findUnique({ where: { id: parseInt(landlordId) }, select: { userId: true } })
      targetUserId = l?.userId || null
    }

    if (targetUserId) {
      await prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: targetUserId,
          subject: `📄 New ${type} Generated: ${invoiceNo}`,
          content: `Hello ${recipientName},\n\nA new ${type.toLowerCase()} (#${invoiceNo}) for ₦${parseFloat(amount).toLocaleString()} has been generated for you.\n\nDescription: ${description || 'N/A'}\nStatus: ${status}\nIssue Date: ${issueDate}`,
        }
      }).catch(() => null)
    }

    // Log activity
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: type === 'Receipt' ? 'GENERATE_RECEIPT' : 'GENERATE_INVOICE',
      description: `${req.user.name} generated ${type} #${invoiceNo} for ${recipientName} (₦${parseFloat(amount).toLocaleString()})`,
      entityType: 'Invoice',
      entityId: invoice.id,
    })

    res.status(201).json({
      success: true,
      message: `${type} #${invoiceNo} generated successfully.`,
      invoice
    })
  } catch (err) {
    next(err)
  }
})

// ===========================
// PATCH /api/invoices/:id/status
// ===========================
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { status, notes } = req.body

    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Invoice/Receipt not found.' })

    const updateData = { status }
    if (status === 'Paid') {
      updateData.paidDate = new Date().toISOString().split('T')[0]
    }
    if (notes) updateData.notes = notes

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData
    })

    // Log activity
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_INVOICE_STATUS',
      description: `${req.user.name} marked ${existing.type} #${existing.invoiceNo} as ${status}`,
      entityType: 'Invoice',
      entityId: invoice.id,
    })

    res.json({ success: true, message: `Status updated to ${status}.`, invoice })
  } catch (err) {
    next(err)
  }
})

// ===========================
// DELETE /api/invoices/:id
// ===========================
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.invoice.delete({ where: { id } })
    res.json({ success: true, message: 'Invoice deleted successfully.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
