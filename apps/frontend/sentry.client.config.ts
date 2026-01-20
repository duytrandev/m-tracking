import * as Sentry from '@sentry/nextjs';

/**
 * Sentry client-side configuration for Next.js
 *
 * Initialized in the browser for:
 * - Client Component errors
 * - React error boundaries
 * - User interactions
 * - Session replay
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment detection
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',

    // Sampling rates (100% in development, adjust for production)
    tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% when errors occur

    // Performance monitoring integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,       // Mask all text for privacy
        blockAllMedia: true,     // Block all media (images, videos)
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Privacy: Scrub sensitive data before sending to Sentry
    beforeSend(event, _hint) {
      // Scrub request headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Scrub query parameters with sensitive data
      if (event.request?.query_string && typeof event.request.query_string === 'string') {
        event.request.query_string = event.request.query_string
          .replace(/token=[^&]*/g, 'token=[REDACTED]')
          .replace(/email=[^&]*/g, 'email=[REDACTED]');
      }

      // Partially scrub user email (keep first 2 chars + domain)
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
            // Redact transaction amounts
            if ('amount' in breadcrumb.data) {
              breadcrumb.data.amount = '[REDACTED]';
            }
            // Redact account numbers
            if ('accountNumber' in breadcrumb.data) {
              breadcrumb.data.accountNumber = '[REDACTED]';
            }
            // Redact merchant names (keep category)
            if ('merchant' in breadcrumb.data) {
              breadcrumb.data.merchant = '[REDACTED]';
            }
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Ignore non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /^AbortError/,
      'Network request failed',
      'Failed to fetch',
    ],

    // Enable debug mode in development
    debug: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  });

  console.log('✅ Sentry client initialized');
} else {
  console.log('⚠️  Sentry DSN not configured - client monitoring disabled');
}
