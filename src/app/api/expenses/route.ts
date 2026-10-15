import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const landlordId = searchParams.get('landlordId') ? parseInt(searchParams.get('landlordId')!) : undefined
  const propertyId = searchParams.get('propertyId') ? parseInt(searchParams.get('propertyId')!) : undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const filtered = dataStore.getExpenses({
    search,
    landlordId,
    propertyId,
  })

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newExpense = {
      id: dataStore.expenses.length + 1,
      receiptNo: `EXP-${2000 + dataStore.expenses.length + 1}`,
      propertyId: body.propertyId || 1,
      description: body.description || 'General Expense',
      period: body.period || 'Oct 2026',
      debit: body.debit || body.amount || 0,
      credit: 0,
      balance: 0,
      createdAt: new Date().toISOString(),
      category: body.category || 'Maintenance',
    }
    dataStore.expenses.unshift(newExpense)
    return NextResponse.json(newExpense, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 400 })
  }
}
