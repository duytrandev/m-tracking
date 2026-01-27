'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PasswordChangeForm } from '@/features/profile/components/password-change-form'
import { SessionsList } from '@/features/profile/components/sessions-list'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { Shield, ShieldCheck } from 'lucide-react'

/**
 * Security settings page
 * Manages password, 2FA, and active sessions
 */
export default function SecuritySettingsPage(): React.ReactElement {
  const { user } = useAuthStore()
  // Placeholder for future 2FA setup modal
  const [_show2FASetup, _setShow2FASetup] = useState(false)

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user?.twoFactorEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.twoFactorEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-green-600">
                Two-factor authentication is enabled.
              </p>
              <Button variant="outline">Disable 2FA</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your account with an authenticator app like Google
                Authenticator or Authy.
              </p>
              <Button onClick={() => _setShow2FASetup(true)}>Enable 2FA</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsList />
        </CardContent>
      </Card>
    </div>
  )
}
