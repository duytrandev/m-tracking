/**
 * Queue Job Types
 * Defines payload interfaces for different job types
 */

/**
 * Bank sync job payload
 */
export interface BankSyncJobData {
  userId: string;
  accountId: string;
  syncType: 'full' | 'incremental';
}

/**
 * Notification job payload
 */
export interface NotificationJobData {
  userId: string;
  type: 'email' | 'push' | 'telegram';
  templateId: string;
  data: Record<string, unknown>;
}

/**
 * Report generation job payload
 */
export interface ReportJobData {
  userId: string;
  reportType: 'monthly' | 'annual' | 'custom';
  startDate: string;
  endDate: string;
}

/**
 * Analytics job payload
 */
export interface AnalyticsJobData {
  userId: string;
  operation: 'categorize' | 'insights' | 'predictions';
  data: Record<string, unknown>;
}

/**
 * Union type of all job data types
 */
export type JobData =
  | BankSyncJobData
  | NotificationJobData
  | ReportJobData
  | AnalyticsJobData;

/**
 * Job result interface
 */
export interface JobResult {
  success: boolean;
  message?: string;
  data?: unknown;
}
