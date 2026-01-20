# Sentry Error Tracking & Performance Monitoring

> **Last Updated:** January 20, 2026
> **Status:** ✅ Implemented (Backend & Frontend)

## Overview

Sentry provides real-time error tracking and performance monitoring for the M-Tracking application. This document covers setup, configuration, usage, and best practices.

**Integrated Services:**
- ✅ **Backend** (NestJS) - Error tracking, performance monitoring, profiling
- ✅ **Frontend** (Next.js) - Client/server errors, session replay, web vitals
- ⏳ **Analytics** (FastAPI) - Planned for future implementation

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Features](#features)
5. [Privacy & Security](#privacy--security)
6. [Usage Examples](#usage-examples)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Quick Start

### Prerequisites

- Sentry account (free tier available at https://sentry.io)
- Two Sentry projects created:
  - `m-tracking-frontend` (Platform: Next.js)
  - `m-tracking-backend` (Platform: Node.js)

### Setup Steps

**1. Create Sentry Projects**

```bash
# Visit: https://sentry.io
# Create organization: m-tracking
# Create projects and copy DSNs
```

**2. Configure Environment Variables**

Add to root `.env` file:

```bash
# Frontend (public DSN - exposed to client)
NEXT_PUBLIC_SENTRY_DSN=https://[key]@o0.ingest.sentry.io/[id]
NEXT_PUBLIC_APP_ENV=development

# Backend (private DSN - server-only)
SENTRY_DSN=https://[key]@o0.ingest.sentry.io/[id]

# Optional: For source maps upload in production
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=m-tracking
```

**3. Start Services**

```bash
# Backend
cd services/backend
pnpm dev
# Should see: ✅ Sentry initialized for development environment

# Frontend
cd apps/frontend
pnpm dev
# Should see: ✅ Sentry client initialized
```

**4. Verify Integration**

Visit Sentry dashboard to confirm events are being captured.

---

## Architecture

### Project Structure

```
Sentry Organization: m-tracking
├── m-tracking-frontend (Next.js)
│   └── Environments: development, staging, production
└── m-tracking-backend (Node.js)
    └── Environments: development, staging, production
```

**Why Separate Projects:**
- Clear error attribution per service
- Independent alert configurations
- Service-specific error budgets
- Team ownership boundaries

### Data Flow

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ Errors & Performance
       ↓
┌──────────────────┐
│ Sentry Frontend  │
│     Project      │
└──────────────────┘

┌─────────────┐
│   Backend   │
│  (NestJS)   │
└──────┬──────┘
       │ Errors & Performance
       ↓
┌──────────────────┐
│ Sentry Backend   │
│     Project      │
└──────────────────┘
```

### Integration Points

**Backend:**
- `main.ts` - Sentry initialization & middleware
- `http-exception.filter.ts` - 5xx error capture
- `sentry.service.ts` - Manual error tracking
- `sentry.config.ts` - Configuration & PII scrubbing

**Frontend:**
- `sentry.client.config.ts` - Browser error tracking
- `sentry.server.config.ts` - Server Component errors
- `sentry.edge.config.ts` - Edge runtime errors
- `sentry-error-boundary.tsx` - React error boundary
- `api-client.ts` - API error capture

---

## Configuration

### Environment-Based Settings

| Environment | Traces Sample Rate | Features Enabled |
|-------------|-------------------|------------------|
| Development | 100% | All errors, full traces, debug logs |
| Staging | 50% | All errors, sampled traces |
| Production | 10% | All errors, 10% traces, profiling |

### Backend Configuration

**File:** `services/backend/src/shared/sentry/sentry.config.ts`

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'development',
  tracesSampleRate: 1.0,        // 100% in dev
  profilesSampleRate: 1.0,       // CPU profiling
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
    new ProfilingIntegration(),
  ],
  beforeSend: scrubSensitiveData,
  debug: true,
});
```

### Frontend Configuration

**File:** `apps/frontend/sentry.client.config.ts`

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'development',
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,    // 10% of sessions
  replaysOnErrorSampleRate: 1.0,    // 100% on errors
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  beforeSend: scrubSensitiveData,
});
```

---

## Features

### 1. Automatic Error Capture

**Backend:**
- ✅ All 5xx errors automatically captured
- ✅ Unhandled exceptions
- ✅ Promise rejections
- ✅ TypeORM query errors

**Frontend:**
- ✅ React component errors
- ✅ Server Component errors
- ✅ API route errors
- ✅ Client-side JavaScript errors
- ✅ Unhandled promise rejections

### 2. Performance Monitoring

**Tracked Metrics:**
- HTTP request latency (p50, p95, p99)
- Database query performance
- API response times
- Web Vitals (LCP, FID, CLS, TTFB, INP)
- Server-side rendering time

**Backend Example:**
```typescript
const transaction = Sentry.startTransaction({
  name: 'sync-transactions',
  op: 'background.job',
});

try {
  await syncTransactions();
  transaction.setStatus('ok');
} finally {
  transaction.finish();
}
```

### 3. Session Replay

**Frontend Only:**
- Records user sessions when errors occur
- Masks all text and media for privacy
- 10% of normal sessions recorded
- 100% of error sessions recorded

### 4. User Context Tracking

**Automatic Attachment:**
- User ID (anonymized)
- Email (partially scrubbed)
- User role/permissions
- Request metadata

**Example:**
```typescript
// Backend
this.sentryService.setUser({
  id: user.id,
  email: user.email,  // Auto-scrubbed
  username: user.name,
});

// Frontend
Sentry.setUser({
  id: user.id,
  email: user.email,  // Auto-scrubbed
});
```

### 5. Breadcrumbs

Track events leading up to errors:

```typescript
// Backend
this.sentryService.addBreadcrumb({
  category: 'transaction',
  message: 'Transaction categorized',
  level: 'info',
  data: { category: 'food', confidence: 0.95 },
});

// Frontend
Sentry.addBreadcrumb({
  category: 'ui',
  message: 'User clicked Add Transaction',
  level: 'info',
});
```

---

## Privacy & Security

### PII Scrubbing

**Automatically Redacted:**
- ❌ Authorization headers & cookies
- ❌ User emails (partially: `jo***@example.com`)
- ❌ Financial data (amounts, account numbers)
- ❌ Transaction details (merchants, categories)
- ❌ API keys & tokens
- ❌ Passwords & secrets

**Implementation:**
```typescript
function scrubSensitiveData(event: Sentry.Event) {
  // Scrub headers
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
    delete event.request.headers['cookie'];
  }

  // Scrub email
  if (event.user?.email) {
    event.user.email = event.user.email.replace(
      /(.{2}).*(@.*)/,
      '$1***$2'
    );
  }

  // Scrub financial data
  if (event.breadcrumbs) {
    event.breadcrumbs.forEach(b => {
      if ('amount' in b.data) b.data.amount = '[REDACTED]';
    });
  }

  return event;
}
```

### Compliance

- ✅ GDPR compliant (PII scrubbing)
- ✅ No credit card data captured
- ✅ No passwords logged
- ✅ Session replays masked
- ✅ Source maps uploaded securely

---

## Usage Examples

### Backend Manual Error Capture

```typescript
import { SentryService } from '@/shared/sentry/sentry.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly sentryService: SentryService,
  ) {}

  async processTransaction(transaction: Transaction) {
    try {
      // Business logic
      return await this.categorize(transaction);
    } catch (error) {
      // Capture with context
      this.sentryService.captureException(error, {
        transaction: {
          id: transaction.id,
          type: transaction.type,
        },
      });
      throw error;
    }
  }
}
```

### Frontend Error Boundary

```tsx
import { SentryErrorBoundary } from '@/components/shared/sentry-error-boundary';

