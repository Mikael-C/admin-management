import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = searchParams.get('status') || undefined
  const propertyId = searchParams.get('propertyId') ? parseInt(searchParams.get('propertyId')!) : undefined
  const agentId = searchParams.get('agentId') ? parseInt(searchParams.get('agentId')!) : undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const filtered = dataStore.getTenants({
    search,
    status,
    propertyId,
    agentId,
  })

  const start = (page - 1) * limit
  const tenants = filtered.slice(start, start + limit)

  return NextResponse.json({
    tenants,
    total: filtered.length,
    pages: Math.ceil(filtered.length / limit),
  })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, status, notes, vacatedDate } = body
    if (!tenantId || !status) {
      return NextResponse.json({ error: 'tenantId and status required' }, { status: 400 })
    }

    const updated = dataStore.updateTenantStatus(tenantId, status, notes, vacatedDate)
    if (!updated) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update tenant status' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newTenant = {
      id: dataStore.tenants.length + 1,
      propertyId: body.propertyId || 1,
      name: body.name || 'New Tenant',
      phone: body.phone,
      email: body.email,
      rentAmount: body.rentAmount || 1500000,
      lastPaymentDate: body.lastPaymentDate || new Date().toISOString().split('T')[0],
      nextDueDate: body.nextDueDate || '2027-01-01',
      status: body.status || 'Current',
      notes: body.notes,
    }
    dataStore.tenants.push(newTenant)
    return NextResponse.json(newTenant, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 400 })
  }
}
