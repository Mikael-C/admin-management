/**
 * EstatePro - Landlord Receipt Image Importer (v2 — Image-First)
 * =================================================================
 * - Copies images to backend/public/receipts/ so Express can serve them
 * - Analyzes each JPEG with Gemini Vision to extract amount/date
 * - Creates Invoice (Receipt) records with imageUrl pointing to the served image
 * - Re-runnable: skips already-imported files
 * - Handles free-tier rate limits (5 req/min) with auto-retry backoff
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
const PUBLIC_RECEIPTS  = path.join(__dirname, '..', 'public', 'receipts')
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
const BACKEND_URL      = (process.env.BACKEND_URL || 'https://admin-management-v4fl.onrender.com').replace(/\/$/, '')

// Hard-coded mapping: folder name → DB IDs (researched from Excel)
const LANDLORD_MAP = {
  'Agu Emmanuel': {
    landlordId:      null,          // Not in DB — will be created
    landlordName:    'Agu Emmanuel',
    landlordEmail:   'agu.emmanuel@estatepro.com',
    propertyFolder:  '5 Umuobido street',
    propertyId:      null,          // Not in DB — will be created
    propertyAddress: '5 Umuobido Street',
  },
  'Chukwu Joy': {
    landlordId:      21,            // Joy Chukwu
    landlordName:    'Joy Chukwu',
    landlordEmail:   null,
    propertyFolder:  '67 Kenyatta street',
    propertyId:      21,            // 68 Kenyetta street
    propertyAddress: '68 Kenyetta street',
  },
  'Mr Kennedy Ezechukwu': {
    landlordId:      24,            // Mr K Ezechukwu
    landlordName:    'Mr K Ezechukwu',
    landlordEmail:   null,
    propertyFolder:  '118 Kaduna street',
    propertyId:      null,          // No separate property row — will create
    propertyAddress: '118D Kaduna Street',
  },
  'Pastor Eze': {
    landlordId:      null,          // Not in DB — will be created
    landlordName:    'Pastor Eze',
    landlordEmail:   'pastor.eze@estatepro.com',
    propertyFolder:  'Weaather Head',
    propertyId:      null,          // Not in DB — will be created
    propertyAddress: 'Weather Head Estate',
  },
  'Umeh Isaac Ichie': {
    landlordId:      18,            // Ichie Umeh Isaac
    landlordName:    'Ichie Umeh Isaac',
    landlordEmail:   null,
    propertyFolder:  '2 Ekwulobia Street',
    propertyId:      18,            // 20 Edward Nnaji ST
    propertyAddress: '20 Edward Nnaji ST',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
let ai
function getAI() {
  if (!ai) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set in backend/.env')
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  }
  return ai
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fix PostgreSQL sequences that got out of sync when seed used explicit IDs
async function resetSequences() {
  console.log('🔧 Syncing PostgreSQL sequences...')
  const tables = ['users', 'landlords', 'properties', 'invoices']
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
      )
    } catch { /* non-critical */ }
  }
  console.log('✅ Sequences synced\n')
}

// Copy image file to public/receipts/landlordFolder/propertyFolder/filename
function copyImageToPublic(srcPath, landlordFolder, propertyFolder) {
  const destDir = path.join(PUBLIC_RECEIPTS, landlordFolder, propertyFolder)
  fs.mkdirSync(destDir, { recursive: true })
  const fileName = path.basename(srcPath)
  const destPath = path.join(destDir, fileName)
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath)
  }
  // Return the URL path that Express will serve (URL-encode spaces)
  const urlPath = `/public/receipts/${encodeURIComponent(landlordFolder)}/${encodeURIComponent(propertyFolder)}/${encodeURIComponent(fileName)}`
  return `${BACKEND_URL}${urlPath}`
}

// Analyze receipt image with Gemini Vision, with retry on rate-limit 429
async function analyzeReceiptImage(imagePath, retryCount = 0) {
  const MAX_RETRIES = 6
  const imageBuffer = fs.readFileSync(imagePath)
  const base64Image = imageBuffer.toString('base64')

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            text: `You are analyzing a Nigerian property management receipt image from Okechukwu Ezeokeke & Associates.
Extract ONLY the following fields and return a JSON object (no markdown, no code fences):
{
  "receiptNo": "receipt number e.g. 0878 or 4911",
  "amount": 123456.00,
  "amountText": "written words for amount e.g. Forty Two Thousand Only",
  "date": "YYYY-MM-DD",
  "period": "rental period if shown e.g. Oct 2015 - Apr 2016",
  "description": "what the payment is for e.g. Agency charge, Rent",
  "paymentMethod": "Cash or Transfer"
}
Rules:
- amount: the main Naira figure shown (₦ or N symbol). Numbers like 42,000 → 42000.
- date: convert the Day/Month/Year boxes to YYYY-MM-DD. 2-digit year: add 2000 (17 → 2017, 24 → 2024).
- If a field is illegible or missing use null.
- Return ONLY the raw JSON object, nothing else.`
          },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]
      }]
    })

    const text = response.text.trim()
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      console.warn(`    ⚠️  Parse failed for ${path.basename(imagePath)}: ${text.substring(0, 80)}`)
      return { amount: 0, date: null, description: null, receiptNo: null, period: null, paymentMethod: null }
    }

  } catch (err) {
    const msg = err.message || ''
    const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')

    if (is429 && retryCount < MAX_RETRIES) {
      // Parse the suggested retryDelay from the API response
      const delayMatch = msg.match(/"retryDelay"\s*:\s*"([\d.]+)s"/)
      let waitMs = 65000
      if (delayMatch) {
        waitMs = Math.ceil(parseFloat(delayMatch[1]) * 1000) + 3000
      }
      const waitSec = Math.ceil(waitMs / 1000)
      process.stdout.write(`\n    ⏳ Rate limited — waiting ${waitSec}s (retry ${retryCount + 1}/${MAX_RETRIES})... `)
      await sleep(waitMs)
      return analyzeReceiptImage(imagePath, retryCount + 1)
    }
    throw err
  }
}

