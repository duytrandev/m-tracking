import Link from 'next/link'

/**
 * PasswordlessLinks component for alternative authentication methods
 */
export function PasswordlessLinks() {
  return (
    <div className="flex justify-center gap-4 text-sm">
      <Link
        href="/auth/magic-link"
        className="text-primary hover:underline transition-colors"
      >
        Magic Link
      </Link>
      <span className="text-muted-foreground">|</span>
      <Link
        href="/auth/otp"
        className="text-primary hover:underline transition-colors"
      >
        SMS Code
      </Link>
    </div>
  )
}
