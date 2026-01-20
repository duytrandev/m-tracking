'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useMagicLinkVerify } from '@/features/auth/hooks/use-magic-link-verify'

export default function MagicLinkVerifyPage(): React.ReactElement {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const { verifyMagicLink, isLoading, error } = useMagicLinkVerify()

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login')
      return
    }
    verifyMagicLink(token)
  }, [token, verifyMagicLink, router])

  if (!token) {
    return (
      <AuthCard title="Invalid Link" showLogo>
        <div className="flex flex-col items-center gap-4 py-8">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-center text-muted-foreground">No token provided</p>
        </div>
      </AuthCard>
    )
  }

  if (isLoading) {
    return (
      <AuthCard title="Verifying..." showLogo>
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Please wait while we sign you in...</p>
        </div>
      </AuthCard>
    )
  }

  if (error) {
    return (
      <AuthCard title="Link expired or invalid" showLogo>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-center text-muted-foreground">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Back to Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/magic-link">Request New Link</Link>
            </Button>
          </div>
        </div>
      </AuthCard>
    )
  }

  // Success state (will redirect)
  return (
    <AuthCard title="Success!" showLogo>
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </AuthCard>
  )
}