async function ensureLandlordInDB(mapping) {
  if (mapping.landlordId) {
    const landlord = await prisma.landlord.findUnique({
      where: { id: mapping.landlordId },
      select: { id: true, name: true, email: true, phone: true, userId: true }
    })
    if (!landlord) { console.error(`  ❌ Landlord ID ${mapping.landlordId} not found!`); return null }
    return landlord
  }

  // Check if already created in a previous run
  const existing = await prisma.landlord.findFirst({ where: { name: mapping.landlordName } })
  if (existing) {
    console.log(`  ♻️  Found existing landlord: ${existing.name} (ID=${existing.id})`)
    return existing
  }

  console.log(`  📝 Creating new landlord: ${mapping.landlordName}`)
  const bcrypt = require('bcryptjs')
  const hash = await bcrypt.hash('Landlord@2024', 10)
  const user = await prisma.user.create({
    data: { name: mapping.landlordName, email: mapping.landlordEmail, password: hash, role: 'landlord' }
  })
  const landlord = await prisma.landlord.create({
    data: { name: mapping.landlordName, email: mapping.landlordEmail, phone: '', userId: user.id }
  })
  await prisma.user.update({ where: { id: user.id }, data: { landlordProfile: { connect: { id: landlord.id } } } })
  console.log(`  ✅ Created landlord: ${landlord.name} (ID=${landlord.id})`)
  return landlord
}

async function ensurePropertyInDB(mapping, landlord) {
  if (mapping.propertyId) {
    const property = await prisma.property.findUnique({ where: { id: mapping.propertyId }, select: { id: true, address: true } })
    if (property) return property
  }
  // Check if already created in a previous run
  const existing = await prisma.property.findFirst({ where: { address: mapping.propertyAddress, landlordId: landlord.id } })
  if (existing) {
    console.log(`  ♻️  Found existing property: ${existing.address} (ID=${existing.id})`)
    return existing
  }
  console.log(`  📝 Creating new property: ${mapping.propertyAddress}`)
  const property = await prisma.property.create({
    data: { address: mapping.propertyAddress, landlordId: landlord.id, status: 'Active', type: 'Residential' }
  })
  console.log(`  ✅ Created property: ${property.address} (ID=${property.id})`)
  return property
}

