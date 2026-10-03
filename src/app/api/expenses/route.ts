import { NextResponse } from 'next/server'

const descriptions = ['Plumbing and Maintenance', 'Electrical Repairs', 'Painting & Renovation', 'Security Installation', 'Generator Servicing', 'Roof Repairs', 'Landscaping', 'Water Supply Maintenance']
const EXPENSES = Array.from({ length: 45 }, (_, i) => {
  const d = new Date(2026, 9 - Math.floor(i / 8), 10 - (i % 8))
  return {
    id: i + 1,
    receiptNo: `EXP-${2000 + i}`,
    property: { address: `Plot ${(i % 3) + 1} Block ${Math.floor(i / 3) % 5 + 1}, Victoria Island` },
    description: descriptions[i % descriptions.length],
    period: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'][d.getMonth()]} ${d.getFullYear()}`,
    debit: [50000, 75000, 120000, 85000, 60000][i % 5],
    credit: 0,
    balance: 0,
    createdAt: d.toISOString(),
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').toLowerCase()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  let filtered = EXPENSES
  if (search) {
    filtered = filtered.filter(e =>
      e.receiptNo.toLowerCase().includes(search) ||
      e.description.toLowerCase().includes(search) ||
      e.period.toLowerCase().includes(search)
    )
  }

  const start = (page - 1) * limit
  const expenses = filtered.slice(start, start + limit)
  const totalDebit = filtered.reduce((s, e) => s + (e.debit || 0), 0)
  const totalCredit = filtered.reduce((s, e) => s + (e.credit || 0), 0)

  return NextResponse.json({
    expenses,
    total: filtered.length,
    pages: Math.ceil(filtered.length / limit),
    totalDebit,
    totalCredit,
  })
}

export async function POST() {
  return NextResponse.json({ message: 'Demo mode — data is not persisted.' })
}
