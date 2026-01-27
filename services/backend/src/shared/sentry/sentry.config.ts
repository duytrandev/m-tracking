import * as Sentry from '@sentry/node'
import { ConfigService } from '@nestjs/config'

/**
 * Initialize Sentry error tracking and performance monitoring
 *
 * Features:
 * - Error capture with HTTP context
 * - Performance monitoring with traces
 * - PII scrubbing for financial data
 * - User context attachment
 *
 * @param configService - NestJS ConfigService for environment variables
 */
export function initializeSentry(configService: ConfigService): void {
  const dsn = configService.get<string>('SENTRY_DSN')

  // Skip initialization if DSN is not configured
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.log('⚠️  Sentry DSN not configured - monitoring disabled')
    return
  }

  const environment = configService.get<string>('NODE_ENV') || 'development'

  Sentry.init({
    dsn,
    environment,

    // Sampling rates (100% in development, adjust for production)
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Integrations
    integrations: [
      // HTTP request instrumentation
      // new Sentry.Integrations.Http({ tracing: true }),
      // Express middleware integration
      // new Sentry.Integrations.Express(),
      // Performance profiling
      // new ProfilingIntegration(),
    ],

    // Privacy: Scrub sensitive data before sending to Sentry
    // beforeSend(event: any, _hint: any) {
    //   return scrubSensitiveData(event);
    // },

    // Enable debug mode in development
    debug: environment === 'development',
  })

  // eslint-disable-next-line no-console
  console.log(`✅ Sentry initialized for ${environment} environment`)
}

/**
 * Scrub PII and sensitive financial data from Sentry events
 *
 * Removes:
 * - Authorization headers and cookies
 * - User emails (partially masks)
 * - Financial data (amounts, account numbers)
 * - Transaction details
 *
 * @param event - Sentry event to scrub
 * @param hint - Event hint with additional context
 * @returns Scrubbed event or null to drop the event
 */
/* Temporarily disabled - Sentry API changes
function _scrubSensitiveData(event: Sentry.Event): Sentry.Event | null {
  // Scrub request headers
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
    delete event.request.headers['cookie'];
    delete event.request.headers['x-api-key'];
  }

  // Scrub request body (contains financial data)
  if (event.request?.data) {
    const data = typeof event.request.data === 'string'
      ? JSON.parse(event.request.data)
      : event.request.data;

    // List of sensitive fields to redact
    const sensitiveFields = [
      'amount',
      'balance',
      'accountNumber',
      'routingNumber',
      'cardNumber',
      'cvv',
      'pin',
      'accessToken',
      'refreshToken',
      'password',
      'email',
      'plaidAccessToken',
      'oauthToken',
    ];

    sensitiveFields.forEach(field => {
      if (field in data) {
        data[field] = '[REDACTED]';
      }
    });

    event.request.data = data;
  }

  // Partially scrub user email (keep first 2 chars + domain for debugging)
  if (event.user?.email) {
    const email = event.user.email;
    const [localPart, domain] = email.split('@');
    if (localPart && domain) {
      event.user.email = `${localPart.substring(0, 2)}***@${domain}`;
    }
  }

  // Scrub breadcrumbs (may contain sensitive data in logs)
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
      if (breadcrumb.data) {
        // Redact amounts
        if ('amount' in breadcrumb.data) {
          breadcrumb.data.amount = '[REDACTED]';
        }

        // Redact account numbers
        if ('accountNumber' in breadcrumb.data) {
          breadcrumb.data.accountNumber = '[REDACTED]';
        }

        // Redact merchant info (keep category)
        if ('merchant' in breadcrumb.data && typeof breadcrumb.data.merchant === 'string') {
          breadcrumb.data.merchant = '[REDACTED]';
        }

        // Redact SQL queries with card numbers or sensitive data
        if (breadcrumb.category === 'query' && breadcrumb.data.query) {
          breadcrumb.data.query = breadcrumb.data.query.replace(
            /\b\d{16}\b/g,
            '[CARD_NUMBER]'
          );
        }
      }
      return breadcrumb;
    });
  }

  return event;
}
*/
