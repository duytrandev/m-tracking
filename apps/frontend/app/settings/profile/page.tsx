'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { AvatarUpload } from '@/features/profile/components/avatar-upload'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { Loader2 } from 'lucide-react'

/**
 * Profile settings page
 * Allows users to update profile picture and personal information
 */
export default function ProfileSettingsPage(): React.ReactElement {
  const { profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentAvatar={profile?.avatar}
            name={profile?.name || 'User'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  )
}
