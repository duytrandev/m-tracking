import * as Sentry from '@sentry/nextjs'

/**
 * Sentry Edge runtime configuration for Next.js
 *
 * Initialized in Edge runtime for:
 * - Edge middleware
 * - Edge API routes
 * - Edge-deployed functions
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment detection
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',

    // Minimal sampling for edge (cost optimization)
    tracesSampleRate: 0.1,

    // Privacy: Lightweight scrubbing for edge
    beforeSend(event) {
      // Scrub sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
      }

      // Scrub user email
      if (event.user?.email) {
        const email = event.user.email
        const [localPart, domain] = email.split('@')
        if (localPart && domain) {
          event.user.email = `${localPart.substring(0, 2)}***@${domain}`
        }
      }

      return event
    },

    // Enable debug mode in development
    debug: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  })

  console.log('✅ Sentry edge initialized')
}
