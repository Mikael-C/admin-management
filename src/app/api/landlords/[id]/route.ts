import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const landlord = dataStore.getLandlordById(parseInt(id))

  if (!landlord) {
    return NextResponse.json({ error: 'Landlord not found' }, { status: 404 })
  }

  return NextResponse.json(landlord)
}
