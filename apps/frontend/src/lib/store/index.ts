/**
 * Global store exports
 *
 * This file exports global stores that manage UI state shared across the application.
 * Feature-specific stores remain in their respective feature directories.
 *
 * Examples:
 * - useAuthStore: features/auth/store/auth-store.ts
 * - useUIStore: lib/store/ui-store.ts (global)
 */

// Global stores - UI state shared across app
export { useUIStore, useTheme, useSidebarState, useIsMobileMenuOpen } from './ui-store'
export type { UIState, Theme, SidebarState } from './ui-store'

// Note: Feature-specific stores remain in their feature directories
// Example: useAuthStore stays in features/auth/store/auth-store.ts
