/**
 * User entity representing authenticated user
 */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  roles: string[]
  createdAt?: string
  updatedAt?: string
}

/**
 * User profile with extended information
 */
export interface UserProfile extends User {
  phone?: string
  language: string
  currency: string
  timezone: string
  notificationPreferences: NotificationPreferences
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  email: boolean
  push: boolean
  budgetAlerts: boolean
  transactionAlerts: boolean
  weeklyReport: boolean
}

/**
 * User role enum
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PREMIUM = 'premium',
}
