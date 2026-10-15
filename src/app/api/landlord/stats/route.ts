import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const landlordId = parseInt(searchParams.get('landlordId') || '1')

  const data = dataStore.getLandlordDashboardData(landlordId)
  if (!data) {
    return NextResponse.json({ error: 'Landlord not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
