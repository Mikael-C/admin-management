import { NextResponse } from 'next/server'
import { dataStore, MaintenanceRequest } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = searchParams.get('status') || undefined
  const landlordId = searchParams.get('landlordId') ? parseInt(searchParams.get('landlordId')!) : undefined
  const agentId = searchParams.get('agentId') ? parseInt(searchParams.get('agentId')!) : undefined
  const propertyId = searchParams.get('propertyId') ? parseInt(searchParams.get('propertyId')!) : undefined

  const items = dataStore.getMaintenance({
    search,
    status,
    landlordId,
    agentId,
    propertyId,
  })

  return NextResponse.json({
    maintenance: items,
    total: items.length,
    pendingCount: items.filter(i => i.status === 'Needs Repair').length,
    inProgressCount: items.filter(i => i.status === 'In Progress').length,
    repairedCount: items.filter(i => i.status === 'Repaired').length,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { propertyId, agentId, requestedByName, title, description, category, priority, estimatedCost } = body

    if (!propertyId || !title || !description) {
      return NextResponse.json({ error: 'propertyId, title, and description are required' }, { status: 400 })
    }

    const created = dataStore.addMaintenanceRequest({
      propertyId: parseInt(propertyId),
      agentId: agentId ? parseInt(agentId) : 1,
      requestedByName: requestedByName || 'Agent',
      title,
      description,
      category: category || 'General',
      priority: priority || 'Medium',
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 50000,
    })

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, actualCost, notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const updated = dataStore.updateMaintenanceStatus(
      parseInt(id),
      status as MaintenanceRequest['status'],
      actualCost !== undefined ? parseFloat(actualCost) : undefined,
      notes
    )

    if (!updated) {
      return NextResponse.json({ error: 'Maintenance ticket not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update maintenance request' }, { status: 500 })
  }
}
