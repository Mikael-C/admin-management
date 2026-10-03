import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting dummy seed for Vercel deployment...')

  // 1. Create Admin User
  console.log('👤 Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@realestate.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@realestate.com',
      password: hashedPassword,
      role: 'admin',
    },
  })

  // 2. Create Dummy Landlords
  console.log('📋 Creating dummy landlords...')
  const landlords = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.landlord.create({
        data: {
          name: `Client Landlord ${i + 1}`,
          phone: `0801234567${i}`,
          email: `landlord${i + 1}@example.com`,
          address: `${i + 10} Real Estate Avenue, Lagos`,
        },
      })
    )
  )

  // 3. Create Dummy Properties
  console.log('🏢 Creating dummy properties...')
  const properties = []
  for (const landlord of landlords) {
    for (let i = 0; i < 3; i++) {
      const prop = await prisma.property.create({
        data: {
          landlordId: landlord.id,
          name: `Luxury Apartment ${landlord.id}-${i + 1}`,
          address: `Plot ${i + 1} Block ${landlord.id}, Victoria Island`,
          city: 'Lagos',
          state: 'Lagos',
          type: i % 2 === 0 ? 'Residential' : 'Commercial',
          status: 'Active',
          managementFee: 50000,
        },
      })
      properties.push(prop)
    }
  }

  // 4. Create Dummy Tenants
  console.log('👥 Creating dummy tenants...')
  const tenants = []
  for (const prop of properties) {
    const tenant = await prisma.tenant.create({
      data: {
        propertyId: prop.id,
        name: `Test Tenant for ${prop.name}`,
        rentAmount: 1500000,
        lastPaymentDate: '2026-09-01',
        nextDueDate: '2027-09-01',
        status: 'Current',
      },
    })
    tenants.push(tenant)
  }

  // 5. Create Dummy Rents (last 6 months to populate the chart)
  console.log('💰 Creating dummy rents...')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  
  for (const tenant of tenants) {
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15)
      await prisma.rent.create({
        data: {
          propertyId: tenant.propertyId,
          tenantId: tenant.id,
          amountPaid: 250000,
          paymentDate: d.toISOString(),
          paymentMethod: 'Bank Transfer',
          debit: 0,
          credit: 250000,
          balance: 0,
          receiptNo: `REC-${tenant.id}-${i}-${Math.floor(Math.random() * 1000)}`,
          createdAt: d,
        },
      })
    }
  }

  // 6. Create Dummy Expenses
  console.log('🧾 Creating dummy expenses...')
  for (const prop of properties) {
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 6), 5)
      await prisma.expense.create({
        data: {
          propertyId: prop.id,
          description: `Plumbing and Maintenance ${i + 1}`,
          debit: 50000,
          credit: 0,
          period: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
          receiptNo: `EXP-${prop.id}-${i}`,
          createdAt: d,
        },
      })
    }
  }

  console.log('✅ Dummy seed complete! Ready for Vercel testing.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
