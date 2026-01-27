'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface RoleGuardProps {
  roles: string[]
  children: ReactNode
  fallback?: string
}

/**
 * RoleGuard component
 * Restricts access based on user roles
 * Redirects to unauthorized page if user lacks required role
 */
export function RoleGuard({
  roles,
  children,
  fallback = '/unauthorized',
}: RoleGuardProps) {
  const { user } = useAuthStore()
  const router = useRouter()

  // Check if user has any of the required roles
  const hasRequiredRole =
    user?.roles.some(role => roles.includes(role)) ?? false

  useEffect(() => {
    if (!hasRequiredRole) {
      router.replace(fallback)
    }
  }, [hasRequiredRole, fallback, router])

  if (!hasRequiredRole) {
    return null
  }

  return <>{children}</>
}
