import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').toLowerCase()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  let landlords = dataStore.getLandlords()
  if (search) {
    landlords = landlords.filter(l =>
      l.name.toLowerCase().includes(search) ||
      l.email.toLowerCase().includes(search) ||
      l.phone.toLowerCase().includes(search)
    )
  }

  const start = (page - 1) * limit
  const paginated = landlords.slice(start, start + limit)

  return NextResponse.json({
    landlords: paginated,
    total: landlords.length,
    pages: Math.ceil(landlords.length / limit),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newLandlord = {
      id: dataStore.landlords.length + 1,
      name: body.name || 'New Landlord',
      phone: body.phone || '08000000000',
      email: body.email || `landlord${dataStore.landlords.length + 1}@example.com`,
      address: body.address || 'Lagos, Nigeria',
    }
    dataStore.landlords.push(newLandlord)
    return NextResponse.json(newLandlord, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create landlord' }, { status: 400 })
  }
}
