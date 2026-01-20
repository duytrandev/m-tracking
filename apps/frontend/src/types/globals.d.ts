/**
 * Global type declarations
 *
 * Augments global types and declares module types.
 */

// Extend Window interface
declare global {
  interface Window {
    // Add any global window properties
    msw?: {
      worker?: {
        start: () => Promise<void>
        stop: () => void
      }
    }
  }
}

// Module declarations for untyped packages (if needed)
// declare module 'some-package' {
//   export function someFunction(): void
// }

export {}
