'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      router.push(`/auth/login?error=${encodeURIComponent(error)}`)
      return
    }

    if (code) {
      // Handle OAuth code exchange
      // This will be implemented with the OAuth hook
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }, [searchParams, router])

  return (
    <AuthCard title="Processing...">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Please wait while we complete your sign in...
        </p>
      </div>
    </AuthCard>
  )
}
