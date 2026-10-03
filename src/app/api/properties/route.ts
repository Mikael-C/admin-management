import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const landlordId = searchParams.get('landlordId')

  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { address: { contains: search } },
    ]
  }
  if (status) where.status = status
  if (landlordId) where.landlordId = parseInt(landlordId)

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: {
        landlord: { select: { name: true } },
        _count: { select: { tenants: true } }
      },
      orderBy: { name: 'asc' },
    }),
    prisma.property.count({ where }),
  ])

  return NextResponse.json({
    properties,
    total,
    pages: Math.ceil(total / limit),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const property = await prisma.property.create({
      data: body,
    })
    return NextResponse.json(property)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}

