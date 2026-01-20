'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/lib/store/ui-store'

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Provider that syncs theme between localStorage and server
 *
 * For now, this uses mock data since the backend API is not yet implemented.
 * When backend is ready, replace mock data with real API calls.
 *
 * Features:
 * - Initializes theme from localStorage on mount
 * - Will sync with server when backend API is implemented
 * - Ensures theme is applied consistently across the app
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUIStore((s) => s.theme)

  // Initialize theme on mount
  useEffect(() => {
    // The theme is already set from localStorage via Zustand persist
    // This effect is here as a placeholder for future server sync

    // TODO: When backend is implemented, uncomment and implement:
    // const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    // if (isAuthenticated) {
    //   // Fetch user preferences from server
    //   apiClient.get('/auth/me').then((response) => {
    //     const serverTheme = response.data.preferences?.theme
    //     if (serverTheme && serverTheme !== theme) {
    //       setTheme(serverTheme)
    //     }
    //   })
    // }
  }, [])

  // Sync theme changes to server (debounced)
  useEffect(() => {
    // TODO: When backend is implemented, uncomment and implement:
    // const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    // if (!isAuthenticated) return
    //
    // const syncTheme = async () => {
    //   try {
    //     await apiClient.patch('/auth/preferences', { theme })
    //   } catch (error) {
    //     console.error('Failed to sync theme:', error)
    //   }
    // }
    //
    // const timeoutId = setTimeout(syncTheme, 500) // Debounce 500ms
    // return () => clearTimeout(timeoutId)
  }, [theme])

  return <>{children}</>
}
