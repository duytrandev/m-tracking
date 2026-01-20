export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  budgetAlerts: boolean;
  transactionAlerts: boolean;
  weeklyReport: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  currency: 'USD',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    budgetAlerts: true,
    transactionAlerts: true,
    weeklyReport: false,
  },
};
