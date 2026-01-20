# Frontend Phase 8: Profile Management UI

**Duration:** Week 6
**Priority:** Medium
**Status:** Completed (2026-01-16)
**Dependencies:** Phase 7 (Route Guards)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 8](./phase-08-user-profile.md)
- [UI/UX Design - Profile Settings](../../docs/frontend-architecture/authentication-ui-ux-design.md#screen-13-profile-settings)

---

## Overview

Implement user profile management including profile editing, avatar upload, password change, session management, and security settings (2FA toggle).

---

## Key Insights

- Profile changes auto-save with toast confirmation
- Avatar upload with preview before save
- Password change requires current password
- Session list shows all active devices
- Can revoke individual sessions
- 2FA can be enabled/disabled from settings

---

## Requirements

### Functional Requirements
- Profile settings page
- Edit name and email
- Avatar upload with crop/preview
- Password change form
- Active sessions list
- Revoke session functionality
- Enable/disable 2FA
- Language preference (EN/VI)
- Currency preference

### Non-Functional Requirements
- Optimistic updates with rollback
- Image compression before upload
- Session list pagination
- Real-time session updates

---

## Architecture

### Settings Page Structure

```
/settings
├── /profile     - Name, email, avatar
├── /security    - Password, 2FA, sessions
└── /preferences - Language, currency
```

### API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Get Profile | `/users/me` | GET |
| Update Profile | `/users/me` | PATCH |
| Upload Avatar | `/users/me/avatar` | POST |
| Change Password | `/users/me/password` | PATCH |
| Get Sessions | `/users/me/sessions` | GET |
| Revoke Session | `/users/me/sessions/:id` | DELETE |

---

## Related Code Files

### Files to Create

- `src/pages/settings/profile.tsx`
- `src/pages/settings/security.tsx`
- `src/pages/settings/preferences.tsx`
- `src/pages/settings/index.tsx` (layout)
- `src/features/profile/api/profile-api.ts`
- `src/features/profile/hooks/use-profile.ts`
- `src/features/profile/hooks/use-sessions.ts`
- `src/features/profile/hooks/use-avatar-upload.ts`
- `src/features/profile/components/profile-form.tsx`
- `src/features/profile/components/avatar-upload.tsx`
- `src/features/profile/components/password-change-form.tsx`
- `src/features/profile/components/sessions-list.tsx`
- `src/features/profile/components/security-settings.tsx`

### Files to Modify

- `src/components/layout/dashboard-layout.tsx` (settings link)

---

## Implementation Steps

### Step 1: Create Profile API (30 minutes)

Create `src/features/profile/api/profile-api.ts`:

```typescript
import { apiClient } from '@/lib/api-client'
import type { User, SessionInfo, MessageResponse } from '@/features/auth/types/auth-types'

export interface UpdateProfileRequest {
  name?: string
  email?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const profileApi = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },

  // Update profile
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me', data)
    return response.data
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await apiClient.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete avatar
  deleteAvatar: async (): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>('/users/me/avatar')
    return response.data
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.patch<MessageResponse>('/users/me/password', data)
    return response.data
  },

  // Get active sessions
  getSessions: async (): Promise<SessionInfo[]> => {
    const response = await apiClient.get<SessionInfo[]>('/users/me/sessions')
    return response.data
  },

  // Revoke a session
  revokeSession: async (sessionId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/users/me/sessions/${sessionId}`)
    return response.data
  },

  // Revoke all other sessions
  revokeAllSessions: async (): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>('/users/me/sessions')
    return response.data
  },
}
```

### Step 2: Create Profile Hooks (1 hour)

Create `src/features/profile/hooks/use-profile.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi, UpdateProfileRequest } from '../api/profile-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { isApiError } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'

export function useProfile() {
  const { updateUser } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const updateMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      updateUser(data)
      queryClient.setQueryData(['profile'], data)
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: isApiError(error)
          ? error.response?.data?.message
          : 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
```

Create `src/features/profile/hooks/use-sessions.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile-api'
import { useToast } from '@/components/ui/use-toast'
import { isApiError } from '@/lib/api-client'

export function useSessions() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['sessions'],
    queryFn: profileApi.getSessions,
  })

  const revokeMutation = useMutation({
    mutationFn: profileApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast({
        title: 'Session revoked',
        description: 'The session has been signed out.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to revoke session',
        description: isApiError(error)
          ? error.response?.data?.message
          : 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  const revokeAllMutation = useMutation({
    mutationFn: profileApi.revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast({
        title: 'All sessions revoked',
        description: 'All other sessions have been signed out.',
      })
    },
  })

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
    revokeSession: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
    revokeAllSessions: revokeAllMutation.mutate,
    isRevokingAll: revokeAllMutation.isPending,
  }
}
```

Create `src/features/profile/hooks/use-avatar-upload.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useToast } from '@/components/ui/use-toast'

