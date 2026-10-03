import { NextResponse } from 'next/server'

const DEMO_DATA = {
  totalLandlords: 5,
  totalProperties: 15,
  totalTenants: 15,
  activeTenants: 12,
  totalRentCollected: 22500000,
  totalExpenses: 4500000,
  netBalance: 18000000,
  occupancyRate: 80,
  monthlyRentData: [
    { month: 'May 2026', amount: 3200000 },
    { month: 'Jun 2026', amount: 3750000 },
    { month: 'Jul 2026', amount: 3100000 },
    { month: 'Aug 2026', amount: 4200000 },
    { month: 'Sep 2026', amount: 3900000 },
    { month: 'Oct 2026', amount: 4350000 },
  ],
  recentRents: [
    { id: 1, tenant: { name: 'Test Tenant for Luxury Apartment 1-1' }, property: { address: 'Plot 1 Block 1, Victoria Island' }, paymentDate: '2026-10-01T00:00:00.000Z', amountPaid: 250000, credit: 250000 },
    { id: 2, tenant: { name: 'Test Tenant for Luxury Apartment 1-2' }, property: { address: 'Plot 2 Block 1, Victoria Island' }, paymentDate: '2026-09-28T00:00:00.000Z', amountPaid: 250000, credit: 250000 },
    { id: 3, tenant: { name: 'Test Tenant for Luxury Apartment 2-1' }, property: { address: 'Plot 1 Block 2, Victoria Island' }, paymentDate: '2026-09-25T00:00:00.000Z', amountPaid: 250000, credit: 250000 },
    { id: 4, tenant: { name: 'Test Tenant for Luxury Apartment 3-1' }, property: { address: 'Plot 1 Block 3, Victoria Island' }, paymentDate: '2026-09-20T00:00:00.000Z', amountPaid: 250000, credit: 250000 },
    { id: 5, tenant: { name: 'Test Tenant for Luxury Apartment 4-2' }, property: { address: 'Plot 2 Block 4, Victoria Island' }, paymentDate: '2026-09-15T00:00:00.000Z', amountPaid: 250000, credit: 250000 },
  ],
  recentExpenses: [
    { id: 1, description: 'Plumbing and Maintenance 1', property: { address: 'Plot 1 Block 1, Victoria Island' }, debit: 50000, createdAt: '2026-09-30T00:00:00.000Z' },
    { id: 2, description: 'Electrical Repairs', property: { address: 'Plot 2 Block 2, Victoria Island' }, debit: 75000, createdAt: '2026-09-22T00:00:00.000Z' },
    { id: 3, description: 'Painting & Renovation', property: { address: 'Plot 1 Block 3, Victoria Island' }, debit: 120000, createdAt: '2026-09-10T00:00:00.000Z' },
    { id: 4, description: 'Security Installation', property: { address: 'Plot 2 Block 4, Victoria Island' }, debit: 85000, createdAt: '2026-08-28T00:00:00.000Z' },
    { id: 5, description: 'Plumbing and Maintenance 3', property: { address: 'Plot 3 Block 5, Victoria Island' }, debit: 60000, createdAt: '2026-08-15T00:00:00.000Z' },
  ],
}

export async function GET() {
  return NextResponse.json(DEMO_DATA)
}
