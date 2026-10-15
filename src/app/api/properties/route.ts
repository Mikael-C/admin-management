import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = searchParams.get('status') || undefined
  const landlordId = searchParams.get('landlordId') ? parseInt(searchParams.get('landlordId')!) : undefined
  const agentId = searchParams.get('agentId') ? parseInt(searchParams.get('agentId')!) : undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const filtered = dataStore.getProperties({
    search,
    status,
    landlordId,
    agentId,
  })

  const start = (page - 1) * limit
  const properties = filtered.slice(start, start + limit)

  return NextResponse.json({
    properties,
    total: filtered.length,
    pages: Math.ceil(filtered.length / limit),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newProp = {
      id: dataStore.properties.length + 1,
      landlordId: body.landlordId || 1,
      assignedAgentId: body.assignedAgentId || 1,
      name: body.name || 'New Property',
      address: body.address || 'Address',
      city: body.city || 'Lagos',
      state: body.state || 'Lagos',
      type: body.type || 'Residential',
      status: body.status || 'Active',
      managementFee: body.managementFee || 50000,
    }
    dataStore.properties.push(newProp)
    return NextResponse.json(newProp, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create property' }, { status: 400 })
  }
}
