require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

// Import routes
const authRoutes = require('./routes/auth')
const landlordRoutes = require('./routes/landlords')
const agentRoutes = require('./routes/agents')
const propertyRoutes = require('./routes/properties')
const tenantRoutes = require('./routes/tenants')
const rentRoutes = require('./routes/rents')
const expenseRoutes = require('./routes/expenses')
const maintenanceRoutes = require('./routes/maintenance')
const dashboardRoutes = require('./routes/dashboard')
const messageRoutes = require('./routes/messages')
const payoutRoutes = require('./routes/payouts')
const userRoutes = require('./routes/users')
const profileRoutes = require('./routes/profile')
const ledgerRoutes = require('./routes/ledger')
const activityRoutes = require('./routes/activities')
const newsletterRoutes = require('./routes/newsletters')
const invoiceRoutes = require('./routes/invoices')

const app = express()
const PORT = process.env.PORT || 5000

// Trust reverse proxy (Render, Vercel, Cloudflare, etc.)
app.set('trust proxy', 1)

// ===========================
// SECURITY & CORS MIDDLEWARE
// ===========================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// Parse configured frontend URLs (supports comma-separated list and strips trailing slashes)
const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean)

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://admin-management-beryl.vercel.app/',
  'https://admin-management-v4fl.onrender.com/',
]

const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true)

    const cleanOrigin = origin.replace(/\/+$/, '')

    let isVercel = false
    try {
      const hostname = new URL(cleanOrigin).hostname
      isVercel = hostname.endsWith('.vercel.app')
    } catch {
      isVercel = false
    }

    const isAllowed =
      process.env.NODE_ENV === 'development' ||
      allowedOrigins.includes(cleanOrigin) ||
      allowedOrigins.some(o => cleanOrigin.startsWith(o)) ||
      isVercel ||
      cleanOrigin.endsWith('.onrender.com')

    if (isAllowed) {
      callback(null, true)
    } else {
      console.warn(`[CORS Blocked] Rejected origin: "${origin}". Allowed origins: ${JSON.stringify(allowedOrigins)}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Handle preflight OPTIONS requests across all routes
app.options('*', cors())

// Rate limiting (applied after CORS so CORS headers are preserved)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' }
})
app.use('/api/auth/login', authLimiter)

// ===========================
// BODY PARSING
// ===========================
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ===========================
// STATIC FILES (Receipt Images)
// ===========================
// Serves backend/public/ at /public/* — e.g. /public/receipts/Chukwu Joy/67 Kenyatta street/image.jpg
app.use('/public', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
}, express.static(require('path').join(__dirname, '..', 'public')))

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// ===========================
// HEALTH CHECK
// ===========================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EstatePro Real Estate Management API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() })
})

// ===========================
// API ROUTES
// ===========================
app.use('/api/auth', authRoutes)
app.use('/api/landlords', landlordRoutes)
app.use('/api/agents', agentRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/rents', rentRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/payouts', payoutRoutes)
app.use('/api/users', userRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/ledger', ledgerRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/newsletters', newsletterRoutes)
app.use('/api/invoices', invoiceRoutes)

// ===========================
// ERROR HANDLING
// ===========================
app.use((req, res, next) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

app.use((err, req, res, next) => {
  console.error('[Error]', err.message, err.stack)

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: Origin not allowed' })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate entry — this record already exists.' })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong'
  })
})

// ===========================
// START SERVER
// ===========================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 EstatePro API Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health\n`)
})

module.exports = app
