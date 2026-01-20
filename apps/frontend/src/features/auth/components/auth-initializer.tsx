'use client'

import { ReactNode } from 'react'
import { useAuthInit } from '../hooks/use-auth-init'

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
 */
export function AuthInitializer({ children, fallback }: AuthInitializerProps): React.ReactElement {
  const { isInitializing } = useAuthInit()

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