async function createReceiptRecord({ landlord, property, receiptData, imageUrl, fileName, superAdminId, invoiceCounter }) {
  const year = new Date().getFullYear()
  const invoiceNo = `REC-${year}-${String(invoiceCounter).padStart(4, '0')}`

  let issueDate = receiptData.date
  if (!issueDate && receiptData.period) {
    const yearMatch = receiptData.period.match(/\b(20\d{2})\b/)
    if (yearMatch) issueDate = `${yearMatch[1]}-01-01`
  }
  if (!issueDate) issueDate = new Date().toISOString().split('T')[0]

  const amount = receiptData.amount || 0
  const description = [
    receiptData.description || 'Property management receipt',
    receiptData.period ? `Period: ${receiptData.period}` : null,
    receiptData.receiptNo ? `Receipt No: ${receiptData.receiptNo}` : null,
    `File: ${fileName}`,
  ].filter(Boolean).join(' | ')

  try {
    return await prisma.invoice.create({
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
        imageUrl,                   // ← The actual image URL served by Express
        createdById:    superAdminId,
      }
    })
  } catch (err) {
    if (err.code === 'P2002') { console.warn(`    ⚠️  Skipping duplicate: ${invoiceNo}`); return null }
    throw err
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏠 EstatePro — Landlord Receipt Importer (Image-First v2)')
  console.log('═'.repeat(55))
  console.log(`📁 Source:  ${RECEIPTS_FOLDER}`)
  console.log(`🌐 Serving: ${BACKEND_URL}/public/receipts/...\n`)

  if (!fs.existsSync(RECEIPTS_FOLDER)) {
    console.error(`❌ Folder not found: ${RECEIPTS_FOLDER}`); process.exit(1)
  }

  const superAdmin = await prisma.user.findFirst({ where: { role: 'super_admin' }, select: { id: true, name: true } })
  if (!superAdmin) { console.error('❌ Super admin not found. Run seed first.'); process.exit(1) }
  console.log(`👑 Super Admin: ${superAdmin.name} (ID=${superAdmin.id})`)

  await resetSequences()

  let invoiceCounter = (await prisma.invoice.count({ where: { type: 'Receipt' } })) + 1
  let totalCreated = 0, totalSkipped = 0, totalErrors = 0

  const landlordFolders = fs.readdirSync(RECEIPTS_FOLDER, { withFileTypes: true }).filter(d => d.isDirectory())

  for (const landlordDir of landlordFolders) {
    const folderName = landlordDir.name
    const mapping = LANDLORD_MAP[folderName]
    console.log(`\n🏢 Landlord folder: "${folderName}"`)
    if (!mapping) { console.warn(`  ⚠️  No mapping — skipping`); continue }

    let landlord
    try { landlord = await ensureLandlordInDB(mapping) } catch (err) { console.error(`  ❌ ${err.message}`); totalErrors++; continue }
    if (!landlord) continue
    console.log(`  ✅ Landlord: ${landlord.name} (ID=${landlord.id})`)

    const landlordPath = path.join(RECEIPTS_FOLDER, folderName)
    const propertyFolders = fs.readdirSync(landlordPath, { withFileTypes: true }).filter(d => d.isDirectory())

    for (const propertyDir of propertyFolders) {
      const propFolderName = propertyDir.name
      console.log(`  📂 Property: "${propFolderName}"`)

      let property
      try { property = await ensurePropertyInDB(mapping, landlord) } catch (err) { console.error(`    ❌ ${err.message}`); totalErrors++; continue }
      if (!property) continue
      console.log(`    ✅ Property: ${property.address} (ID=${property.id})`)

      const propPath = path.join(landlordPath, propFolderName)
      const files = fs.readdirSync(propPath).filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('.')).sort()
      console.log(`    📄 Found ${files.length} receipt images`)

      for (const file of files) {
        const filePath = path.join(propPath, file)

        // Skip if already imported
        const alreadyExists = await prisma.invoice.findFirst({
          where: { description: { contains: file }, type: 'Receipt' },
          select: { id: true, invoiceNo: true }
        })
        if (alreadyExists) {
          console.log(`    ⏭️  Already imported: ${file.substring(0, 50)} (${alreadyExists.invoiceNo})`)
          totalSkipped++
          continue
        }

        process.stdout.write(`    🔍 Analyzing: ${file.substring(0, 45)}... `)

        try {
          // 1. Copy image to public/receipts/ and get its URL
          const imageUrl = copyImageToPublic(filePath, folderName, propFolderName)

          // 2. Analyze with Gemini Vision
          const receiptData = await analyzeReceiptImage(filePath)
          const amountStr = receiptData.amount ? `₦${Number(receiptData.amount).toLocaleString()}` : '₦0'
          const dateStr = receiptData.date || '(no date)'
          process.stdout.write(`${amountStr} @ ${dateStr}\n`)

          // 3. Create Invoice record with imageUrl
          const invoice = await createReceiptRecord({
            landlord, property, receiptData, imageUrl,
            fileName: file,
            superAdminId: superAdmin.id,
            invoiceCounter,
          })

          if (invoice) {
            console.log(`    ✅ ${invoice.invoiceNo} — ${amountStr} 🖼️  ${imageUrl.split('/receipts/')[1]}`)
            invoiceCounter++
            totalCreated++
          } else {
            totalSkipped++
          }

          // Respect free-tier: 5 req/min → 13s between calls
          await sleep(13000)

        } catch (err) {
          console.error(`\n    ❌ ${file}: ${err.message.substring(0, 150)}`)
          totalErrors++
          await sleep(13000)
        }
      }
    }
  }

  // Log to activity
  try {
    await prisma.activityLog.create({
      data: {
        userId: superAdmin.id, userName: superAdmin.name, userRole: 'super_admin',
        action: 'IMPORT_RECEIPTS',
        description: `Imported ${totalCreated} landlord receipt images from "Landlord invoices" folder`,
        entityType: 'Invoice',
      }
    })
  } catch { /* non-critical */ }

  console.log('\n' + '═'.repeat(55))
  console.log(`✅ Import complete!`)
  console.log(`   Created:  ${totalCreated} receipt records (with images)`)
  console.log(`   Skipped:  ${totalSkipped} (already imported)`)
  console.log(`   Errors:   ${totalErrors}`)
  console.log('\n🌐 Check the Invoices & Receipts tab — images are live!')

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error('\n❌ Fatal error:', err.message)
  if (err.message.includes("Can't reach database")) {
    console.error('\n💡 Set the Render external DATABASE_URL in backend/.env')
  }
  await prisma.$disconnect()
  process.exit(1)
})
