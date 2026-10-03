import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || '' // search across description, receiptNo, period

  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { receiptNo: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { period: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [expenses, total, aggregates] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      include: {
        property: { select: { address: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({
      where,
      _sum: { debit: true, credit: true }
    })
  ])

  return NextResponse.json({
    expenses,
    total,
    pages: Math.ceil(total / limit),
    totalDebit: aggregates._sum.debit || 0,
    totalCredit: aggregates._sum.credit || 0
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const expense = await prisma.expense.create({
      data: body,
    })
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 })
  }
}
