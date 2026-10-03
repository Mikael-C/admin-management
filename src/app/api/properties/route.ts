import { NextResponse } from 'next/server'

const PROPERTIES = [
  { id: 1, name: 'Luxury Apartment 1-1', landlord: { name: 'Client Landlord 1' }, address: 'Plot 1 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 2, name: 'Luxury Apartment 1-2', landlord: { name: 'Client Landlord 1' }, address: 'Plot 2 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 3, name: 'Luxury Apartment 1-3', landlord: { name: 'Client Landlord 1' }, address: 'Plot 3 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Vacant', managementFee: 50000, _count: { tenants: 0 } },
  { id: 4, name: 'Luxury Apartment 2-1', landlord: { name: 'Client Landlord 2' }, address: 'Plot 1 Block 2, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 5, name: 'Luxury Apartment 2-2', landlord: { name: 'Client Landlord 2' }, address: 'Plot 2 Block 2, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 6, name: 'Luxury Apartment 2-3', landlord: { name: 'Client Landlord 2' }, address: 'Plot 3 Block 2, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 7, name: 'Luxury Apartment 3-1', landlord: { name: 'Client Landlord 3' }, address: 'Plot 1 Block 3, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 8, name: 'Luxury Apartment 3-2', landlord: { name: 'Client Landlord 3' }, address: 'Plot 2 Block 3, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Vacant', managementFee: 50000, _count: { tenants: 0 } },
  { id: 9, name: 'Luxury Apartment 3-3', landlord: { name: 'Client Landlord 3' }, address: 'Plot 3 Block 3, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 10, name: 'Luxury Apartment 4-1', landlord: { name: 'Client Landlord 4' }, address: 'Plot 1 Block 4, Victoria Island', city: 'Abuja', state: 'FCT', type: 'Commercial', status: 'Active', managementFee: 75000, _count: { tenants: 1 } },
  { id: 11, name: 'Luxury Apartment 4-2', landlord: { name: 'Client Landlord 4' }, address: 'Plot 2 Block 4, Victoria Island', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Active', managementFee: 75000, _count: { tenants: 1 } },
  { id: 12, name: 'Luxury Apartment 4-3', landlord: { name: 'Client Landlord 4' }, address: 'Plot 3 Block 4, Victoria Island', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Active', managementFee: 75000, _count: { tenants: 1 } },
  { id: 13, name: 'Luxury Apartment 5-1', landlord: { name: 'Client Landlord 5' }, address: 'Plot 1 Block 5, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 14, name: 'Luxury Apartment 5-2', landlord: { name: 'Client Landlord 5' }, address: 'Plot 2 Block 5, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', managementFee: 50000, _count: { tenants: 1 } },
  { id: 15, name: 'Luxury Apartment 5-3', landlord: { name: 'Client Landlord 5' }, address: 'Plot 3 Block 5, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Vacant', managementFee: 50000, _count: { tenants: 0 } },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').toLowerCase()
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  let filtered = PROPERTIES
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.address.toLowerCase().includes(search))
  if (status) filtered = filtered.filter(p => p.status === status)

  const start = (page - 1) * limit
  const properties = filtered.slice(start, start + limit)

  return NextResponse.json({ properties, total: filtered.length, pages: Math.ceil(filtered.length / limit) })
}

export async function POST() {
  return NextResponse.json({ message: 'Demo mode — data is not persisted.' })
}
