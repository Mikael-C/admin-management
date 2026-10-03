import { NextResponse } from 'next/server'

const TENANTS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Test Tenant ${i + 1}`,
  property: { address: `Plot ${(i % 3) + 1} Block ${Math.floor(i / 3) + 1}, Victoria Island` },
  rentAmount: 1500000,
  lastPaymentDate: '2026-09-01',
  nextDueDate: '2027-09-01',
  status: i % 5 === 3 ? 'Overdue' : i % 7 === 6 ? 'Vacated' : 'Current',
}))

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').toLowerCase()
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  let filtered = TENANTS
  if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search))
  if (status) filtered = filtered.filter(t => t.status === status)

  const start = (page - 1) * limit
  const tenants = filtered.slice(start, start + limit)

  return NextResponse.json({ tenants, total: filtered.length, pages: Math.ceil(filtered.length / limit) })
}

export async function POST() {
  return NextResponse.json({ message: 'Demo mode — data is not persisted.' })
}
