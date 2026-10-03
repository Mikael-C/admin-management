import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const where = search
    ? {
        name: { contains: search, mode: 'insensitive' as const },
      }
    : {}

  const [landlords, total] = await Promise.all([
    prisma.landlord.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: { properties: true }
        }
      },
      orderBy: { name: 'asc' },
    }),
    prisma.landlord.count({ where }),
  ])

  return NextResponse.json({
    landlords,
    total,
    pages: Math.ceil(total / limit),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email, address } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const landlord = await prisma.landlord.create({
      data: { name, phone, email, address },
    })

    return NextResponse.json(landlord)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create landlord' }, { status: 500 })
  }
}
