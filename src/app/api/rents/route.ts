import { NextResponse } from 'next/server'

const methods = ['Bank Transfer', 'Cash', 'Cheque', 'Bank Transfer', 'Cash']
const RENTS = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2026, 9 - Math.floor(i / 15), 15 - (i % 15))
  return {
    id: i + 1,
    receiptNo: `REC-${1000 + i}`,
    tenant: { name: `Test Tenant ${(i % 15) + 1}` },
    property: { address: `Plot ${(i % 3) + 1} Block ${Math.floor(i / 3) % 5 + 1}, Victoria Island` },
    paymentDate: d.toISOString(),
    paymentMethod: methods[i % methods.length],
    debit: 0,
    credit: 250000,
    balance: 0,
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').toLowerCase()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  let filtered = RENTS
  if (search) {
    filtered = filtered.filter(r =>
      r.receiptNo.toLowerCase().includes(search) ||
      r.tenant.name.toLowerCase().includes(search) ||
      r.property.address.toLowerCase().includes(search)
    )
  }

  const start = (page - 1) * limit
  const rents = filtered.slice(start, start + limit)
  const totalCredit = filtered.reduce((s, r) => s + (r.credit || 0), 0)
  const totalDebit = filtered.reduce((s, r) => s + (r.debit || 0), 0)

  return NextResponse.json({
    rents,
    total: filtered.length,
    pages: Math.ceil(filtered.length / limit),
    totalCredit,
    totalDebit,
  })
}

export async function POST() {
  return NextResponse.json({ message: 'Demo mode — data is not persisted.' })
}
