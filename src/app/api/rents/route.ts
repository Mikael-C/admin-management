import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || '' // search across tenant name, property address, and receiptNo

  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { receiptNo: { contains: search, mode: 'insensitive' } },
      { tenant: { name: { contains: search, mode: 'insensitive' } } },
      { property: { address: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [rents, total, aggregates] = await Promise.all([
    prisma.rent.findMany({
      where,
      skip,
      take: limit,
      include: {
        tenant: { select: { name: true } },
        property: { select: { address: true } },
      },
      orderBy: { id: 'asc' }, // usually ordered by date or id
    }),
    prisma.rent.count({ where }),
    prisma.rent.aggregate({
      where,
      _sum: { debit: true, credit: true }
    })
  ])

  return NextResponse.json({
    rents,
    total,
    pages: Math.ceil(total / limit),
    totalDebit: aggregates._sum.debit || 0,
    totalCredit: aggregates._sum.credit || 0
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rent = await prisma.rent.create({
      data: body,
    })
    return NextResponse.json(rent)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
