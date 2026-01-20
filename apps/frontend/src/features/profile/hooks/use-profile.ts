import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { isApiError } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'

/**
 * Hook for managing user profile data
 * Provides profile query and update mutation with optimistic updates
 */
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
        variant: 'success',
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