export default function Layout({ children }) {
  return (
    <SentryErrorBoundary>
      {children}
    </SentryErrorBoundary>
  );
}
```

### Performance Tracking

```typescript
// Backend
const transaction = this.sentryService.startTransaction(
  'sync-plaid-transactions',
  'background.job'
);

try {
  await this.syncFromPlaid();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### Setting Tags & Context

```typescript
// Set tags for filtering
this.sentryService.setTags({
  module: 'transaction',
  operation: 'sync',
  provider: 'plaid',
});

// Set custom context
this.sentryService.setContext('business_operation', {
  operation_type: 'transaction_sync',
  bank_provider: 'plaid',
  sync_mode: 'automatic',
});
```

---

## Troubleshooting

### Common Issues

#### 1. Sentry Not Capturing Errors

**Symptoms:**
- No errors appearing in Sentry dashboard
- Console shows "Sentry DSN not configured"

**Solution:**
```bash
# Check environment variables
echo $SENTRY_DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# Verify DSN format
# Should be: https://[key]@o0.ingest.sentry.io/[project-id]

# Restart services
pnpm dev
```

#### 2. Too Many Events

**Symptoms:**
- Sentry quota exceeded
- Too many duplicate errors

**Solution:**
```typescript
// Adjust sample rates in production
tracesSampleRate: 0.1,  // 10% instead of 100%

// Ignore non-critical errors
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
],
```

#### 3. Source Maps Not Working

**Symptoms:**
- Stack traces show minified code
- Can't identify error location

**Solution:**
```bash
# Frontend: Ensure webpack plugin enabled
# Check next.config.ts:
disableServerWebpackPlugin: false,
disableClientWebpackPlugin: false,

# Backend: Upload manually
cd services/backend
pnpm sentry:sourcemaps
```

#### 4. PII Leaking to Sentry

**Symptoms:**
- Sensitive data visible in Sentry events

**Solution:**
```typescript
// Check beforeSend hook is active
beforeSend(event) {
  // Add logging to verify execution
  console.log('Scrubbing event:', event.event_id);
  return scrubSensitiveData(event);
}

// Test PII scrubbing
const testEvent = { user: { email: 'test@example.com' }};
console.log(scrubSensitiveData(testEvent));
// Should show: te***@example.com
```

---

## Best Practices

### 1. Error Context Enrichment

Always add relevant context to errors:

```typescript
✅ Good:
this.sentryService.captureException(error, {
  transaction: { id: '123', type: 'expense' },
  user_action: 'categorize',
});

❌ Bad:
this.sentryService.captureException(error);
```

### 2. Performance Monitoring

Use spans for expensive operations:

```typescript
✅ Good:
const span = transaction.startChild({
  op: 'db.query',
  description: 'Fetch user transactions',
});
const result = await this.db.query();
span.finish();

❌ Bad:
await this.db.query(); // No tracking
```

### 3. Breadcrumb Usage

Add breadcrumbs before critical operations:

```typescript
✅ Good:
Sentry.addBreadcrumb({
  message: 'Starting Plaid sync',
  data: { accountId: '123' },
});
await syncPlaid();

❌ Bad:
await syncPlaid(); // No context trail
```

### 4. Sampling Strategy

Adjust based on traffic and budget:

```typescript
// Development: 100% (debug everything)
tracesSampleRate: 1.0,

// Staging: 50% (representative sample)
tracesSampleRate: 0.5,

// Production: 10% (cost-effective)
tracesSampleRate: 0.1,
```

### 5. Alert Configuration

Set up alerts for critical errors:

```yaml
Alert Rule: Critical Backend Error
Condition: error.level = fatal OR http.status_code >= 500
Frequency: Any event
Action: Notify #engineering-alerts

Alert Rule: High Error Rate
Condition: error.count > 100 in 5 minutes
Frequency: Change threshold
Action: Page on-call engineer
```

---

## Metrics & Monitoring

### Key Metrics to Track

**Backend:**
- Error rate (target: <0.5%)
- P95 API latency (target: <500ms)
- Database query time (target: <100ms)
- Memory usage
- CPU profiling

**Frontend:**
- Error rate (target: <1%)
- Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
- API error rate
- Session replay capture rate
- Bundle size

### Dashboards

**Recommended Dashboards:**
1. **Overview** - Error counts, performance metrics, user impact
2. **Backend Health** - API latency, database performance, queue depth
3. **Frontend Performance** - Web Vitals, page load times, API errors
4. **User Impact** - Affected users, error trends, session replays

---

## Cost Optimization

### Free Tier Limits

- 5,000 errors/month
- 10,000 performance units/month
- 1 project (need Team plan for 2+ projects)

### Optimization Strategies

1. **Sampling:**
   ```typescript
   // Reduce traces in production
   tracesSampleRate: 0.1,  // 10% instead of 100%
   ```

2. **Filtering:**
   ```typescript
   // Ignore non-actionable errors
   ignoreErrors: [
     'ResizeObserver loop limit exceeded',
     'Network request failed',
   ],
   ```

3. **Rate Limiting:**
   ```typescript
   // Limit duplicate errors
   beforeSend(event) {
     if (isDuplicateError(event)) return null;
     return event;
   }
   ```

### Estimated Costs

| Plan | Price/Month | Events | Performance | Projects |
|------|-------------|--------|-------------|----------|
| Free | $0 | 5K | 10K units | 1 |
| Team | $26 | 50K | 100K units | Unlimited |
| Business | $80 | 100K | 500K units | Unlimited |

---

## Related Documentation

- [Development Guide](./development-guide.md) - General development setup
- [Backend Configuration](./backend-configuration.md) - Backend environment config
- [Frontend Configuration](./frontend-configuration.md) - Frontend environment config
- [Troubleshooting](./troubleshooting.md) - General troubleshooting guide
- [Testing](./testing.md) - Testing strategies

---

## Support & Resources

**Internal:**
- Sentry Dashboard: https://sentry.io/organizations/m-tracking
- Implementation Plan: `/plans/precious-swimming-hennessy.md`

**External:**
- Sentry Docs: https://docs.sentry.io
- Next.js Integration: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- NestJS Integration: https://docs.sentry.io/platforms/node/guides/nestjs/

**Team Contacts:**
- Sentry Admin: [Team Lead]
- On-Call: [PagerDuty rotation]

---

**Version:** 1.0.0
**Last Review:** January 20, 2026
**Next Review:** April 20, 2026
