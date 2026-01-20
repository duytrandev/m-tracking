'use client'

import { useEffect } from 'react'
import { useUIStore, type Theme, type ResolvedTheme } from '@/lib/store/ui-store'

interface UseThemeReturn {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

/**
 * Hook for managing theme with system preference support
 *
 * Features:
 * - Get current theme setting (light/dark/system)
 * - Get resolved theme (actual light/dark being displayed)
 * - Set theme and sync to localStorage
 * - Listen for system preference changes when theme is "system"
 */
export function useTheme(): UseThemeReturn {
  const theme = useUIStore((s) => s.theme)
  const resolvedTheme = useUIStore((s) => s.resolvedTheme)
  const setTheme = useUIStore((s) => s.setTheme)
  const setResolvedTheme = useUIStore((s) => s.setResolvedTheme)

  // Listen for system preference changes when theme is "system"
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, setResolvedTheme])

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  }
}
