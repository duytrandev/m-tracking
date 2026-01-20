'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { CodeInput } from '@/features/auth/components/code-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { use2FAVerify } from '@/features/auth/hooks/use-2fa-verify'

type Mode = 'totp' | 'backup'

export default function TwoFactorVerifyPage(): React.ReactElement {
  const router = useRouter()
  const { requires2FA, pendingEmail } = useAuthStore()
  const { verify, isLoading, error, attemptsRemaining } = use2FAVerify()

  const [mode, setMode] = useState<Mode>('totp')
  const [code, setCode] = useState('')
  const [backupCode, setBackupCode] = useState('')

  // Redirect if not in 2FA flow
  if (!requires2FA || !pendingEmail) {
    router.replace('/auth/login')
    return <div>Redirecting...</div>
  }

  const handleVerify = (): void => {
    const codeToVerify = mode === 'totp' ? code : backupCode.replace(/\s/g, '')
    verify(codeToVerify)
  }

  return (
    <AuthCard title="Two-factor authentication">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === 'totp'
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter one of your backup codes'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div>
              {error}
              {attemptsRemaining !== null && (
                <span className="block text-xs mt-1">
                  {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                </span>
              )}
            </div>
          </div>
        )}

        {mode === 'totp' ? (
          <>
            <CodeInput
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
              disabled={isLoading}
              error={!!error}
            />

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={code.length !== 6}
              isLoading={isLoading}
              loadingText="Verifying..."
            >
              Verify
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="backupCode">Backup Code</Label>
              <Input
                id="backupCode"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="font-mono text-center"
                disabled={isLoading}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={backupCode.length < 10}
              isLoading={isLoading}
              loadingText="Verifying..."
            >
              Verify Backup Code
            </Button>
          </>
        )}

        <div className="text-center">
          {mode === 'totp' ? (
            <button
              type="button"
              onClick={() => {
                setMode('backup')
                setCode('')
              }}
              className="text-sm text-primary hover:underline"
            >
              Use a backup code instead
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('totp')
                setBackupCode('')
              }}
              className="text-sm text-primary hover:underline"
            >
              Use authenticator app
            </button>
          )}
        </div>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </AuthCard>
  )
}