export function useAvatarUpload() {
  const { updateUser } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (data) => {
      updateUser({ avatar: data.avatarUrl })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been changed.',
      })
    },
    onError: () => {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: () => {
      updateUser({ avatar: undefined })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({
        title: 'Avatar removed',
        description: 'Your profile picture has been removed.',
      })
    },
  })

  return {
    uploadAvatar: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteAvatar: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}
```

### Step 3: Create Avatar Upload Component (1 hour)

Create `src/features/profile/components/avatar-upload.tsx`:

```tsx
import { useRef, useState } from 'react'
import { User, Camera, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAvatarUpload } from '../hooks/use-avatar-upload'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  currentAvatar?: string
  name: string
}

export function AvatarUpload({ currentAvatar, name }: AvatarUploadProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { uploadAvatar, isUploading, deleteAvatar, isDeleting } = useAvatarUpload()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    uploadAvatar(file)
  }

  const handleDelete = (): void => {
    if (confirm('Are you sure you want to remove your avatar?')) {
      deleteAvatar()
      setPreview(null)
    }
  }

  const displayAvatar = preview || currentAvatar

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Display */}
      <div className="relative">
        <div className={cn(
          'h-24 w-24 rounded-full overflow-hidden bg-muted',
          'flex items-center justify-center'
        )}>
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-12 w-12 text-muted-foreground" />
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentAvatar ? 'Change' : 'Upload'}
        </Button>

        {currentAvatar && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          JPG, PNG or GIF. Max 5MB.
        </p>
      </div>
    </div>
  )
}
```

### Step 4: Create Profile Form Component (1 hour)

Create `src/features/profile/components/profile-form.tsx`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile } from '../hooks/use-profile'
import { useEffect } from 'react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

type ProfileInput = z.infer<typeof profileSchema>

export function ProfileForm(): JSX.Element {
  const { profile, updateProfile, isUpdating } = useProfile()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
    },
  })

  // Reset form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        email: profile.email,
      })
    }
  }, [profile, reset])

  const onSubmit = (data: ProfileInput): void => {
    updateProfile(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          error={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          error={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Changing your email will require verification.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!isDirty || isUpdating}
        isLoading={isUpdating}
        loadingText="Saving..."
      >
        Save Changes
      </Button>
    </form>
  )
}
```

### Step 5: Create Password Change Form (1 hour)

Create `src/features/profile/components/password-change-form.tsx`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/features/auth/components/password-input'
import { PasswordStrengthIndicator } from '@/features/auth/components/password-strength'
import { changePasswordSchema, type ChangePasswordInput } from '@/features/auth/validations/auth-schemas'
import { profileApi } from '../api/profile-api'
import { useToast } from '@/components/ui/use-toast'
import { isApiError } from '@/lib/api-client'

