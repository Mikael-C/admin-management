import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const landlordId = parseInt(id)
  if (isNaN(landlordId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const landlord = await prisma.landlord.findUnique({
    where: { id: landlordId },
    include: {
      properties: {
        include: {
          tenants: true,
          rents: { select: { credit: true } },
          expenses: { select: { debit: true } },
        },
      },
    },
  })

  if (!landlord) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let totalRentCollected = 0
  let totalExpenses = 0
  for (const p of landlord.properties) {
    for (const r of p.rents) totalRentCollected += r.credit ?? 0
    for (const e of p.expenses) totalExpenses += e.debit ?? 0
  }

  return NextResponse.json({
    ...landlord,
    totalRentCollected,
    totalExpenses,
  })
}
