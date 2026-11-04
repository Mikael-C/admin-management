const jwt = require('jsonwebtoken')
const { prisma } = require('../lib/db')

const JWT_SECRET = process.env.JWT_SECRET || 'estatepro-fallback-secret-key'

/**
 * Middleware: Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        landlordProfile: { select: { id: true } },
        agentProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' })
    }
    next(err)
  }
}

/**
 * Middleware: Require specific role(s)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      })
    }
    next()
  }
}

/**
 * Middleware: Super admin only
 */
function requireSuperAdmin(req, res, next) {
  return requireRole('super_admin')(req, res, next)
}

/**
 * Middleware: Super admin or admin
 */
function requireAdmin(req, res, next) {
  return requireRole('super_admin', 'admin')(req, res, next)
}

/**
 * Middleware: Super admin, admin, or landlord
 */
function requireLandlordOrAdmin(req, res, next) {
  return requireRole('super_admin', 'admin', 'landlord')(req, res, next)
}

/**
 * Generate JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

module.exports = {
  authenticate,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireLandlordOrAdmin,
  generateToken
}
