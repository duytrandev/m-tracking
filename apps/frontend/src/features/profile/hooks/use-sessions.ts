import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile-api'
import { useToast } from '@/components/ui/use-toast'
import { isApiError } from '@/lib/api-client'

/**
 * Hook for managing user sessions
 * Provides session list and revocation functionality
 */
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
        variant: 'success',
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
        variant: 'success',
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
