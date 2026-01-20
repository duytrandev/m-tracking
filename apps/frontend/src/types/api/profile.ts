import type { UserProfile, NotificationPreferences } from '../entities'

/**
 * Get profile response
 */
export interface GetProfileResponse {
  profile: UserProfile
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  name?: string
  phone?: string
  language?: string
  currency?: string
  timezone?: string
  avatar?: string
}

/**
 * Update profile response
 */
export interface UpdateProfileResponse {
  profile: UserProfile
  message: string
}

/**
 * Update notification preferences request
 */
export interface UpdateNotificationPreferencesRequest {
  preferences: Partial<NotificationPreferences>
}

/**
 * Update notification preferences response
 */
export interface UpdateNotificationPreferencesResponse {
  preferences: NotificationPreferences
  message: string
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * Change password response
 */
export interface ChangePasswordResponse {
  message: string
}
