'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'

/**
 * Root page - redirects based on auth status
 * Authenticated users go to dashboard, others to login
 */
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard')
      } else {
        router.replace('/auth/login')
      }
    }
  }, [isLoading, isAuthenticated, router])

  return <FullPageLoader text="Redirecting..." />
}
