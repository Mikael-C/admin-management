import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const landlordId = searchParams.get('landlordId') ? parseInt(searchParams.get('landlordId')!) : undefined
  const propertyId = searchParams.get('propertyId') ? parseInt(searchParams.get('propertyId')!) : undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const filtered = dataStore.getRents({
    search,
    landlordId,
    propertyId,
  })

  const start = (page - 1) * limit
  const rents = filtered.slice(start, start + limit)
  const totalCredit = filtered.reduce((s, r) => s + (r.credit || r.amountPaid || 0), 0)
  const totalDebit = filtered.reduce((s, r) => s + (r.debit || 0), 0)

  return NextResponse.json({
    rents,
    total: filtered.length,
    pages: Math.ceil(filtered.length / limit),
    totalCredit,
    totalDebit,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newRent = {
      id: dataStore.rents.length + 1,
      receiptNo: `REC-${1000 + dataStore.rents.length + 1}`,
      propertyId: body.propertyId || 1,
      tenantId: body.tenantId || 1,
      amountPaid: body.amountPaid || 0,
      debit: 0,
      credit: body.amountPaid || 0,
      balance: 0,
      paymentDate: new Date().toISOString(),
      paymentMethod: body.paymentMethod || 'Bank Transfer',
    }
    dataStore.rents.unshift(newRent)
    return NextResponse.json(newRent, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to record rent payment' }, { status: 400 })
  }
}
