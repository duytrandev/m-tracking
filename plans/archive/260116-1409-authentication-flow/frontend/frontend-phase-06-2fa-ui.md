# Frontend Phase 6: 2FA UI

**Duration:** Week 4-5
**Priority:** High
**Status:** Completed (2026-01-16)
**Dependencies:** Phase 5 (Passwordless UI)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 6](./phase-06-two-factor-auth.md)
- [UI/UX Design - 2FA Setup](../../docs/frontend-architecture/authentication-ui-ux-design.md#flow-5-2fa-setup)

---

## Overview

Implement Two-Factor Authentication UI including setup modal (QR code scanning, verification, backup codes) and 2FA verification during login.

---

## Key Insights

- TOTP (Time-based One-Time Password) via authenticator apps
- 3-step setup wizard: QR code -> Verify -> Backup codes
- 10 recovery/backup codes provided
- 2FA verification required during login if enabled
- Can use backup code if authenticator unavailable

---

## Requirements

### Functional Requirements
- 2FA setup modal with 3 steps
- QR code display for authenticator apps
- Manual entry code (for accessibility)
- 6-digit TOTP verification
- Backup codes display with download/copy
- 2FA verification page during login
- Backup code input option
- 2FA disable flow

### Non-Functional Requirements
- QR code renders clearly at all sizes
- Backup codes downloadable as text file
- Step indicator shows progress
- Modal can be dismissed (with confirmation)

---

## Architecture

### 2FA Setup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    2FA SETUP FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: QR Code                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  POST /auth/2fa/enroll                                     │ │
│  │  → Returns: { qrCode: base64, secret: string }             │ │
│  │  → Display QR code for scanning                            │ │
│  │  → Show manual entry code                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Step 2: Verify                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  User enters 6-digit code from authenticator               │ │
│  │  POST /auth/2fa/verify { code }                            │ │
│  │  → Validates TOTP is set up correctly                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Step 3: Backup Codes                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  GET /auth/2fa/backup-codes                                │ │
│  │  → Returns 10 backup codes                                 │ │
│  │  → User must download/copy and confirm saved               │ │
│  │  → "I have saved these codes" checkbox required            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Login with 2FA Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  LOGIN WITH 2FA                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Normal Login                                                 │
│     POST /auth/login { email, password }                        │
│     → Response: { requires2FA: true, email }                    │
│     → No tokens until 2FA verified                              │
│                                                                  │
│  2. 2FA Verification Page                                        │
│     POST /auth/2fa/validate { code, email }                     │
│     → Success: Returns tokens, complete login                   │
│     → Failure: Show error, allow retry                          │
│                                                                  │
│  3. Backup Code Option                                           │
│     If can't access authenticator:                              │
│     POST /auth/2fa/validate { code: backupCode, email }         │
│     → Backup code is consumed on use                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/features/auth/components/two-factor-setup-modal.tsx`
- `src/features/auth/components/two-factor-step-qr.tsx`
- `src/features/auth/components/two-factor-step-verify.tsx`
- `src/features/auth/components/two-factor-step-backup.tsx`
- `src/features/auth/components/backup-codes-display.tsx`
- `src/features/auth/hooks/use-2fa-setup.ts`
- `src/features/auth/hooks/use-2fa-verify.ts`
- `src/pages/auth/2fa-verify.tsx`

### Files to Modify

- `src/features/auth/api/auth-api.ts`
- `src/features/auth/hooks/use-login.ts`
- `src/components/ui/dialog.tsx`

---

## Implementation Steps

### Step 1: Create Dialog Component (30 minutes)

Create `src/components/ui/dialog.tsx`:

```tsx
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

### Step 2: Update Auth API for 2FA (30 minutes)

Add to `src/features/auth/api/auth-api.ts`:

```typescript
// 2FA Setup
enroll2FA: async (): Promise<TwoFactorEnrollResponse> => {
  const response = await apiClient.post<TwoFactorEnrollResponse>('/auth/2fa/enroll')
  return response.data
},

verify2FASetup: async (code: string): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/2fa/verify', { code })
  return response.data
},

getBackupCodes: async (): Promise<BackupCodesResponse> => {
  const response = await apiClient.get<BackupCodesResponse>('/auth/2fa/backup-codes')
  return response.data
},

disable2FA: async (code: string): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/2fa/disable', { code })
  return response.data
},

// 2FA Login Validation
validate2FA: async (code: string, email: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/2fa/validate', { code, email })
  if (response.data.accessToken) {
    setAuthToken(response.data.accessToken, response.data.expiresIn)
  }
  return response.data
},
```

Add types to `src/features/auth/types/auth-types.ts`:

```typescript
export interface TwoFactorEnrollResponse {
  qrCode: string // Base64 encoded QR code image
  secret: string // Manual entry code
}

export interface BackupCodesResponse {
  codes: string[]
}
```

### Step 3: Create 2FA Setup Hook (30 minutes)

Create `src/features/auth/hooks/use-2fa-setup.ts`:

```typescript
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'

export type SetupStep = 'qr' | 'verify' | 'backup'

interface Use2FASetupReturn {
  // State
  step: SetupStep
  qrCode: string | null
  secret: string | null
  backupCodes: string[]
  isLoading: boolean
  error: string | null

  // Actions
  startSetup: () => void
  verifyCode: (code: string) => void
  completeSetup: () => void
  goBack: () => void
  reset: () => void
}

export function use2FASetup(): Use2FASetupReturn {
  const [step, setStep] = useState<SetupStep>('qr')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const { updateUser } = useAuthStore()

  // Enroll mutation (Step 1)
  const enrollMutation = useMutation({
    mutationFn: authApi.enroll2FA,
    onSuccess: (data) => {
      setQrCode(data.qrCode)
      setSecret(data.secret)
    },
  })

  // Verify mutation (Step 2)
  const verifyMutation = useMutation({
    mutationFn: authApi.verify2FASetup,
    onSuccess: async () => {
      // Fetch backup codes
      const codesResponse = await authApi.getBackupCodes()
      setBackupCodes(codesResponse.codes)
      setStep('backup')
    },
  })

  const startSetup = (): void => {
    enrollMutation.mutate()
  }

  const verifyCode = (code: string): void => {
    verifyMutation.mutate(code)
  }

  const completeSetup = (): void => {
    // Update user state to reflect 2FA enabled
    updateUser({ twoFactorEnabled: true })
  }

  const goBack = (): void => {
    if (step === 'verify') {
      setStep('qr')
    }
  }

  const reset = (): void => {
    setStep('qr')
    setQrCode(null)
    setSecret(null)
    setBackupCodes([])
    enrollMutation.reset()
    verifyMutation.reset()
  }

  const isLoading = enrollMutation.isPending || verifyMutation.isPending

  const error = enrollMutation.error || verifyMutation.error
    ? isApiError(enrollMutation.error || verifyMutation.error)
      ? (enrollMutation.error || verifyMutation.error as any).response?.data?.message
      : 'An error occurred'
    : null

  return {
    step,
    qrCode,
    secret,
    backupCodes,
    isLoading,
    error,
    startSetup,
    verifyCode,
    completeSetup,
    goBack,
    reset,
  }
}
```

### Step 4: Create 2FA Setup Modal (2 hours)

Create `src/features/auth/components/two-factor-setup-modal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CodeInput } from './code-input'
import { BackupCodesDisplay } from './backup-codes-display'
import { use2FASetup, SetupStep } from '../hooks/use-2fa-setup'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TwoFactorSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function TwoFactorSetupModal({
  isOpen,
  onClose,
  onComplete,
}: TwoFactorSetupModalProps): JSX.Element {
  const {
    step,
    qrCode,
    secret,
    backupCodes,
    isLoading,
    error,
    startSetup,
    verifyCode,
    completeSetup,
    goBack,
    reset,
  } = use2FASetup()

  const [code, setCode] = useState('')
  const [hasSavedCodes, setHasSavedCodes] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  // Start setup when modal opens
  useEffect(() => {
    if (isOpen) {
      reset()
      startSetup()
    }
  }, [isOpen])

  const handleClose = (): void => {
    if (step === 'backup') {
      // Don't allow closing without confirming
      return
    }
    onClose()
  }

  const handleComplete = (): void => {
    completeSetup()
    onComplete()
    onClose()
  }

  const copySecret = async (): Promise<void> => {
    if (secret) {
      await navigator.clipboard.writeText(secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const stepNumber = step === 'qr' ? 1 : step === 'verify' ? 2 : 3

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Set up two-factor authentication</DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {stepNumber} of 3</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(stepNumber / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Step 1: QR Code */}
        {step === 'qr' && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            {qrCode && (
              <div className="flex justify-center">
                <div className="border rounded-lg p-4 bg-white">
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Can't scan? Enter this code manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => { setStep('verify'); setCode(''); }}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              Enter the 6-digit code from your authenticator app to verify setup
            </p>

            <CodeInput
              value={code}
              onChange={setCode}
              onComplete={(value) => verifyCode(value)}
              disabled={isLoading}
              error={!!error}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                onClick={() => verifyCode(code)}
                disabled={code.length !== 6}
                isLoading={isLoading}
                loadingText="Verifying..."
              >
                Verify
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && (
          <div className="space-y-6">
            <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800 font-medium">
                Save your backup codes
              </p>
              <p className="text-sm text-amber-700 mt-1">
                If you lose access to your authenticator app, you can use these codes to sign in.
                Each code can only be used once.
              </p>
            </div>

            <BackupCodesDisplay codes={backupCodes} />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="saved"
                checked={hasSavedCodes}
                onCheckedChange={(checked) => setHasSavedCodes(checked as boolean)}
              />
              <Label htmlFor="saved" className="text-sm">
                I have saved these backup codes in a safe place
              </Label>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleComplete}
                disabled={!hasSavedCodes}
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

### Step 5: Create Backup Codes Display (30 minutes)

Create `src/features/auth/components/backup-codes-display.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, Check } from 'lucide-react'

