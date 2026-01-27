import { apiClient } from '@/lib/api-client'
import type { User, SessionInfo, MessageResponse } from '@/types/api/auth'

/**
 * Profile API client
 * Handles all profile-related API calls
 */

export interface UpdateProfileRequest {
  name?: string
  email?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const profileApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me', data)
    return response.data
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await apiClient.post<{ avatarUrl: string }>(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Delete user avatar
   */
  deleteAvatar: async (): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>('/users/me/avatar')
    return response.data
  },

  /**
   * Change user password
   */
  changePassword: async (
    data: ChangePasswordRequest
  ): Promise<MessageResponse> => {
    const response = await apiClient.patch<MessageResponse>(
      '/users/me/password',
      data
    )
    return response.data
  },

  /**
   * Get active sessions
   */
  getSessions: async (): Promise<SessionInfo[]> => {
    const response = await apiClient.get<SessionInfo[]>('/users/me/sessions')
    return response.data
  },

  /**
   * Revoke a specific session
   */
  revokeSession: async (sessionId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(
      `/users/me/sessions/${sessionId}`
    )
    return response.data
  },

  /**
   * Revoke all other sessions
   */
  revokeAllSessions: async (): Promise<MessageResponse> => {
    const response =
      await apiClient.delete<MessageResponse>('/users/me/sessions')
    return response.data
  },
}
