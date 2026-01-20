import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile } from '../hooks/use-profile'
import { useEffect } from 'react'

/**
 * Profile edit form
 * Allows users to update name and email
 */

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

type ProfileInput = z.infer<typeof profileSchema>

export function ProfileForm(): React.ReactElement {
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
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        <p className="text-xs text-muted-foreground">
          Changing your email will require verification.
        </p>
      </div>

      <Button type="submit" disabled={!isDirty || isUpdating}>
        {isUpdating ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
