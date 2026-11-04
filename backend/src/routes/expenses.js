const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

function buildExpenseWhere(user) {
  if (user.role === 'landlord') {
    const landlordId = user.landlordProfile?.id
    if (!landlordId) return { id: -1 }
    return { property: { landlordId } }
  }
  if (user.role === 'agent') {
    const agentId = user.agentProfile?.id
    if (!agentId) return { id: -1 }
    return { property: { agentId } }
  }
  return {}
}

// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const { propertyId, page = 1, limit = 100, search } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = buildExpenseWhere(req.user)
    if (propertyId) where.propertyId = parseInt(propertyId)
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { receiptNo: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, address: true, landlordId: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.expense.count({ where })
    ])

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.debit || 0), 0)

    res.json({ expenses, total, totalExpenses, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    next(err)
  }
})

// GET /api/expenses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { property: { include: { landlord: true } } }
    })
    if (!expense) return res.status(404).json({ error: 'Expense not found.' })
    res.json({ expense })
  } catch (err) {
    next(err)
  }
})

// POST /api/expenses
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { propertyId, description, debit, period, credit, debitBalance, creditBalance, balance, receiptNo, category } = req.body

    const expense = await prisma.expense.create({
      data: {
        propertyId: propertyId ? parseInt(propertyId) : null,
        description: description || null,
        debit: debit ? parseFloat(debit) : null,
        period: period || null,
        credit: credit ? parseFloat(credit) : 0,
        debitBalance: debitBalance ? parseFloat(debitBalance) : null,
        creditBalance: creditBalance ? parseFloat(creditBalance) : null,
        balance: balance ? parseFloat(balance) : null,
        receiptNo: receiptNo || null,
        category: category || null,
      }
    })

    res.status(201).json({ success: true, expense })
  } catch (err) {
    next(err)
  }
})

// PUT /api/expenses/:id
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { description, debit, period, credit, balance, receiptNo, category } = req.body

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description: description || undefined,
        debit: debit !== undefined ? parseFloat(debit) : undefined,
        period: period || undefined,
        credit: credit !== undefined ? parseFloat(credit) : undefined,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        receiptNo: receiptNo || undefined,
        category: category || undefined,
      }
    })

    res.json({ success: true, expense })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/expenses/:id
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.expense.delete({ where: { id } })
    res.json({ success: true, message: 'Expense deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