export function PasswordChangeForm(): JSX.Element {
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      })
      reset()
    },
    onError: (error) => {
      toast({
        title: 'Password change failed',
        description: isApiError(error)
          ? error.response?.data?.message
          : 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  const newPassword = watch('newPassword')

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          error={!!errors.currentPassword}
          {...register('currentPassword')}
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          error={!!errors.newPassword}
          {...register('newPassword')}
        />
        <PasswordStrengthIndicator password={newPassword || ''} />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        isLoading={mutation.isPending}
        loadingText="Changing password..."
      >
        Change Password
      </Button>
    </form>
  )
}
```

### Step 6: Create Sessions List Component (1 hour)

Create `src/features/profile/components/sessions-list.tsx`:

```tsx
import { Monitor, Smartphone, Globe, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessions } from '../hooks/use-sessions'
import { formatDistanceToNow } from 'date-fns'
import type { SessionInfo } from '@/features/auth/types/auth-types'

function getDeviceIcon(userAgent: string): JSX.Element {
  if (/mobile/i.test(userAgent)) {
    return <Smartphone className="h-5 w-5" />
  }
  return <Monitor className="h-5 w-5" />
}

function getDeviceName(session: SessionInfo): string {
  const { userAgent, platform } = session.deviceInfo

  if (platform) return platform.replace(/"/g, '')
  if (/windows/i.test(userAgent)) return 'Windows'
  if (/mac/i.test(userAgent)) return 'macOS'
  if (/linux/i.test(userAgent)) return 'Linux'
  if (/iphone/i.test(userAgent)) return 'iPhone'
  if (/android/i.test(userAgent)) return 'Android'
  return 'Unknown Device'
}

export function SessionsList(): JSX.Element {
  const { sessions, isLoading, revokeSession, isRevoking, revokeAllSessions, isRevokingAll } = useSessions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No active sessions found.
      </p>
    )
  }

  const otherSessions = sessions.filter(s => !s.isCurrent)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {getDeviceIcon(session.deviceInfo.userAgent)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getDeviceName(session)}</span>
                  {session.isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  {session.ipAddress}
                  <span>•</span>
                  Last active {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeSession(session.id)}
                disabled={isRevoking}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {otherSessions.length > 0 && (
        <Button
          variant="outline"
          onClick={() => revokeAllSessions()}
          disabled={isRevokingAll}
          className="text-destructive hover:text-destructive"
        >
          {isRevokingAll ? 'Signing out...' : 'Sign out of all other sessions'}
        </Button>
      )}
    </div>
  )
}
```

### Step 7: Create Settings Pages (1 hour)

Create `src/pages/settings/index.tsx`:

```tsx
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { User, Shield, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNav = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/preferences', label: 'Preferences', icon: Settings },
]

export default function SettingsLayout(): JSX.Element {
  const location = useLocation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:w-48">
          {settingsNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
```

Create `src/pages/settings/profile.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { AvatarUpload } from '@/features/profile/components/avatar-upload'
import { useProfile } from '@/features/profile/hooks/use-profile'

export default function ProfileSettingsPage(): JSX.Element {
  const { profile, isLoading } = useProfile()

  if (isLoading) {
    return <div>Loading...</div>
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
```

Create `src/pages/settings/security.tsx`:

```tsx
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PasswordChangeForm } from '@/features/profile/components/password-change-form'
import { SessionsList } from '@/features/profile/components/sessions-list'
import { TwoFactorSetupModal } from '@/features/auth/components/two-factor-setup-modal'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { Shield, ShieldCheck } from 'lucide-react'

export default function SecuritySettingsPage(): JSX.Element {
  const { user } = useAuthStore()
  const [show2FASetup, setShow2FASetup] = useState(false)

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
                Protect your account with an authenticator app like Google Authenticator or Authy.
              </p>
              <Button onClick={() => setShow2FASetup(true)}>Enable 2FA</Button>
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
          <CardDescription>Manage your active sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsList />
        </CardContent>
      </Card>

      {/* 2FA Setup Modal */}
      <TwoFactorSetupModal
        isOpen={show2FASetup}
        onClose={() => setShow2FASetup(false)}
        onComplete={() => setShow2FASetup(false)}
      />
    </div>
  )
}
```

---

## Todo List

- [x] Create profile API functions
- [x] Create useProfile hook
- [x] Create useSessions hook
- [x] Create useAvatarUpload hook
- [x] Create AvatarUpload component
- [x] Create ProfileForm component
- [x] Create PasswordChangeForm component
- [x] Create SessionsList component
- [x] Create SettingsLayout
- [x] Create ProfileSettingsPage
- [x] Create SecuritySettingsPage
- [x] Create PreferencesSettingsPage
- [x] Add routes for settings
- [x] Test profile update
- [x] Test avatar upload
- [x] Test password change
- [x] Test session management

---

## Success Criteria

- [x] Profile updates saved correctly
- [x] Avatar upload works with preview
- [x] Password change validates current password
- [x] Sessions list shows all devices
- [x] Can revoke individual sessions
- [x] 2FA can be enabled/disabled
- [x] All changes have toast feedback

---

## Next Steps

After completion:
1. Move to Phase 9: Testing & E2E
2. Write comprehensive tests
3. Perform accessibility audit
