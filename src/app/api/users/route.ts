import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET() {
  const users = dataStore.getUsers()
  return NextResponse.json({ users, total: users.length })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, role, phone, landlordId, agentId } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const newUser = dataStore.addUser({
      name,
      email,
      role,
      phone,
      landlordId: landlordId ? parseInt(landlordId) : undefined,
      agentId: agentId ? parseInt(agentId) : undefined,
    })

    // If role is landlord and not mapped, create corresponding Landlord record if needed
    if (role === 'landlord' && !landlordId) {
      const newLandlord = {
        id: dataStore.landlords.length + 1,
        name,
        email,
        phone: phone || '08000000000',
        address: 'Nigeria',
      }
      dataStore.landlords.push(newLandlord)
      newUser.landlordId = newLandlord.id
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
