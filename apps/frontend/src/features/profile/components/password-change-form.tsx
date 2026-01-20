import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/features/auth/components/password-input'
import { PasswordStrengthIndicator } from '@/features/auth/components/password-strength'
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/features/auth/validations/auth-schemas'
import { profileApi } from '../api/profile-api'
import { useToast } from '@/components/ui/use-toast'
import { isApiError } from '@/lib/api-client'

/**
 * Password change form
 * Allows users to change their password
 */

export function PasswordChangeForm(): React.ReactElement {
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
        variant: 'success',
      })
      reset()
    },
    onError: (error) => {
      toast({
        title: 'Password change failed',
        description: isApiError(error) ? error.response?.data?.message : 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  const newPassword = watch('newPassword')

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
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
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Changing password...' : 'Change Password'}
      </Button>
    </form>
  )
}
