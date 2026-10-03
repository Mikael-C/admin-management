import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')?.trim()

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Please provide at least 2 characters to search.' },
        { status: 400 },
      )
    }

    // Find landlord by name (case-insensitive partial match via Prisma)
    const landlord = await prisma.landlord.findFirst({
      where: {
        name: { contains: name },
      },
      include: {
        properties: {
          include: {
            tenants: { select: { id: true, name: true, status: true, rentAmount: true } },
            rents: { select: { credit: true, amountPaid: true } },
            expenses: { select: { debit: true } },
          },
        },
      },
    })

    if (!landlord) {
      return NextResponse.json({ landlord: null })
    }

    // Aggregate rent and expenses across all properties
    let totalRentCollected = 0
    let totalExpenses = 0

    // landlord.properties is typed via the include above
    const props = landlord.properties as Array<{
      id: number
      name: string | null
      address: string | null
      city: string | null
      state: string | null
      type: string | null
      status: string | null
      tenants: Array<{ id: number; name: string; status: string | null; rentAmount: number | null }>
      rents: Array<{ credit: number | null; amountPaid: number | null }>
      expenses: Array<{ debit: number | null }>
    }>

    for (const property of props) {
      for (const rent of property.rents) {
        totalRentCollected += rent.credit ?? 0
      }
      for (const expense of property.expenses) {
        totalExpenses += expense.debit ?? 0
      }
    }

    const netBalance = totalRentCollected - totalExpenses

    return NextResponse.json({
      landlord: {
        id: landlord.id,
        name: landlord.name,
        phone: landlord.phone,
        email: landlord.email,
        address: landlord.address,
        createdAt: landlord.createdAt,
        properties: props.map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          city: p.city,
          state: p.state,
          type: p.type,
          status: p.status,
          tenantCount: p.tenants.length,
          activeTenants: p.tenants.filter((t) => t.status === 'Current').length,
          tenants: p.tenants,
        })),
        totalRentCollected,
        totalExpenses,
        netBalance,
      },
    })
  } catch (error) {
    console.error('[LANDLORDS_SEARCH_GET]', error)
    return NextResponse.json(
      { error: 'Failed to search landlord' },
      { status: 500 },
    )
  }
}
