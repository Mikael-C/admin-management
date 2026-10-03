import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const propertyId = searchParams.get('propertyId')

  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }
  if (status && status !== 'All') where.status = status
  if (propertyId && propertyId !== 'All') where.propertyId = parseInt(propertyId)

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      include: {
        property: { select: { name: true, address: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.count({ where }),
  ])

  return NextResponse.json({
    tenants,
    total,
    pages: Math.ceil(total / limit),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const tenant = await prisma.tenant.create({
      data: body,
    })
    return NextResponse.json(tenant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}
