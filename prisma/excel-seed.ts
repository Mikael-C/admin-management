/**
 * Excel Data Seed Script
 * Run: npx ts-node --esm prisma/seed.ts
 * OR:  npx tsx prisma/seed.ts
 *
 * This script reads the real estate Excel file and imports all data into the database.
 * Make sure DATABASE_URL is set in .env before running.
 */

import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// ---- CHANGE THIS PATH to the location of your Excel file ----
const EXCEL_PATH = 'C:/Users/HP/.gemini/antigravity/brain/d6fadfa0-be6f-41dc-bf55-32427ad7a386/.user_uploaded/media_1790452633587.xlsx'

function cleanFloat(val: unknown): number | null {
  if (val === null || val === undefined || val === '' || val === '-') return null
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

function cleanString(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' || s === '-' || s === 'None' ? null : s
}

async function main() {
  console.log('🌱 Starting seed...')

  // Load workbook
  const wb = XLSX.readFile(EXCEL_PATH)

  // ---- 1. Create admin user ----
  console.log('👤 Creating admin user...')
  const hashedPassword = await hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@realestate.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@realestate.com',
      password: hashedPassword,
      role: 'admin',
    },
  })
  console.log('   ✓ Admin user created (email: admin@realestate.com, password: admin123)')

  // ---- 2. Landlords ----
  console.log('📋 Importing Landlords...')
  const landlordSheet = wb.Sheets['Landlords']
  const landlordRows = XLSX.utils.sheet_to_json(landlordSheet, { defval: null }) as Record<string, unknown>[]

  let landlordCount = 0
  for (const row of landlordRows) {
    const id = cleanFloat(row['Landlord ID'])
    const name = cleanString(row['Landlord Name'])
    if (!id || !name) continue

    await prisma.landlord.upsert({
      where: { id: Math.round(id) },
      update: {},
      create: {
        id: Math.round(id),
        name,
        phone: cleanString(row['Phone']),
        email: cleanString(row['Email']),
        address: cleanString(row['Address']),
      },
    })
    landlordCount++
  }
  console.log(`   ✓ ${landlordCount} landlords imported`)

  // ---- 3. Properties ----
  console.log('🏢 Importing Properties...')
  const propSheet = wb.Sheets['Properties']
  const propRows = XLSX.utils.sheet_to_json(propSheet, { defval: null }) as Record<string, unknown>[]

  let propCount = 0
  for (const row of propRows) {
    const id = cleanFloat(row['Property ID'])
    const landlordId = cleanFloat(row['Landlord ID'])
    if (!id || !landlordId) continue

    // Check landlord exists
    const landlordExists = await prisma.landlord.findUnique({ where: { id: Math.round(landlordId) } })
    if (!landlordExists) continue

    await prisma.property.upsert({
      where: { id: Math.round(id) },
      update: {},
      create: {
        id: Math.round(id),
        landlordId: Math.round(landlordId),
        name: cleanString(row['Property Name']),
        address: cleanString(row['Address']),
        city: cleanString(row['City']),
        state: cleanString(row['State']),
        type: cleanString(row['Type']),
        status: cleanString(row['Status']) ?? 'Active',
        managementFee: cleanFloat(row['Management Fee']),
      },
    })
    propCount++
  }
  console.log(`   ✓ ${propCount} properties imported`)

  // ---- 4. Tenants ----
  console.log('👥 Importing Tenants...')
  const tenantSheet = wb.Sheets['Tenants']
  const tenantRows = XLSX.utils.sheet_to_json(tenantSheet, { defval: null }) as Record<string, unknown>[]

  let tenantCount = 0
  for (const row of tenantRows) {
    const id = cleanFloat(row['Tenant ID'])
    const name = cleanString(row['Tenant Name'])
    const propertyId = cleanFloat(row['Property ID'])
    if (!id || !name || !propertyId) continue

    const propExists = await prisma.property.findUnique({ where: { id: Math.round(propertyId) } })
    if (!propExists) continue

    await prisma.tenant.upsert({
      where: { id: Math.round(id) },
      update: {},
      create: {
        id: Math.round(id),
        name,
        propertyId: Math.round(propertyId),
        rentAmount: cleanFloat(row['Rent Amount']),
        lastPaymentDate: cleanString(row['Last Payment Date']),
        nextDueDate: cleanString(row['Next Due Date']),
        status: cleanString(row['Status']) ?? 'Current',
      },
    })
    tenantCount++
  }
  console.log(`   ✓ ${tenantCount} tenants imported`)

  // ---- 5. Rents ----
  console.log('💰 Importing Rents (may take a while — 39,000 rows)...')
  const rentSheet = wb.Sheets['Rents']
  const rentRows = XLSX.utils.sheet_to_json(rentSheet, { defval: null }) as Record<string, unknown>[]

  let rentCount = 0
  const rentBatch: any[] = []

  for (const row of rentRows) {
    const tenantId = cleanFloat(row['Tenant ID'])
    const propertyId = cleanFloat(row['Property ID'] ?? row[Object.keys(row)[1]])
    const amountPaid = cleanFloat(row['Amount Paid'])

    if (propertyId === null && tenantId === null && amountPaid === null && !row['Payment Date'] && !row['Payment Method']) {
      continue
    }

    rentBatch.push({
      propertyId: propertyId ? Math.round(propertyId) : null,
      tenantId: tenantId ? Math.round(tenantId) : null,
      amountPaid,
      paymentDate: cleanString(row['Payment Date']),
      paymentMethod: cleanString(row['Payment Method']),
      debit: cleanFloat(row['Debit']),
      credit: cleanFloat(row['Credit']),
      balance: cleanFloat(row['Balance']),
    })

    if (rentBatch.length >= 500) {
      await prisma.rent.createMany({ data: rentBatch })
      rentCount += rentBatch.length
      rentBatch.length = 0
      process.stdout.write(`\r   ✓ ${rentCount} rents imported...`)
    }
  }
  if (rentBatch.length > 0) {
    await prisma.rent.createMany({ data: rentBatch })
    rentCount += rentBatch.length
  }
  console.log(`\n   ✓ ${rentCount} rents imported`)

  // ---- 6. Expenses ----
  console.log('🧾 Importing Expenses...')
  const expSheet = wb.Sheets['Expenses']
  const expRows = XLSX.utils.sheet_to_json(expSheet, { defval: null }) as Record<string, unknown>[]

  let expCount = 0
  for (const row of expRows) {
    const propertyId = cleanFloat(row['Property ID'])
    const description = cleanString(row['Description'])
    if (!description) continue

    await prisma.expense.create({
      data: {
        propertyId: propertyId ? Math.round(propertyId) : null,
        description,
        debit: cleanFloat(row['Debit']),
        period: cleanString(row['Period']),
        credit: cleanFloat(row['Credit']),
        debitBalance: cleanFloat(row['Debit Balance']),
        creditBalance: cleanFloat(row['Credit Balanace ']),
        balance: cleanFloat(row['Balance ']),
      },
    })
    expCount++
  }
  console.log(`   ✓ ${expCount} expenses imported`)

  // ---- 7. Ledger Entries ----
  console.log('📒 Importing Ledger entries...')
  for (const sheetName of ['Ledger', 'Complete Ledger']) {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) continue
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[]

    const batch: any[] = []
    for (const row of rows) {
      const particulars = cleanString(row['Particulars'])
      if (!particulars) continue
      batch.push({
        date: cleanString(row['Date']),
        receiptNo: cleanString(row['Receipt No']),
        particulars,
        period: cleanString(row['Period']),
        debit: cleanFloat(row['Debit']),
        credit: cleanFloat(row['Credit']),
        balance: cleanFloat(row['Balance']),
        ledgerType: sheetName === 'Complete Ledger' ? 'CompleteLedger' : 'Ledger',
      })
    }
    await prisma.ledgerEntry.createMany({ data: batch })
    console.log(`   ✓ ${batch.length} ${sheetName} entries imported`)
  }

  console.log('\n✅ Seed complete!')
  console.log('\n🔐 Login credentials:')
  console.log('   Email:    admin@realestate.com')
  console.log('   Password: admin123')
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
