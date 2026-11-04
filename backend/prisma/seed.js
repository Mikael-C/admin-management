/**
 * EstatePro Database Seed
 * Reads real data from Housing management system.xlsx
 * Creates landlord login credentials, super admin, and all seed data
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

const prisma = new PrismaClient()

// Try to load xlsx
let XLSX
try {
  XLSX = require('xlsx')
} catch {
  XLSX = require(path.join(__dirname, '..', 'node_modules', 'xlsx'))
}

// ─── Helpers ────────────────────────────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')
}

function generateEmail(name, id) {
  const base = slugify(name) || `landlord${id}`
  return `${base}@estatepro.com`
}

function generatePassword(name, id) {
  // Password: First name + ID + @2024 e.g. "Ngozi1@2024"
  const firstName = name.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '')
  return `${firstName || 'Landlord'}${id}@2024`
}

function parseExcelDate(val) {
  if (!val) return null
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date((val - 25569) * 86400 * 1000)
    return d.toISOString().split('T')[0]
  }
  if (typeof val === 'string') return val.substring(0, 20)
  return null
}

// ─── Main Seed ───────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting EstatePro database seed...\n')

  // Load Excel file
  const excelPath = path.join(__dirname, '..', '..', 'Housing management system.xlsx')
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath)
    process.exit(1)
  }

  const wb = XLSX.readFile(excelPath)

  // Parse sheets
  const landlordRows = XLSX.utils.sheet_to_json(wb.Sheets['Landlords'])
  const propertyRows = XLSX.utils.sheet_to_json(wb.Sheets['Properties'])
  const tenantRows  = XLSX.utils.sheet_to_json(wb.Sheets['Tenants'])
  const rentRows    = XLSX.utils.sheet_to_json(wb.Sheets['Rents'])
  const expenseRows = XLSX.utils.sheet_to_json(wb.Sheets['Expenses'])
  const ledgerRows  = XLSX.utils.sheet_to_json(wb.Sheets['Ledger'])
  const compLedger  = XLSX.utils.sheet_to_json(wb.Sheets['Complete Ledger'])

  // Filter only real rows
  const realLandlords = landlordRows.filter(l => l['Landlord Name'] && l['Landlord Name'].toString().trim() !== '')
  const realProperties = propertyRows.filter(p => p['Landlord ID'] && (p['Address'] || p['Property Name']))
  const realTenants = tenantRows.filter(t => t['Tenant Name'] && t['Tenant Name'].toString().trim() !== '')
  const realRents = rentRows.filter(r => r['Amount Paid'] && parseFloat(r['Amount Paid']) > 0)
  const realExpenses = expenseRows.filter(e => e['Description'] && (e['Debit'] || e['Credit']))
  const realLedger = ledgerRows.filter(l => l['Particulars'] || l['Credit'] || l['Debit'])
  const realCompLedger = compLedger.filter(l => l['Particulars'] || l['Credit'] || l['Debit'])

  console.log(`📊 Excel data loaded:`)
  console.log(`   Landlords: ${realLandlords.length}`)
  console.log(`   Properties: ${realProperties.length}`)
  console.log(`   Tenants: ${realTenants.length}`)
  console.log(`   Rents: ${realRents.length}`)
  console.log(`   Expenses: ${realExpenses.length}`)
  console.log(`   Ledger entries: ${realLedger.length + realCompLedger.length}\n`)

  // ─── 1. Super Admin ─────────────────────────────────
  console.log('👑 Creating Super Admin...')
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@estatepro.com'
  const superAdminPass  = process.env.SUPER_ADMIN_PASSWORD || 'Admin@2024'
  const superAdminName  = process.env.SUPER_ADMIN_NAME || 'Super Administrator'

  let superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } })
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        name: superAdminName,
        email: superAdminEmail,
        password: await bcrypt.hash(superAdminPass, 12),
        role: 'super_admin',
        phone: '08000000001',
        adminProfile: {
          create: {
            department: 'Executive',
            position: 'Super Administrator',
            staffId: 'SA-001',
          }
        }
      }
    })
    console.log(`   ✅ Super Admin created: ${superAdminEmail} / ${superAdminPass}`)
  } else {
    console.log(`   ℹ️  Super Admin already exists: ${superAdminEmail}`)
  }

  // ─── 2. Sample Admin Staff ───────────────────────────
  console.log('👔 Creating Admin Staff...')
  const staffAccounts = [
    { name: 'Admin Staff 1', email: 'admin@estatepro.com', password: 'Staff@2024', dept: 'Operations' },
    { name: 'Admin Staff 2', email: 'admin2@estatepro.com', password: 'Staff2@2024', dept: 'Finance' },
  ]
  for (const s of staffAccounts) {
    const existing = await prisma.user.findUnique({ where: { email: s.email } })
    if (!existing) {
      await prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          password: await bcrypt.hash(s.password, 12),
          role: 'admin',
          adminProfile: { create: { department: s.dept, position: 'Admin Staff' } }
        }
      })
      console.log(`   ✅ ${s.name}: ${s.email} / ${s.password}`)
    }
  }

  // ─── 3. Sample Agents ────────────────────────────────
  console.log('🔧 Creating Agents...')
  const agentData = [
    { name: 'Sarah Jenkins', email: 'agent.sarah@estatepro.com', password: 'Agent@2024', phone: '08098765431', licenseNo: 'AG-001' },
    { name: 'Michael Okon', email: 'agent.michael@estatepro.com', password: 'Agent2@2024', phone: '08098765432', licenseNo: 'AG-002' },
  ]
  const agentIds = []
  for (const a of agentData) {
    let agentUser = await prisma.user.findUnique({ where: { email: a.email } })
    if (!agentUser) {
      const agentProfile = await prisma.agent.create({
        data: { name: a.name, phone: a.phone, email: a.email, licenseNo: a.licenseNo }
      })
      agentUser = await prisma.user.create({
        data: {
          name: a.name,
          email: a.email,
          password: await bcrypt.hash(a.password, 12),
          role: 'agent',
          phone: a.phone,
          agentProfile: { connect: { id: agentProfile.id } }
        }
      })
      await prisma.agent.update({
        where: { id: agentProfile.id },
        data: { userId: agentUser.id }
      })
      agentIds.push(agentProfile.id)
      console.log(`   ✅ ${a.name}: ${a.email} / ${a.password}`)
    } else {
      const ap = await prisma.agent.findUnique({ where: { userId: agentUser.id } })
      if (ap) agentIds.push(ap.id)
    }
  }

  // ─── 4. Landlords + User Accounts ────────────────────
  console.log('\n🏘️  Creating Landlords with login credentials...')
  const credentialsList = []

  for (const row of realLandlords) {
    const id = parseInt(row['Landlord ID'])
    const name = row['Landlord Name'].toString().trim()
    const phone = row['Phone'] && row['Phone'] !== '-' ? row['Phone'].toString() : null
    const excelEmail = row['Email'] && row['Email'] !== '-' ? row['Email'].toString().toLowerCase().trim() : null
    const address = row['Address'] ? row['Address'].toString().trim() : null

    const email = excelEmail || generateEmail(name, id)
    const plainPassword = generatePassword(name, id)

    // Check if landlord already exists
    let landlord = await prisma.landlord.findUnique({ where: { id } }).catch(() => null)

    if (!landlord) {
      try {
        landlord = await prisma.landlord.create({
          data: {
            id,
            name,
            phone,
            email,
            address,
          }
        })
      } catch (e) {
        // If id conflict, upsert
        landlord = await prisma.landlord.upsert({
          where: { id },
          create: { id, name, phone, email, address },
          update: { name, phone, email, address }
        })
      }
    }

    // Create user account for landlord
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(plainPassword, 12),
          role: 'landlord',
          phone,
          landlordProfile: { connect: { id: landlord.id } }
        }
      })
      await prisma.landlord.update({
        where: { id: landlord.id },
        data: { userId: user.id }
      })
    }

    credentialsList.push({ id, name, email, password: plainPassword })
  }

  console.log(`   ✅ Created ${credentialsList.length} landlord accounts\n`)

  // ─── 5. Properties ───────────────────────────────────
  console.log('🏠 Creating Properties...')
  let propCount = 0
  for (const row of realProperties) {
    const propId = parseInt(row['Property ID'])
    const landlordId = parseInt(row['Landlord ID'])
    const name = row['Property Name'] && row['Property Name'] !== '-' ? row['Property Name'].toString().trim() : null
    const address = row['Address'] ? row['Address'].toString().trim() : null
    const city = row['City'] ? row['City'].toString().trim() : null
    const state = row['State'] ? row['State'].toString().trim() : null
    const type = row['Type'] ? row['Type'].toString().trim() : 'Residential'
    const status = row['Status'] ? row['Status'].toString().trim() : 'Active'
    const mgmtFee = row['Management Fee'] ? parseFloat(row['Management Fee']) : null

    // Assign agent round-robin
    const agentId = agentIds.length > 0 ? agentIds[propId % agentIds.length] : null

    // Skip if landlord doesn't exist
    const landlordExists = await prisma.landlord.findUnique({ where: { id: landlordId } })
    if (!landlordExists) continue

    try {
      await prisma.property.upsert({
        where: { id: propId },
        create: {
          id: propId,
          landlordId,
          agentId,
          name,
          address,
          city,
          state,
          type,
          status,
          managementFee: mgmtFee,
        },
        update: {
          name: name || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          type: type || undefined,
          status: status || undefined,
          managementFee: mgmtFee || undefined,
          agentId: agentId || undefined,
        }
      })
      propCount++
    } catch (e) {
      // Skip on error (e.g., missing landlord)
    }
  }
  console.log(`   ✅ ${propCount} properties seeded\n`)

  // ─── 6. Tenants ──────────────────────────────────────
  console.log('👥 Creating Tenants...')
  let tenantCount = 0
  for (const row of realTenants) {
    const tenantId = parseInt(row['Tenant ID'])
    const propertyId = row['Property ID'] ? parseInt(row['Property ID']) : null
    const name = row['Tenant Name'] ? row['Tenant Name'].toString().trim() : null
    const rentAmount = row['Rent Amount'] && row['Rent Amount'] !== '-' ? parseFloat(row['Rent Amount']) : null
    const lastPayment = parseExcelDate(row['Last Payment Date'])
    const nextDue = parseExcelDate(row['Next Due Date'])
    const status = row['Status'] || 'Current'
    const accommodation = row['Accommodation'] ? row['Accommodation'].toString().trim() : null
    const phone = row['Phone'] ? row['Phone'].toString().trim() : null

    if (!name || !propertyId) continue

    // Check property exists
    const propExists = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!propExists) continue

    try {
      await prisma.tenant.upsert({
        where: { id: tenantId },
        create: {
          id: tenantId,
          propertyId,
          name,
          phone,
          rentAmount,
          lastPaymentDate: lastPayment,
          nextDueDate: nextDue,
          status,
          accommodation,
        },
        update: {
          name,
          phone: phone || undefined,
          rentAmount: rentAmount || undefined,
          lastPaymentDate: lastPayment || undefined,
          nextDueDate: nextDue || undefined,
          status,
          accommodation: accommodation || undefined,
        }
      })
      tenantCount++
    } catch (e) {
      // Skip
    }
  }
  console.log(`   ✅ ${tenantCount} tenants seeded\n`)

  // ─── 7. Rents ────────────────────────────────────────
  console.log('💰 Creating Rent Records...')
  let rentCount = 0
  for (const row of realRents) {
    const rentId = parseInt(row['Rent ID'])
    const propertyId = row['Property ID '] ? parseInt(row['Property ID ']) : null
    const tenantId = row['Tenant ID'] ? parseInt(row['Tenant ID']) : null
    const amountPaid = parseFloat(row['Amount Paid']) || 0
    const paymentDate = parseExcelDate(row['Payment Date'])
    const method = row['Payment Method'] ? row['Payment Method'].toString().trim() : 'Bank Transfer'
    const debit = parseFloat(row['Debit']) || 0
    const credit = parseFloat(row['Credit']) || amountPaid
    const balance = parseFloat(row['Balance']) || 0

    if (!propertyId || amountPaid <= 0) continue

    const propExists = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!propExists) continue

    const tenantExists = tenantId ? await prisma.tenant.findUnique({ where: { id: tenantId } }) : null

    try {
      await prisma.rent.upsert({
        where: { id: rentId },
        create: {
          id: rentId,
          propertyId,
          tenantId: tenantExists ? tenantId : null,
          receiptNo: `REC-${String(rentId).padStart(4, '0')}`,
          amountPaid,
          paymentDate: paymentDate || null,
          paymentMethod: method,
          debit,
          credit: credit || amountPaid,
          balance,
        },
        update: {
          amountPaid,
          credit: credit || amountPaid,
          paymentMethod: method,
        }
      })
      rentCount++
    } catch (e) {
      // Skip
    }
  }
  console.log(`   ✅ ${rentCount} rent records seeded\n`)

  // ─── 8. Expenses ─────────────────────────────────────
  console.log('📋 Creating Expense Records...')
  let expCount = 0
  for (let i = 0; i < realExpenses.length; i++) {
    const row = realExpenses[i]
    const propertyId = row['Property ID'] ? parseInt(row['Property ID']) : null
    const description = row['Description'] ? row['Description'].toString().trim() : null
    const debit = parseFloat(row['Debit']) || 0
    const credit = parseFloat(row['Credit']) || 0
    const period = row['Period'] ? row['Period'].toString().trim() : null
    const debitBalance = parseFloat(row['Debit Balance']) || null
    const creditBalance = parseFloat(row['Credit Balanace '] || row['Credit Balance']) || null
    const balance = parseFloat(row['Balance '] || row['Balance']) || null
    const expId = row['Expense ID'] ? parseInt(row['Expense ID']) : null

    if (!description) continue

    const propExists = propertyId ? await prisma.property.findUnique({ where: { id: propertyId } }) : null

    try {
      if (expId) {
        await prisma.expense.upsert({
          where: { id: expId },
          create: {
            id: expId,
            propertyId: propExists ? propertyId : null,
            description,
            debit,
            credit,
            period,
            debitBalance,
            creditBalance,
            balance,
          },
          update: { description, debit, credit }
        })
      } else {
        await prisma.expense.create({
          data: {
            propertyId: propExists ? propertyId : null,
            description,
            debit,
            credit,
            period,
            debitBalance,
            creditBalance,
            balance,
          }
        })
      }
      expCount++
    } catch (e) {
      // Skip
    }
  }
  console.log(`   ✅ ${expCount} expense records seeded\n`)

  // ─── 9. Ledger Entries ───────────────────────────────
  console.log('📒 Creating Ledger Entries...')
  const allLedger = [
    ...realLedger.map(l => ({ ...l, ledgerType: 'Ledger' })),
    ...realCompLedger.map(l => ({ ...l, ledgerType: 'CompleteLedger' })),
  ]

  // Clear and re-create ledger
  await prisma.ledgerEntry.deleteMany()
  let ledgerCount = 0
  for (const row of allLedger) {
    const date = row['Date'] ? row['Date'].toString().trim() : null
    const receiptNo = row['Receipt No'] ? row['Receipt No'].toString().trim() : null
    const particulars = row['Particulars'] ? row['Particulars'].toString().trim() : null
    const period = row['Period'] ? row['Period'].toString().trim() : null
    const debit = parseFloat(row['Debit']) || null
    const credit = parseFloat(row['Credit']) || null
    const balance = parseFloat(row['Balance']) || null
    const ledgerType = row['ledgerType']

    if (!particulars && !credit && !debit) continue

    try {
      await prisma.ledgerEntry.create({
        data: { date, receiptNo, particulars, period, debit, credit, balance, ledgerType }
      })
      ledgerCount++
    } catch (e) {
      // Skip
    }
  }
  console.log(`   ✅ ${ledgerCount} ledger entries seeded\n`)

  // ─── Print Credentials Summary ───────────────────────
  console.log('\n' + '═'.repeat(70))
  console.log('🔐 LOGIN CREDENTIALS SUMMARY')
  console.log('═'.repeat(70))
  console.log(`\n👑 SUPER ADMIN:`)
  console.log(`   Email:    ${superAdminEmail}`)
  console.log(`   Password: ${superAdminPass}`)
  console.log(`\n👔 ADMIN STAFF:`)
  staffAccounts.forEach(s => console.log(`   ${s.name}: ${s.email} / ${s.password}`))
  console.log(`\n🔧 AGENTS:`)
  agentData.forEach(a => console.log(`   ${a.name}: ${a.email} / ${a.password}`))
  console.log(`\n🏘️  LANDLORDS (${credentialsList.length} total):`)
  credentialsList.slice(0, 10).forEach(l => {
    console.log(`   [ID:${l.id}] ${l.name}`)
    console.log(`          Email: ${l.email}`)
    console.log(`          Password: ${l.password}`)
  })
  if (credentialsList.length > 10) {
    console.log(`   ... and ${credentialsList.length - 10} more landlords`)
  }

  // Save credentials to file
  const credPath = path.join(__dirname, 'landlord-credentials.json')
  fs.writeFileSync(credPath, JSON.stringify({
    superAdmin: { email: superAdminEmail, password: superAdminPass },
    adminStaff: staffAccounts.map(s => ({ name: s.name, email: s.email, password: s.password })),
    agents: agentData.map(a => ({ name: a.name, email: a.email, password: a.password })),
    landlords: credentialsList,
  }, null, 2))
  console.log(`\n📄 All credentials saved to: ${credPath}`)
  console.log('\n✅ Seed completed successfully!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
