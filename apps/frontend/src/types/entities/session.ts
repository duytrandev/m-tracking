/**
 * User session representing active login
 */
export interface Session {
  id: string
  userId: string
  userAgent: string
  ipAddress: string
  lastActive: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}