interface BackupCodesDisplayProps {
  codes: string[]
}

export function BackupCodesDisplay({ codes }: BackupCodesDisplayProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (): Promise<void> => {
    const text = codes.map((code, i) => `${i + 1}. ${code}`).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCodes = (): void => {
    const text = [
      'M-Tracking Backup Codes',
      '========================',
      '',
      'Keep these codes safe. Each code can only be used once.',
      '',
      ...codes.map((code, i) => `${i + 1}. ${code}`),
      '',
      `Generated: ${new Date().toLocaleString()}`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'm-tracking-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
        {codes.map((code, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-muted-foreground w-6">{index + 1}.</span>
            <span className="font-medium">{code}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={copyToClipboard}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button variant="outline" className="flex-1" onClick={downloadCodes}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  )
}
```

### Step 6: Create 2FA Verify Hook (30 minutes)

Create `src/features/auth/hooks/use-2fa-verify.ts`:

```typescript
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'

interface Use2FAVerifyReturn {
  verify: (code: string) => void
  isLoading: boolean
  error: string | null
  attemptsRemaining: number | null
}

export function use2FAVerify(): Use2FAVerifyReturn {
  const navigate = useNavigate()
  const { login, pendingEmail, setRequires2FA } = useAuthStore()

  const mutation = useMutation({
    mutationFn: (code: string) => {
      if (!pendingEmail) {
        throw new Error('No pending email for 2FA verification')
      }
      return authApi.validate2FA(code, pendingEmail)
    },
    onSuccess: (data) => {
      if (data.user) {
        login(data.user)
        setRequires2FA(false)
        navigate('/dashboard')
      }
    },
  })

  const error = mutation.error
    ? isApiError(mutation.error)
      ? mutation.error.response?.data?.message || 'Invalid verification code'
      : 'An unexpected error occurred'
    : null

  // Extract attempts remaining from error response
  const attemptsRemaining = mutation.error && isApiError(mutation.error)
    ? (mutation.error.response?.data as any)?.attemptsRemaining ?? null
    : null

  return {
    verify: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    attemptsRemaining,
  }
}
```

### Step 7: Create 2FA Verify Page (1 hour)

Create `src/pages/auth/2fa-verify.tsx`:

```tsx
import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { CodeInput } from '@/features/auth/components/code-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { use2FAVerify } from '@/features/auth/hooks/use-2fa-verify'

type Mode = 'totp' | 'backup'

export default function TwoFactorVerifyPage(): JSX.Element {
  const { requires2FA, pendingEmail } = useAuthStore()
  const { verify, isLoading, error, attemptsRemaining } = use2FAVerify()

  const [mode, setMode] = useState<Mode>('totp')
  const [code, setCode] = useState('')
  const [backupCode, setBackupCode] = useState('')

  // Redirect if not in 2FA flow
  if (!requires2FA || !pendingEmail) {
    return <Navigate to="/auth/login" replace />
  }

  const handleVerify = (): void => {
    const codeToVerify = mode === 'totp' ? code : backupCode.replace(/\s/g, '')
    verify(codeToVerify)
  }

  return (
    <AuthCard title="Two-factor authentication" showLogo>
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
          to="/auth/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </AuthCard>
  )
}
```

### Step 8: Update Login Hook for 2FA (15 minutes)

Update `src/features/auth/hooks/use-login.ts`:

```typescript
// In onSuccess handler:
onSuccess: (data: AuthResponse) => {
  // Check if 2FA is required
  if (data.requires2FA && data.email) {
    setRequires2FA(true, data.email)
    navigate('/auth/2fa-verify')
    return
  }

  // Normal login success
  if (data.user && data.accessToken) {
    setUser(data.user)
    navigate('/dashboard')
  }
},
```

### Step 9: Add Route (5 minutes)

Add to `src/App.tsx`:

```tsx
import TwoFactorVerifyPage from './pages/auth/2fa-verify'

// In Routes:
<Route path="/auth/2fa-verify" element={<TwoFactorVerifyPage />} />
```

---

## Todo List

- [x] Create Dialog component (shadcn/ui)
- [x] Update auth API with 2FA endpoints
- [x] Add 2FA types
- [x] Create use2FASetup hook
- [x] Create use2FAVerify hook
- [x] Create TwoFactorSetupModal component
- [x] Create BackupCodesDisplay component
- [x] Create 2FA verify page
- [x] Update login hook for 2FA flow
- [x] Add 2FA verify route
- [x] Test QR code display
- [x] Test code verification
- [x] Test backup codes download
- [x] Test login with 2FA
- [x] Test backup code login

---

## Success Criteria

- [x] 2FA setup modal shows QR code
- [x] Manual entry code can be copied
- [x] TOTP verification works
- [x] Backup codes displayed and downloadable
- [x] Must confirm saving codes to complete
- [x] Login redirects to 2FA if enabled
- [x] 2FA verification completes login
- [x] Backup code works as alternative

---

## Security Considerations

- QR code only shown once per setup
- Backup codes displayed once, user must save
- Backup codes consumed on use
- TOTP codes valid for short window
- Rate limiting on verification attempts

---

## Next Steps

After completion:
1. Move to Phase 7: Route Guards
2. Implement protected route wrapper
3. Add 2FA settings to profile page
