'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthInit } from '../hooks/use-auth-init'
import { useAuthStore } from '../store/auth-store'
import { onAuthEvent } from '@/lib/api-client'

interface AuthInitializerProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wraps app to handle auth initialization
 * Shows loading state while checking auth session
 *
 * This component:
 * 1. Attempts to restore session on mount via useAuthInit
 * 2. Shows loading spinner during initialization
 * 3. Renders children once auth state is determined
 * 4. Listens for session expiry events and redirects to login
 */
export function AuthInitializer({ children, fallback }: AuthInitializerProps): React.ReactElement {
  const { isInitializing } = useAuthInit()
  const logout = useAuthStore(s => s.logout)
  const router = useRouter()

  // Listen for session expiry events from API client
  useEffect(() => {
    const unsubscribe = onAuthEvent('session-expired', () => {
      logout()
      router.push('/auth/login?reason=session-expired')
    })

    return unsubscribe
  }, [logout, router])

  if (isInitializing) {
    return (
      <>
        {fallback || (
          <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
