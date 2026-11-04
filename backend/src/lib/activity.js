const { prisma } = require('./db')

/**
 * Log a user action across the system
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.userName
 * @param {string} params.userRole
 * @param {string} params.action - e.g. "CREATE_PROPERTY", "APPROVE_PAYOUT", "LOGIN"
 * @param {string} params.description - Human-readable summary
 * @param {string} [params.entityType] - "Property", "Payout", "Rent", "Message", etc.
 * @param {number} [params.entityId] - ID of the entity
 */
async function logActivity({ userId, userName, userRole, action, description, entityType, entityId }) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: userId || null,
        userName: userName || 'System User',
        userRole: userRole || 'user',
        action: action.toUpperCase(),
        description,
        entityType: entityType || null,
        entityId: entityId ? parseInt(entityId) : null,
      }
    })
  } catch (err) {
    // Non-fatal, just log to console
    console.warn('[ActivityLog Error]', err.message)
    return null
  }
}

module.exports = { logActivity }
