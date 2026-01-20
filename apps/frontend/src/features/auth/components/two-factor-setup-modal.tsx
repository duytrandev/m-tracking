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
import { use2FASetup } from '../hooks/use-2fa-setup'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle, Copy, Check } from 'lucide-react'

interface TwoFactorSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function TwoFactorSetupModal({
  isOpen,
  onClose,
  onComplete,
}: TwoFactorSetupModalProps): React.ReactElement {
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
    setStep,
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
              <p className="text-sm text-muted-foreground">Can&apos;t scan? Enter this code manually:</p>
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
