'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect user's reduced motion preference
 * Returns true if user prefers reduced motion (for accessibility)
 *
 * This hook respects the prefers-reduced-motion CSS media query
 * which is set by users who prefer less animation/motion in interfaces.
 *
 * @returns boolean - true if reduced motion is preferred, false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   return (
 *     <m.div
 *       animate={{ opacity: 1 }}
 *       transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 *     >
 *       Content
 *     </m.div>
 *   )
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') {
      return
    }

    // Check initial value
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    // Cleanup listener on unmount
    return (): void => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}
