const express = require('express')
const { prisma } = require('../lib/db')
const { authenticate, requireAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/ledger
router.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 100 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}
    if (type) where.ledgerType = type

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.ledgerEntry.count({ where })
    ])

    res.json({ entries, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    next(err)
  }
})

// POST /api/ledger
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { date, receiptNo, particulars, period, debit, credit, balance, ledgerType } = req.body

    const entry = await prisma.ledgerEntry.create({
      data: {
        date: date || null,
        receiptNo: receiptNo || null,
        particulars: particulars || null,
        period: period || null,
        debit: debit ? parseFloat(debit) : null,
        credit: credit ? parseFloat(credit) : null,
        balance: balance ? parseFloat(balance) : null,
        ledgerType: ledgerType || 'Ledger',
      }
    })

    res.status(201).json({ success: true, entry })
  } catch (err) {
    next(err)
  }
})

module.exports = router
