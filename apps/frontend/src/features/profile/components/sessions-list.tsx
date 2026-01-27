import { Monitor, Smartphone, Globe, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessions } from '../hooks/use-sessions'
import { formatDistanceToNow } from 'date-fns'
import type { SessionInfo } from '@/types/api/auth'

/**
 * Sessions list component
 * Displays active user sessions with revoke functionality
 */

function getDeviceIcon(userAgent: string): React.ReactElement {
  if (/mobile/i.test(userAgent)) {
    return <Smartphone className="h-5 w-5" />
  }
  return <Monitor className="h-5 w-5" />
}

function getDeviceName(session: SessionInfo): string {
  const { userAgent, platform } = session.deviceInfo

  if (platform) return platform.replace(/"/g, '')
  if (/windows/i.test(userAgent)) return 'Windows'
  if (/mac/i.test(userAgent)) return 'macOS'
  if (/linux/i.test(userAgent)) return 'Linux'
  if (/iphone/i.test(userAgent)) return 'iPhone'
  if (/android/i.test(userAgent)) return 'Android'
  return 'Unknown Device'
}

export function SessionsList(): React.ReactElement {
  const {
    sessions,
    isLoading,
    revokeSession,
    isRevoking,
    revokeAllSessions,
    isRevokingAll,
  } = useSessions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No active sessions found.
      </p>
    )
  }

  const otherSessions = sessions.filter(s => !s.isCurrent)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sessions.map(session => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {getDeviceIcon(session.deviceInfo.userAgent)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getDeviceName(session)}</span>
                  {session.isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  {session.ipAddress}
                  <span>•</span>
                  Last active{' '}
                  {formatDistanceToNow(new Date(session.lastActiveAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeSession(session.id)}
                disabled={isRevoking}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {otherSessions.length > 0 && (
        <Button
          variant="outline"
          onClick={() => revokeAllSessions()}
          disabled={isRevokingAll}
          className="text-destructive hover:text-destructive"
        >
          {isRevokingAll ? 'Signing out...' : 'Sign out of all other sessions'}
        </Button>
      )}
    </div>
  )
}
