/**
 * Type definitions barrel export
 *
 * Single source of truth for all type definitions.
 * Import from here instead of deep imports.
 *
 * @example
 * import { User, LoginRequest } from '@/types'
 */

// API types (requests/responses)
export * from './api'

// Entity types (domain models)
export * from './entities'

// Note: env.d.ts and globals.d.ts are auto-loaded by TypeScript
