/**
 * EstatePro - Landlord Receipt Image Importer
 * ============================================
 * Analyzes JPEG receipt images from "Landlord invoices" folder using Gemini Vision,
 * extracts amount/date/description, then creates Invoice (Receipt) records in the DB.
 *
 * Prerequisites:
 *  - Set DATABASE_URL in backend/.env to your Render external database URL
 *  - Set GEMINI_API_KEY in backend/.env (or pass as env var)
 *  - Run: node scripts/import-landlord-receipts.js
 *
 * Run from: backend/ directory
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED=0; node scripts/import-landlord-receipts.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { GoogleGenAI }  = require('@google/genai')
const fs               = require('fs')
const path             = require('path')

const prisma = new PrismaClient()

// ─── Config ─────────────────────────────────────────────────────────────────
const RECEIPTS_FOLDER = path.join(__dirname, '..', '..', 'Landlord invoices')
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

// Hard-coded mapping: folder name → { landlordId, landlordName, propertyFolderName, propertyId, propertyAddress }
// Based on research of Excel data vs folder names.
// landlordId=null means we need to CREATE the landlord in DB first.
const LANDLORD_MAP = {
  'Agu Emmanuel': {
    landlordId:      null,       // Not in DB — will be created
    landlordName:    'Agu Emmanuel',
    landlordEmail:   'agu.emmanuel@estatepro.com',
    propertyFolder:  '5 Umuobido street',
    propertyId:      null,       // Not in DB — will be created
    propertyAddress: '5 Umuobido Street',
  },
  'Chukwu Joy': {
    landlordId:      21,         // Joy Chukwu in DB
    landlordName:    'Joy Chukwu',
    landlordEmail:   null,       // will fetch from DB
    propertyFolder:  '67 Kenyatta street',
    propertyId:      21,         // Property 21: 68 Kenyetta street (closest match)
    propertyAddress: '68 Kenyetta street',
  },
  'Mr Kennedy Ezechukwu': {
    landlordId:      24,         // Mr K Ezechukwu in DB
    landlordName:    'Mr K Ezechukwu',
    landlordEmail:   null,
    propertyFolder:  '118 Kaduna street',
    propertyId:      null,       // No separate property row — will create
    propertyAddress: '118D Kaduna Street',
  },
  'Pastor Eze': {
    landlordId:      null,       // Not in DB — will be created
    landlordName:    'Pastor Eze',
    landlordEmail:   'pastor.eze@estatepro.com',
    propertyFolder:  'Weaather Head',
    propertyId:      null,       // Not in DB — will be created
    propertyAddress: 'Weather Head Estate',
  },
  'Umeh Isaac Ichie': {
    landlordId:      18,         // Ichie Umeh Isaac in DB
    landlordName:    'Ichie Umeh Isaac',
    landlordEmail:   null,
    propertyFolder:  '2 Ekwulobia Street',
    propertyId:      18,         // Property 18: 20 Edward Nnaji ST
    propertyAddress: '20 Edward Nnaji ST',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
let ai
function getAI() {
  if (!ai) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set. Add it to backend/.env or set as env var.')
    }
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  }
  return ai
}

async function analyzeReceiptImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath)
  const base64Image = imageBuffer.toString('base64')

  const response = await getAI().models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `You are analyzing a Nigerian property management receipt image. 
Extract the following information from this receipt and return a JSON object ONLY (no markdown, no code fences):
{
  "receiptNo": "the receipt number if visible (e.g. 0878, 4911)",
  "amount": 123456.00,
  "amountText": "written amount in words if visible",
  "date": "YYYY-MM-DD",
  "period": "rental period if shown (e.g. Jan-June 2019)",
  "description": "brief description of what this payment is for",
  "paymentMethod": "Cash or Transfer if visible"
}

Rules:
- For "amount": read the Naira (₦ or N) figure. If multiple lines, use the first/main amount shown.
- For "date": convert Day/Month/Year fields to YYYY-MM-DD. If year is 2-digit (e.g. "17" or "21"), assume 2017 or 2021.
- If a field is not visible or unclear, use null.
- Return ONLY the JSON object, nothing else.`
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
  })

  const text = response.text.trim()
  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch {
    console.warn(`    ⚠️  Could not parse Gemini response for ${path.basename(imagePath)}:`, text.substring(0, 200))
    return { amount: 0, date: null, description: null, receiptNo: null, period: null, paymentMethod: null }
  }
}

async function ensureLandlordInDB(mapping) {
  if (mapping.landlordId) {
    // Fetch existing landlord
    const landlord = await prisma.landlord.findUnique({
      where: { id: mapping.landlordId },
      select: { id: true, name: true, email: true, phone: true, userId: true }
    })
    if (!landlord) {
      console.error(`  ❌ Landlord ID ${mapping.landlordId} not found in DB!`)
      return null
    }
    return landlord
  }

  // Create a new landlord (without user account to keep it simple)
  console.log(`  📝 Creating new landlord: ${mapping.landlordName}`)
  const bcrypt = require('bcryptjs')
  const hash = await bcrypt.hash('Landlord@2024', 10)

  // Create user first
  const user = await prisma.user.create({
    data: {
      name:     mapping.landlordName,
      email:    mapping.landlordEmail,
      password: hash,
      role:     'landlord',
    }
  })

  // Create landlord record
  const landlord = await prisma.landlord.create({
    data: {
      name:   mapping.landlordName,
      email:  mapping.landlordEmail,
      phone:  '',
      userId: user.id,
    }
  })

  // Link user to landlord
  await prisma.user.update({
    where: { id: user.id },
    data: { landlordProfile: { connect: { id: landlord.id } } }
  })

  console.log(`  ✅ Created landlord: ${landlord.name} (ID=${landlord.id})`)
  return landlord
}

async function ensurePropertyInDB(mapping, landlord) {
  if (mapping.propertyId) {
    // Fetch existing property
    const property = await prisma.property.findUnique({
      where: { id: mapping.propertyId },
      select: { id: true, address: true }
    })
    if (!property) {
      console.warn(`  ⚠️  Property ID ${mapping.propertyId} not found in DB, will create new`)
    } else {
      return property
    }
  }

  // Create new property linked to landlord
  console.log(`  📝 Creating new property: ${mapping.propertyAddress} for landlord ${landlord.name}`)
  const property = await prisma.property.create({
    data: {
      address:    mapping.propertyAddress,
      landlordId: landlord.id,
      status:     'Active',
      type:       'Residential',
    }
  })
  console.log(`  ✅ Created property: ${property.address} (ID=${property.id})`)
  return property
}

async function createReceiptRecord({
  landlord, property, receiptData, filePath, superAdminId, invoiceCounter
}) {
  const year = new Date().getFullYear()
  const invoiceNo = `REC-${year}-${String(invoiceCounter).padStart(4, '0')}`

  // Parse date
  let issueDate = receiptData.date
  if (!issueDate) {
    // Try to extract year from period field
    if (receiptData.period) {
      const yearMatch = receiptData.period.match(/\b(20\d{2})\b/)
      if (yearMatch) issueDate = `${yearMatch[1]}-01-01`
    }
    if (!issueDate) issueDate = new Date().toISOString().split('T')[0]
  }

  const amount = receiptData.amount || 0
  const fileName = path.basename(filePath)
  const description = [
    receiptData.description || 'Property management receipt',
    receiptData.period ? `Period: ${receiptData.period}` : null,
    receiptData.receiptNo ? `Receipt No: ${receiptData.receiptNo}` : null,
    `File: ${fileName}`,
  ].filter(Boolean).join(' | ')

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type:          'Receipt',
        recipientType: 'landlord',
        recipientName:  landlord.name,
        recipientEmail: landlord.email || '',
        recipientPhone: landlord.phone || '',
        landlordId:     landlord.id,
        propertyId:     property.id,
        userId:         landlord.userId || null,
        amount,
        description,
        status:         'Paid',
        issueDate,
        paidDate:       issueDate,
        notes:          receiptData.amountText ? `Amount in words: ${receiptData.amountText}` : null,
        bankName:       receiptData.paymentMethod === 'Transfer' ? 'Bank Transfer' : null,
        createdById:    superAdminId,
      }
    })
    return invoice
  } catch (err) {
    if (err.code === 'P2002') {
      // Unique constraint — invoiceNo already exists, skip
      console.warn(`    ⚠️  Skipping duplicate invoiceNo ${invoiceNo}`)
      return null
    }
    throw err
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏠 EstatePro — Landlord Receipt Importer')
  console.log('═'.repeat(50))
  console.log(`📁 Source folder: ${RECEIPTS_FOLDER}\n`)

  if (!fs.existsSync(RECEIPTS_FOLDER)) {
    console.error(`❌ Folder not found: ${RECEIPTS_FOLDER}`)
    console.error('   Make sure the "Landlord invoices" folder is in real-estate-admin/')
    process.exit(1)
  }

  // Get super admin ID (must exist in DB as createdById)
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'super_admin' },
    select: { id: true, name: true }
  })
  if (!superAdmin) {
    console.error('❌ Super admin user not found in database. Run seed first.')
    process.exit(1)
  }
  console.log(`👑 Super Admin: ${superAdmin.name} (ID=${superAdmin.id})`)

  // Count existing receipts for auto-numbering
  let invoiceCounter = (await prisma.invoice.count({ where: { type: 'Receipt' } })) + 1

  let totalCreated = 0
  let totalSkipped = 0
  let totalErrors  = 0

  // Process each landlord folder
  const landlordFolders = fs.readdirSync(RECEIPTS_FOLDER, { withFileTypes: true })
    .filter(d => d.isDirectory())

  for (const landlordDir of landlordFolders) {
    const folderName = landlordDir.name
    const mapping = LANDLORD_MAP[folderName]

    console.log(`\n🏢 Processing landlord folder: "${folderName}"`)

    if (!mapping) {
      console.warn(`  ⚠️  No mapping found for "${folderName}" — skipping`)
      continue
    }

    // Ensure landlord exists in DB
    let landlord
    try {
      landlord = await ensureLandlordInDB(mapping)
    } catch (err) {
      console.error(`  ❌ Failed to get/create landlord: ${err.message}`)
      totalErrors++
      continue
    }
    if (!landlord) continue

    console.log(`  ✅ Landlord: ${landlord.name} (ID=${landlord.id})`)

    // Process each property subfolder
    const landlordPath = landlordDir.path
      ? path.join(landlordDir.path, landlordDir.name)
      : path.join(RECEIPTS_FOLDER, folderName)
    const propertyFolders = fs.readdirSync(landlordPath, { withFileTypes: true })
      .filter(d => d.isDirectory())

    for (const propertyDir of propertyFolders) {
      const propFolderName = propertyDir.name
      console.log(`  📂 Property folder: "${propFolderName}"`)

      // Ensure property exists in DB
      let property
      try {
        property = await ensurePropertyInDB(mapping, landlord)
      } catch (err) {
        console.error(`    ❌ Failed to get/create property: ${err.message}`)
        totalErrors++
        continue
      }
      if (!property) continue

      console.log(`    ✅ Property: ${property.address} (ID=${property.id})`)

      // Get all receipt image files
      const propPath = propertyDir.path
        ? path.join(propertyDir.path, propertyDir.name)
        : path.join(RECEIPTS_FOLDER, folderName, propFolderName)
      const files = fs.readdirSync(propPath)
        .filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('.'))
        .sort()

      console.log(`    📄 Found ${files.length} receipt images`)

      for (const file of files) {
        const filePath = path.join(propPath, file)
        process.stdout.write(`    🔍 Analyzing: ${file.substring(0, 50)}... `)

        try {
          // Analyze with Gemini Vision
          const receiptData = await analyzeReceiptImage(filePath)
          const amountStr = receiptData.amount ? `₦${receiptData.amount.toLocaleString()}` : '₦0'
          const dateStr = receiptData.date || '(no date)'
          process.stdout.write(`${amountStr} @ ${dateStr}\n`)

          // Create invoice record
          const invoice = await createReceiptRecord({
            landlord, property, receiptData, filePath,
            superAdminId: superAdmin.id,
            invoiceCounter,
          })

          if (invoice) {
            console.log(`    ✅ Created: ${invoice.invoiceNo} — ${amountStr}`)
            invoiceCounter++
            totalCreated++
          } else {
            totalSkipped++
          }

          // Brief pause to respect Gemini API rate limits
          await new Promise(resolve => setTimeout(resolve, 300))

        } catch (err) {
          console.error(`\n    ❌ Error processing ${file}: ${err.message}`)
          totalErrors++
        }
      }
    }
  }

  // Log import activity
  try {
    await prisma.activityLog.create({
      data: {
        userId:      superAdmin.id,
        userName:    superAdmin.name,
        userRole:    'super_admin',
        action:      'IMPORT_RECEIPTS',
        description: `Imported ${totalCreated} landlord receipts from "Landlord invoices" folder`,
        entityType:  'Invoice',
      }
    })
  } catch { /* activity log is non-critical */ }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Import complete!`)
  console.log(`   Created:  ${totalCreated} receipts`)
  console.log(`   Skipped:  ${totalSkipped} (duplicates)`)
  console.log(`   Errors:   ${totalErrors}`)
  console.log('\n🌐 Check the Invoices & Receipts tab on your super admin dashboard.')

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('\n❌ Fatal error:', err.message)
  if (err.message.includes('Can\'t reach database')) {
    console.error('\n💡 Database not reachable. Update DATABASE_URL in backend/.env')
    console.error('   Get the External Database URL from your Render dashboard.')
  }
  await prisma.$disconnect()
  process.exit(1)
})
