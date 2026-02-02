/**
 * User role enumeration
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PREMIUM = 'premium',
}

/**
 * Core user interface - single source of truth for all apps
 */
export interface IUser {
  id: string
  email: string
  username?: string
  name: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  roles: UserRole[]
  timezone: string
  currency: string
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * User type alias for convenience
 */
export type User = IUser

/**
 * User preferences for notifications and settings
 */
export interface IUserPreferences {
  userId: string
  notificationEnabled: boolean
  telegramChatId?: string
  telegramUsername?: string
  language: string
  dailySummaryTime: string
  weeklyReportDay: string
  transactionAlertThreshold: number
  preferences: Record<string, unknown>
}

/**
 * Notification preferences subset
 */
export interface INotificationPreferences {
  email: boolean
  push: boolean
  budgetAlerts: boolean
  transactionAlerts: boolean
  weeklyReport: boolean
}

/**
 * Alias for backwards compatibility
 */
export type NotificationPreferences = INotificationPreferences

/**
 * Extended user profile with UI-specific fields
 */
export interface IUserProfile extends IUser {
  phone?: string
  language: string
  notificationPreferences: INotificationPreferences
}

/**
 * Alias for backwards compatibility
 */
export type UserProfile = IUserProfile
