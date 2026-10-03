import { NextResponse } from 'next/server'

const LANDLORDS = [
  { id: 1, name: 'Client Landlord 1', phone: '08012345670', email: 'landlord1@example.com', address: '10 Real Estate Avenue, Lagos', _count: { properties: 3 } },
  { id: 2, name: 'Client Landlord 2', phone: '08012345671', email: 'landlord2@example.com', address: '11 Real Estate Avenue, Lagos', _count: { properties: 3 } },
  { id: 3, name: 'Client Landlord 3', phone: '08012345672', email: 'landlord3@example.com', address: '12 Real Estate Avenue, Lagos', _count: { properties: 3 } },
  { id: 4, name: 'Client Landlord 4', phone: '08012345673', email: 'landlord4@example.com', address: '13 Real Estate Avenue, Lagos', _count: { properties: 3 } },
  { id: 5, name: 'Client Landlord 5', phone: '08012345674', email: 'landlord5@example.com', address: '14 Real Estate Avenue, Lagos', _count: { properties: 3 } },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').toLowerCase()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const filtered = LANDLORDS.filter(l =>
    !search || l.name.toLowerCase().includes(search)
  )

  const start = (page - 1) * limit
  const landlords = filtered.slice(start, start + limit)

  return NextResponse.json({
    landlords,
    total: filtered.length,
    pages: Math.ceil(filtered.length / limit),
  })
}

export async function POST() {
  return NextResponse.json({ message: 'Demo mode — data is not persisted.' })
}
