/**
 * MSW Handlers - Centralized API Mock Handlers
 *
 * This module re-exports all API mock handlers organized by feature module.
 * Import from this file when setting up MSW to ensure all handlers are included.
 *
 * Handler Modules:
 * - auth: Authentication and authorization endpoints
 * - spending: Transactions and spending analytics endpoints
 * - profile: User profile and settings endpoints
 */

import { authHandlers } from './handlers/auth'
import { spendingHandlers } from './handlers/spending'
import { profileHandlers } from './handlers/profile'

// Re-export all handlers for easy importing
export { authHandlers, spendingHandlers, profileHandlers }

// Combine all handlers into a single array
export const handlers = [
  ...authHandlers,
  ...spendingHandlers,
  ...profileHandlers,
]
