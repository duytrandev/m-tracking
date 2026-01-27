export interface IUser {
  id: string
  email: string
  fullName: string
  emailVerified: boolean
  timezone: string
  currency: string
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

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
