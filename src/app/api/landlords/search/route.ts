import { NextResponse } from 'next/server'

const LANDLORDS: Record<string, any> = {
  '1': { id: 1, name: 'Client Landlord 1', phone: '08012345670', email: 'landlord1@example.com', totalRentCollected: 4500000, totalExpenses: 900000, netBalance: 3600000, properties: [{ id: 1, name: 'Luxury Apartment 1-1', address: 'Plot 1 Block 1', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenantCount: 1, activeTenants: 1, tenants: [{ id: 1, name: 'Test Tenant 1', status: 'Current', rentAmount: 1500000 }] }] },
  '2': { id: 2, name: 'Client Landlord 2', phone: '08012345671', email: 'landlord2@example.com', totalRentCollected: 3750000, totalExpenses: 750000, netBalance: 3000000, properties: [{ id: 4, name: 'Luxury Apartment 2-1', address: 'Plot 1 Block 2', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenantCount: 1, activeTenants: 1, tenants: [{ id: 3, name: 'Test Tenant 3', status: 'Current', rentAmount: 1500000 }] }] },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim().toLowerCase()

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please provide at least 2 characters to search.' }, { status: 400 })
  }

  const found = Object.values(LANDLORDS).find(l => l.name.toLowerCase().includes(name))
  return NextResponse.json({ landlord: found || null })
}
