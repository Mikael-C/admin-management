import { NextResponse } from 'next/server'

const LANDLORDS = [
  {
    id: 1, name: 'Client Landlord 1', phone: '08012345670', email: 'landlord1@example.com',
    address: '10 Real Estate Avenue, Lagos',
    totalRentCollected: 4500000, totalExpenses: 900000,
    properties: [
      { id: 1, name: 'Luxury Apartment 1-1', address: 'Plot 1 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenants: [{ id: 1, name: 'Test Tenant 1', rentAmount: 1500000, status: 'Current' }] },
      { id: 2, name: 'Luxury Apartment 1-2', address: 'Plot 2 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', tenants: [{ id: 2, name: 'Test Tenant 2', rentAmount: 1500000, status: 'Current' }] },
      { id: 3, name: 'Luxury Apartment 1-3', address: 'Plot 3 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Vacant', tenants: [] },
    ],
  },
  {
    id: 2, name: 'Client Landlord 2', phone: '08012345671', email: 'landlord2@example.com',
    address: '11 Real Estate Avenue, Lagos',
    totalRentCollected: 3750000, totalExpenses: 750000,
    properties: [
      { id: 4, name: 'Luxury Apartment 2-1', address: 'Plot 1 Block 2, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenants: [{ id: 3, name: 'Test Tenant 3', rentAmount: 1500000, status: 'Current' }] },
      { id: 5, name: 'Luxury Apartment 2-2', address: 'Plot 2 Block 2, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', tenants: [{ id: 4, name: 'Test Tenant 4', rentAmount: 1500000, status: 'Overdue' }] },
      { id: 6, name: 'Luxury Apartment 2-3', address: 'Plot 3 Block 2, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenants: [{ id: 5, name: 'Test Tenant 5', rentAmount: 1500000, status: 'Current' }] },
    ],
  },
  {
    id: 3, name: 'Client Landlord 3', phone: '08012345672', email: 'landlord3@example.com',
    address: '12 Real Estate Avenue, Lagos',
    totalRentCollected: 4250000, totalExpenses: 850000,
    properties: [
      { id: 7, name: 'Luxury Apartment 3-1', address: 'Plot 1 Block 3, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenants: [{ id: 6, name: 'Test Tenant 6', rentAmount: 1500000, status: 'Current' }] },
      { id: 8, name: 'Luxury Apartment 3-2', address: 'Plot 2 Block 3, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Vacant', tenants: [] },
      { id: 9, name: 'Luxury Apartment 3-3', address: 'Plot 3 Block 3, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenants: [{ id: 7, name: 'Test Tenant 7', rentAmount: 1500000, status: 'Current' }] },
    ],
  },
  {
    id: 4, name: 'Client Landlord 4', phone: '08012345673', email: 'landlord4@example.com',
    address: '13 Real Estate Avenue, Lagos',
    totalRentCollected: 5000000, totalExpenses: 1000000,
    properties: [
      { id: 10, name: 'Luxury Apartment 4-1', address: 'Plot 1 Block 4, Victoria Island', city: 'Abuja', state: 'FCT', type: 'Commercial', status: 'Active', tenants: [{ id: 8, name: 'Test Tenant 8', rentAmount: 1500000, status: 'Current' }] },
      { id: 11, name: 'Luxury Apartment 4-2', address: 'Plot 2 Block 4, Victoria Island', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Active', tenants: [{ id: 9, name: 'Test Tenant 9', rentAmount: 1500000, status: 'Current' }] },
      { id: 12, name: 'Luxury Apartment 4-3', address: 'Plot 3 Block 4, Victoria Island', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Active', tenants: [{ id: 10, name: 'Test Tenant 10', rentAmount: 1500000, status: 'Current' }] },
    ],
  },
  {
    id: 5, name: 'Client Landlord 5', phone: '08012345674', email: 'landlord5@example.com',
    address: '14 Real Estate Avenue, Lagos',
    totalRentCollected: 5000000, totalExpenses: 1000000,
    properties: [
      { id: 13, name: 'Luxury Apartment 5-1', address: 'Plot 1 Block 5, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', tenants: [{ id: 11, name: 'Test Tenant 11', rentAmount: 1500000, status: 'Current' }] },
      { id: 14, name: 'Luxury Apartment 5-2', address: 'Plot 2 Block 5, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', tenants: [{ id: 12, name: 'Test Tenant 12', rentAmount: 1500000, status: 'Current' }] },
      { id: 15, name: 'Luxury Apartment 5-3', address: 'Plot 3 Block 5, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Vacant', tenants: [] },
    ],
  },
]

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const landlord = LANDLORDS.find(l => l.id === parseInt(id))

  if (!landlord) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(landlord)
}
