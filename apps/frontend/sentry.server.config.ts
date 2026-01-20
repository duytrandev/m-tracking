import * as Sentry from '@sentry/nextjs';

/**
 * Sentry server-side configuration for Next.js
 *
 * Initialized on the Node.js server for:
 * - Server Component errors
 * - API Route errors
 * - Server-side rendering errors
 * - Middleware errors
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment detection
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',

    // Sampling rates (100% in development, adjust for production)
    tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.1 : 1.0,

    // Performance monitoring
    integrations: [
      Sentry.httpIntegration(),
    ],

    // Privacy: Scrub sensitive data (same as client)
    beforeSend(event, _hint) {
      // Scrub request headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Partially scrub user email
      if (event.user?.email) {
        const email = event.user.email;
        const [localPart, domain] = email.split('@');
        if (localPart && domain) {
          event.user.email = `${localPart.substring(0, 2)}***@${domain}`;
        }
      }

      // Scrub breadcrumbs with financial data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            if ('amount' in breadcrumb.data) {
              breadcrumb.data.amount = '[REDACTED]';
            }
            if ('accountNumber' in breadcrumb.data) {
              breadcrumb.data.accountNumber = '[REDACTED]';
            }
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Enable debug mode in development
    debug: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  });

  console.log('✅ Sentry server initialized');
} else {
  console.log('⚠️  Sentry DSN not configured - server monitoring disabled');
}
