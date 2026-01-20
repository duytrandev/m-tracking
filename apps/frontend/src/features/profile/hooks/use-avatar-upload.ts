import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useToast } from '@/components/ui/use-toast'

/**
 * Hook for managing avatar upload and deletion
 * Provides upload/delete mutations with optimistic UI updates
 */
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
        variant: 'success',
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
        variant: 'success',
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
