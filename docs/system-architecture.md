# System Architecture & Design Decisions

**Project:** M-Tracking - Personal Finance Management Platform
**Version:** 1.1
**Last Updated:** 2026-01-18
**Status:** Active - Recently Refactored

---

## Overview

This document consolidates key architectural decisions, design patterns, and system-wide concerns for M-Tracking. Each decision is documented using Architecture Decision Records (ADRs) format to provide context, rationale, and consequences.

**Related Documentation:**

- [Architecture Overview](./architecture-overview.md) - High-level architecture
- [Backend Architecture](./backend-architecture/index.md) - Backend implementation details
- [Frontend Architecture](./frontend-architecture/index.md) - Frontend implementation details
- [Database Architecture](./database-architecture/index.md) - Database design
- [Infrastructure Architecture](./infrastructure-architecture/index.md) - Deployment strategy

---

## Table of Contents

1. [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
2. [System-Wide Patterns](#system-wide-patterns)
3. [Cross-Cutting Concerns](#cross-cutting-concerns)
4. [Integration Patterns](#integration-patterns)
5. [Security Architecture](#security-architecture)
6. [Performance Optimization](#performance-optimization)

---

## Architecture Decision Records (ADRs)

### ADR-001: Modular Monolith over Microservices

**Status:** ✅ Accepted
**Date:** 2026-01-15
**Deciders:** Architecture Team

#### Context

Need to choose between modular monolith and microservices architecture for MVP scale (10K users).

#### Decision

**Use modular monolith pattern with NestJS**, with clear module boundaries and ability to extract services later.

#### Rationale

**Performance Benefits:**

- 20-50x faster inter-module communication (in-process vs HTTP)
- Sub-millisecond latency for module-to-module calls
- No network serialization overhead

**Cost Benefits:**

- 60% lower infrastructure costs ($48/month vs $150/month)
- Single EC2 instance sufficient for 10K users
- No service mesh or API gateway costs

**Operational Benefits:**

- Simpler deployment (single artifact)
- Easier debugging (single process)
- ACID transactions across domains
- No distributed tracing complexity

**Scalability:**

- Can scale horizontally (multiple instances)
- Clear extraction path to microservices at 50K+ users
- Module boundaries designed for future separation

#### Consequences

**Positive:**

- Faster development velocity
- Lower operational complexity
- Better developer experience
- Strong consistency guarantees

**Negative:**

- Cannot scale modules independently (until extracted)
- Larger deployment unit
- Module boundaries must be enforced through discipline

**Mitigation:**

- Strict module encapsulation (explicit exports)
- Automated tests for module boundaries
- Documentation of extraction strategy

---

### ADR-002: Separate FastAPI Analytics Service

**Status:** ✅ Accepted
**Date:** 2026-01-15
**Deciders:** Architecture Team

#### Context

Need to decide whether AI/LLM operations should be in main NestJS monolith or separate service.

#### Decision

**Create separate FastAPI service** (Port 5000) for all AI/LLM operations.

#### Rationale

**Technical Benefits:**

- Leverage Python's rich AI/ML ecosystem
- Better OpenAI/Anthropic SDK support
- Async/await optimization for I/O-bound LLM calls
- Independent scaling of AI operations

**Operational Benefits:**

- LLM costs easier to monitor separately
- Can cache aggressively without affecting main app
- Failures don't impact core business logic
- Different deployment cadence if needed

**Cost Benefits:**

- 95%+ cache hit rate achievable
- Reduces LLM costs from $500/month to ~$100/month
- Can use spot instances for analytics if needed

#### Consequences

**Positive:**

- Best tool for the job (Python for AI)
- Clear cost attribution
- Isolated failure domain
- Independent scaling

**Negative:**

- Network latency (50-100ms vs <1ms)
- Two languages to maintain
- HTTP client needed

**Mitigation:**

- Cache LLM responses aggressively
- Async/fire-and-forget for non-critical operations
- Circuit breaker pattern for resilience

---

### ADR-003: Supabase over AWS RDS

**Status:** ✅ Accepted
**Date:** 2026-01-15
**Deciders:** Architecture Team

#### Context

Need to choose between self-managed PostgreSQL (AWS RDS) and managed Supabase for database hosting.

#### Decision

**Use Supabase** (managed PostgreSQL) for free tier (development) and Pro tier ($25/month, production).

#### Rationale

**Cost Benefits:**

- Free tier: 500MB DB, 1GB storage (sufficient for dev)
- Pro tier: $25/month vs $70+/month for AWS RDS db.t4g.micro
- No hidden costs (backups, snapshots included)

**Developer Experience:**

- Superior dashboard and tooling
- Built-in connection pooling (PgBouncer)
- Real-time subscriptions built-in
- Instant REST API for prototyping

**Feature Benefits:**

- TimescaleDB extension included (no extra cost)
- pgvector extension included (for AI features)
- Automatic daily backups (7-day retention)
- Point-in-time recovery

**Time-to-Market:**

- 30-minute setup vs 2-4 hours for RDS
- No VPC configuration needed
- No subnet groups or security groups

#### Consequences

**Positive:**

- 28% cost savings ($25 vs $70/month)
- Faster development velocity
- Better monitoring and tooling
- Extensions included

**Negative:**

- Vendor lock-in (Supabase-specific features)
- Less control over database configuration
- Potential migration effort if switching providers

**Mitigation:**

- Use standard PostgreSQL features (avoid Supabase-specific APIs)
- Document migration path to self-hosted PostgreSQL
- Keep connection strings environment-based

---

### ADR-004: Self-Hosted Redis over Managed Redis

**Status:** ✅ Accepted
**Date:** 2026-01-16
**Deciders:** Architecture Team

#### Context

Need to choose between self-hosted Redis via Docker and managed Redis services (Upstash, ElastiCache).

#### Decision

**Use self-hosted Redis via Docker Compose** with two instances (cache + queue).

#### Rationale

**Cost Benefits:**

- Zero cost (runs on same EC2 instance)
- Managed Redis costs $10-20/month minimum
- Saves $120-240/year

**Performance Benefits:**

- Local network latency (<1ms)
- No external API limits
- Full control over configuration

**Operational Simplicity:**

- Docker Compose makes it trivial
- Already running Docker for other services
- No additional accounts or credentials

**Feature Requirements:**

- Only need basic Redis features
- No multi-region replication needed
- No complex clustering required

#### Consequences

**Positive:**

- Significant cost savings
- Minimal latency
- Simple setup

**Negative:**

- Manual backup management
- Single point of failure
- No automatic scaling

**Mitigation:**

- AOF persistence for queue data
- Regular backups via cron
- Monitor memory usage
- Can switch to managed Redis if needed at scale

---

### ADR-005: OpenAPI/Swagger for API Documentation

**Status:** ✅ Accepted
**Date:** 2026-01-16
**Deciders:** Development Team

#### Context

Need standardized API documentation that stays in sync with implementation.

#### Decision

**Use OpenAPI 3.0 with NestJS Swagger module** for automatic API documentation generation.

#### Rationale

**Automation:**

- Documentation generated from code decorators
- Always in sync with implementation
- No manual documentation maintenance

**Standards:**

- OpenAPI is industry standard
- Supported by all API tools
- Easy to generate client SDKs

**Developer Experience:**

- Interactive Swagger UI at `/api/docs`
- Try-it-out functionality
- Clear request/response examples

**Integration:**

- Native NestJS support (@nestjs/swagger)
- Minimal code overhead
- TypeScript type safety

#### Consequences

**Positive:**

- Always up-to-date documentation
- Reduced documentation effort
- Better API discoverability
- Easy client generation

**Negative:**

- Decorators add slight code verbosity
- Initial setup required

**Implementation:**

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('M-Tracking API')
  .setDescription('Personal Finance Management Platform API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

---

### ADR-006: JWT with Short-Lived Access Tokens

**Status:** ✅ Accepted
**Date:** 2026-01-16
**Deciders:** Security Team

#### Context

Need secure authentication mechanism for API access.

#### Decision

**Use JWT with 15-minute access tokens** and 7-day refresh tokens.

#### Rationale

**Security:**

- Short-lived access tokens limit exposure
- Refresh tokens allow long sessions without compromising security
- Token blacklist via Redis for revocation

**Scalability:**

- Stateless authentication (no session store)
- Easy to scale horizontally
- No sticky sessions needed

**Standard:**

- Industry-standard approach
- Well-supported by libraries
- Compatible with mobile apps

#### Consequences

**Positive:**

- Strong security posture
- Scalable architecture
- Standard implementation

**Negative:**

- Refresh token flow adds complexity
- Token blacklist needs Redis storage
- No immediate revocation (15-min window)

**Implementation:**

```typescript
// Access token: 15 minutes
const accessToken = this.jwtService.sign(payload, {
  expiresIn: '15m',
})

// Refresh token: 7 days
const refreshToken = this.jwtService.sign(payload, {
  secret: process.env.JWT_REFRESH_SECRET,
  expiresIn: '7d',
})
```

---

### ADR-007: OAuth 2.1 with AES-256-GCM Token Encryption

**Status:** ✅ Accepted
**Date:** 2026-01-16
**Deciders:** Security Team

#### Context

Need to provide social login (Google, GitHub, Facebook) while securely storing sensitive OAuth tokens.

#### Decision

**Implement OAuth 2.1 with PKCE, auto-link by verified email, and AES-256-GCM token encryption.**

#### Rationale

**Security:**

- OAuth tokens encrypted at rest using AES-256-GCM
- PKCE prevents authorization code interception
- Only auto-link if email verified by provider
- Short-lived access tokens, encrypted refresh tokens

**User Experience:**

- Seamless social login (one-click authentication)
- Auto-linking by verified email (prevents duplicate accounts)
- Account linking/unlinking capability

**Compliance:**

- Follows OAuth 2.1 best practices
- No plaintext tokens in database
- Enables future regulatory compliance (GDPR, etc.)

#### Consequences

**Positive:**

- Industry-standard OAuth 2.1 implementation
- Encrypted token storage (defense-in-depth)
- Seamless authentication experience
- Reduced security incidents vs password-only

**Negative:**

- Encryption key management required
- Additional complexity in token lifecycle
- Provider-dependent features (varies per OAuth provider)

**Implementation:**

```typescript
// Encrypt OAuth tokens
const encrypted = EncryptionUtil.encrypt(accessToken)

// Decrypt when needed
const plaintext = EncryptionUtil.decrypt(encrypted)

// Auto-link only if email verified
if (profile.emailVerified) {
  const user = await this.findByEmail(profile.email)
  if (user) return user // Auto-link
}
```

---

### ADR-009: Frontend Authentication System with In-Memory Token Management

**Status:** ✅ Accepted & Implemented
**Date:** 2026-01-16
**Deciders:** Frontend Team

#### Context

Need secure, performant authentication on frontend with seamless token refresh and multi-factor support.

#### Decision

**Implement frontend authentication with in-memory access token storage, auto-refresh mechanism, and comprehensive OAuth/2FA support.**

#### Rationale

**Security:**

- Access tokens stored in-memory (not vulnerable to XSS via localStorage)
- Refresh tokens in httpOnly cookies (not accessible to JavaScript)
- Auto-refresh before expiry (15-minute window)
- Secure logout via token blacklisting

**Performance:**

- In-memory storage provides instant access (<1ms)
- Auto-refresh prevents unnecessary re-authentication
- Optimistic UI updates for faster UX
- Minimal re-renders via Zustand state management

**User Experience:**

- Seamless authentication across app
- One-click OAuth (Google, GitHub, Facebook)
- Optional 2FA for security-conscious users
- Profile customization (language, currency)

#### Consequences

**Positive:**

- Strong security posture (tokens not in localStorage)
- Fast authentication checks
- Standard OAuth 2.1 flows
- Comprehensive feature set

**Negative:**

- Token lost on page refresh (acceptable for SPA, state persisted via refresh token)
- Requires secure refresh token exchange
- Multiple components must coordinate state

**Implementation Status:**

```typescript
// Frontend auth store (Zustand)
const useAuthStore = create<AuthState>(set => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  requires2FA: false,

  // Auto-refresh every 15 minutes
  startAutoRefresh: () => {
    setInterval(
      async () => {
        const newToken = await refreshAccessToken()
        set({ accessToken: newToken })
      },
      15 * 60 * 1000
    )
  },

  // Logout with token blacklist
  logout: async () => {
    await blacklistToken(accessToken)
    set({ accessToken: null, user: null, isAuthenticated: false })
  },
}))
```

---

### ADR-008: 4-Tier Caching Strategy for LLM Categorization

**Status:** ✅ Accepted
**Date:** 2026-01-15
**Deciders:** Architecture Team

#### Context

Need to minimize expensive LLM API calls for transaction categorization.

#### Decision

**Implement 4-tier caching strategy** to achieve 95%+ cache hit rate.

#### Rationale

**Cost Optimization:**

- Tier 1 (Redis): Instant lookup, 80% hit rate
- Tier 2 (User History): Personal patterns, 10% hit rate
- Tier 3 (Global DB): Crowd-sourced, 5% hit rate
- Tier 4 (LLM API): Last resort, 5% usage

**Impact:**

- Reduces LLM costs from $500/month to ~$100/month (80% savings)
- 10K users × 50 transactions/month × $0.001/call = $500/month
- With 95% cache hit rate: 10K × 50 × 0.05 × $0.001 = $25/month (+ overhead)

**Performance:**

- Instant response for cached items (<10ms)
- No user-facing latency for 95% of requests

#### Consequences

**Positive:**

- Massive cost savings (80% reduction)
- Excellent user experience (fast responses)
- System learns over time (higher hit rates)

**Negative:**

- Complex caching logic
- Cache invalidation challenges
- Redis memory usage

**Implementation:**

```typescript
async categorize(transaction: Transaction): Promise<Category> {
  // Tier 1: Redis cache
  const cached = await this.redis.get(`cat:${merchant}`);
  if (cached) return cached;

  // Tier 2: User history
  const userHistory = await this.findUserHistory(userId, merchant);
  if (userHistory) return this.cache(merchant, userHistory);

  // Tier 3: Global database
  const globalMapping = await this.findGlobalMapping(merchant);
  if (globalMapping) return this.cache(merchant, globalMapping);

  // Tier 4: LLM API
  const llmResult = await this.callLLM(transaction);
  return this.cache(merchant, llmResult);
}
```

---

### ADR-010: Frontend Bundle Analysis & Performance Monitoring

**Status:** ✅ Accepted & Implemented
**Date:** 2026-01-21
**Deciders:** Frontend Team
**Phase:** Phase 01 Complete

#### Context

Need systematic approach to measure and reduce frontend bundle size. Current estimated bundle: 500KB+ (Recharts 150KB + jsPDF 200KB + overhead).

#### Decision

**Implement @next/bundle-analyzer with two analysis modes (Webpack + Turbopack) and establish baseline metrics before optimization.**

#### Rationale

**Performance Tooling:**

- Webpack analyzer: Traditional setup with visual reports, compatible with most environments
- Turbopack analyzer: Next.js 16+ experimental, works reliably, accessible via CLI
- Environment-gated analysis: Only runs with `ANALYZE=true`, zero production impact

**Measurable Baselines:**

- Document current bundle composition (top 10 largest modules)
- Identify jsPDF unused (confirmed: 200KB zombie dependency)
- Baseline: 500KB → Target: 80-120KB (70% reduction over 4 phases)

**Optimization Path:**

- Phase 02: Code-split Recharts, remove jsPDF
- Phase 03: Migrate routes to Server Components
- Phase 04: Optimize provider architecture

#### Consequences

**Positive:**

- Concrete metrics for optimization impact
- Visual bundle composition feedback
- Prevents bundle bloat regressions
- Clear success criteria (80-120KB target)

**Negative:**

- Requires npm script management (2 commands)
- PostCSS incompatibility with Webpack mode (documented, use Turbopack instead)

**Mitigation:**

- Document both analyzer modes with trade-offs
- Use Turbopack mode as primary (more reliable)
- Set up CI checks to alert on bundle size increases

#### Implementation

**Scripts:**

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build --webpack",
    "analyze:turbopack": "next experimental-analyze"
  }
}
```

**Configuration:**

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withSentryConfig(
  withBundleAnalyzer(withNextIntl(nextConfig)),
  sentryWebpackPluginOptions
)
```

**Baseline Metrics (Completed 2026-01-21):**

- Total client bundle: ~500KB (estimated)
- Recharts: ~150KB (dashboard charts, no code-split)
- jsPDF: ~200KB (identified as unused - zombie dependency)
- Other deps: ~100KB
- Route rendering: 100% client-side (all routes marked CSR)
- Target reduction: 70% (500KB → 80-120KB)

**Optimization Wins (Actual Phase 02 Complete):**

1. ✅ Remove jsPDF: -200KB (confirmed unused in codebase)
2. ✅ Code-split Recharts: -150KB (deferred to lazy chunk on toggle)
3. ⏳ Server Components: -80KB hydration overhead (Phase 03)
4. ⏳ Provider optimization: -20KB nesting reduction (Phase 04)

---

### ADR-011: Dynamic Code-Splitting for Heavy Libraries (Phase 02)

**Status:** ✅ Implemented & Verified
**Date:** 2026-01-21
**Deciders:** Frontend Performance Team
**Phase:** Phase 02 - Code-Split Heavy Libraries

#### Context

Initial bundle size (~500KB) included heavy libraries loaded eagerly:

- Recharts: ~150KB (charting library, only shown on dashboard toggle)
- jsPDF: ~200KB (identified as completely unused - zombie dependency)

#### Decision

**Implement dynamic/lazy imports with loading skeletons for heavy dependencies.**

#### Rationale

**Immediate Impact (70% of Phase 02 target):**

- Remove jsPDF from bundle: -200KB (zombie dependency, confirmed unused)
- Defer Recharts to lazy chunk: -150KB (only loaded when dashboard charts toggled)
- Combined reduction: 350KB from initial bundle load
- Loading time: <2s after toggle (acceptable UX)

**Architecture Benefits:**

- Lazy chunks only fetch when user explicitly toggles charts
- Skeleton component provides visual feedback during loading
- Server-side rendering disabled (ssr: false) for chart components
- No layout shift during loading (skeleton maintains height)

**Code Quality:**

- Components use both named + default exports (for dynamic + direct import compatibility)
- Single ChartSkeleton component reused across lazy components
- Clear pattern for future lazy-loading opportunities

#### Consequences

**Positive:**

- 350KB bundle reduction (achieving 70% of 500KB target)
- Faster initial page load (critical for user experience)
- jsPDF zombie dependency eliminated
- Clear precedent for other heavy libraries
- Lazy chunks cached for repeat visits

**Negative:**

- Slight delay (~200-500ms) when toggling charts for first time
- Additional network request for lazy chunk
- Storage overhead for multiple chunks

**Mitigation:**

- ChartSkeleton prevents perceived jank
- Next.js automatic preloading on hover/interaction
- Chunks cached in browser (repeat visits are instant)

#### Implementation

**Files Created:**

- `apps/frontend/src/components/ui/chart-skeleton.tsx` - Loading state component

**Files Modified:**

- `apps/frontend/app/dashboard/page.tsx` - Dynamic imports with loading states
- `apps/frontend/src/features/spending/components/spending-chart.tsx` - Default export
- `apps/frontend/src/features/spending/components/category-breakdown.tsx` - Default export
- `apps/frontend/package.json` - Removed jsPDF dependency

**Code Pattern:**

```typescript
import dynamic from 'next/dynamic'
import { ChartSkeleton } from '@/components/ui/chart-skeleton'

// Dynamic import with loading state
const SpendingChart = dynamic(
  () => import('@/features/spending/components/spending-chart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={300} />
  }
)
```

**Metrics (Phase 02 Complete):**

- Initial bundle: 500KB → ~350KB (30% reduction in this phase)
- jsPDF: Removed entirely (verified unused)
- Recharts: Moved to separate lazy chunk
- Tests: 64/64 passing
- Bundle analysis: Recharts no longer in main client bundle
- Load time improvement: Dashboard renders faster initially

**Validation:**

- ✅ Charts load within 2s of toggle
- ✅ No console errors during lazy loading
- ✅ Skeleton displays correctly during loading
- ✅ Bundle analysis confirms Recharts in separate chunk
- ✅ All 64 tests passing after changes
- ✅ No TypeScript errors

---

### ADR-012: shadcn/ui Component Library for Frontend

**Status:** ✅ Accepted & Implementing
**Date:** 2026-01-21
**Deciders:** Frontend Team

#### Context

Need UI component library that is accessible, customizable, and maintainable for Next.js application.

#### Decision

**Use shadcn/ui (Radix UI primitives + Tailwind CSS) for all frontend UI components.**

#### Rationale

**Accessibility:**

- Radix UI provides production-grade accessible components
- WCAG 2.1 AA compliance built-in
- Proper ARIA labels, roles, and keyboard navigation
- Screen reader optimized
- Mobile touch interaction support

**Flexibility:**

- Components are composable, not opinionated
- Full control via Tailwind CSS customization
- Easy to implement design system variations
- Components can be modified without library updates

**Developer Experience:**

- Copy-paste components (no npm dependency bloat)
- TypeScript support with proper types
- Clear, well-documented API
- Active community and support
- Easy to extend for custom needs

**Maintenance:**

- No version conflicts across monorepo
- Single source of truth for each component
- Easy to audit component code
- Type-safe props and children

#### Consequences

**Positive:**

- High-quality, accessible components
- Complete control over component code
- No dependency version management
- Excellent TypeScript support

**Negative:**

- Manual component updates needed if Radix changes
- No automatic security patches
- Must maintain component code ourselves
- Larger codebase for UI components

**Mitigation:**

- Regular audits of Radix UI updates
- Documentation of component patterns
- Strict code review process for UI changes
- Component test coverage requirements

#### Components

**Currently Installed:**

- `Button` - Reusable button with variants
- `Input` - Form input with validation
- `DropdownMenu` - Accessible dropdown menu (Phase 01 - Sidebar User Menu)
- `ThemeToggle` - Dark mode toggle (4 variants)

**Installation Pattern:**

```bash
npx shadcn-ui@latest add {component-name}
```

**Component Location:**

```
apps/frontend/src/components/ui/
├── button.tsx
├── input.tsx
├── dropdown-menu.tsx
├── theme-toggle.tsx
└── [future components]
```

---

## System-Wide Patterns

### Communication Patterns

**Within NestJS Monolith:**

```typescript
// Direct service injection (in-process)
constructor(
  private readonly budgetService: BudgetService,
  private readonly transactionService: TransactionService,
) {}

// Direct function call (<1ms)
await this.budgetService.updateSpending(userId, amount);
```

**NestJS → FastAPI:**

```typescript
// HTTP client (50-100ms)
const category = await this.analyticsClient.post('/categorize', {
  merchant: transaction.merchant,
  amount: transaction.amount,
})
```

**Async Operations:**

```typescript
// Redis + BullMQ for background jobs
await this.queue.add('sync-bank-transactions', {
  userId,
  accountId,
})
```

### Error Handling Pattern

**Global Exception Filter:**

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
```

### Logging Pattern

**Structured Logging:**

```typescript
this.logger.log('Transaction created', {
  userId,
  transactionId,
  amount,
  merchant,
  timestamp: new Date().toISOString(),
})
```

---

## Cross-Cutting Concerns

### Authentication & Authorization

**AuthGuard (JWT):**

- Applied to all protected routes
- Validates JWT token
- Extracts user from token
- Injects user into request

**Rate Limiting:**

- 100 requests/minute (authenticated users)
- 20 requests/minute (public endpoints)
- Redis-based counters

### Validation & Sanitization

**Global Validation Pipe:**

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
```

### CORS Configuration

**Environment-Based CORS:**

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})
```

### Monitoring & Observability

**Error Tracking (Sentry):**

- Real-time error capture for Backend and Frontend
- Performance monitoring and profiling
- User session replay on errors
- Automatic PII scrubbing for privacy

**Backend Integration:**

```typescript
// Automatic 5xx error capture
@Catch()
export class HttpExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (status >= 500) {
      Sentry.captureException(exception, {
        contexts: { http: { method, url, status } },
      })
    }
  }
}
```

**Frontend Integration:**

```typescript
// Error boundary with automatic reporting
<SentryErrorBoundary>
  {children}
</SentryErrorBoundary>

// API error capture
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (![401, 403].includes(error.response.status)) {
      Sentry.captureException(error);
    }
    return Promise.reject(error);
  }
);
```

**Key Features:**

- ✅ 100% error capture in development
- ✅ 10% trace sampling in production (cost optimization)
- ✅ Privacy-first: PII scrubbing (emails, financial data)
- ✅ User context attachment for debugging
- ✅ Performance metrics (P50, P95, P99)
- ✅ Session replay for error reproduction

**See:** [Sentry Monitoring Guide](./monitoring-sentry.md) for complete documentation.

---

## Integration Patterns

### External API Integration

**Pattern:** Client wrapper with retry logic

```typescript
export class PlaidClient {
  async getTransactions(accessToken: string): Promise<Transaction[]> {
    try {
      return await this.plaidApi.getTransactions({
        access_token: accessToken,
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      })
    } catch (error) {
      if (this.isRetryable(error)) {
        return this.retryWithBackoff(() => this.getTransactions(accessToken))
      }
      throw error
    }
  }
}
```

### Webhook Handling

**Pattern:** Idempotent webhook processing

```typescript
@Post('webhooks/plaid')
async handlePlaidWebhook(@Body() dto: PlaidWebhookDto) {
  const processed = await this.checkIfProcessed(dto.webhookId);
  if (processed) return { status: 'already_processed' };

  await this.processWebhook(dto);
  await this.markAsProcessed(dto.webhookId);

  return { status: 'processed' };
}
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Network**

- AWS Security Groups
- HTTPS only (TLS 1.3)
- No direct database access

**Layer 2: Application**

- JWT authentication
- Rate limiting
- Input validation
- CORS restrictions

**Layer 3: Data**

- Password hashing (bcrypt)
- Parameterized queries
- Sensitive data encryption

### Secrets Management

**Environment Variables:**

- Never committed to Git
- Stored in .env files (gitignored)
- Loaded via ConfigService

**Production Secrets:**

- AWS Secrets Manager (future)
- Rotation policy (90 days)

---

## Performance Optimization

### Database Optimization

**Indexing Strategy:**

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Transaction queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);

-- Composite index for common query
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, date DESC);
```

**Connection Pooling:**

- PgBouncer (Supabase built-in)
- Pool size: 10 connections per service
- Connection timeout: 30 seconds

### Caching Strategy

**Redis Usage:**

- Session storage (TTL: 7 days)
- API response caching (TTL: varies)
- Rate limit counters (TTL: 1 minute)
- LLM categorization cache (TTL: 90 days)

### Query Optimization

**Use TypeORM Query Builder:**

```typescript
const transactions = await this.repository
  .createQueryBuilder('transaction')
  .where('transaction.userId = :userId', { userId })
  .andWhere('transaction.date >= :startDate', { startDate })
  .orderBy('transaction.date', 'DESC')
  .limit(100)
  .getMany()
```

---

## Monitoring & Observability

### Logging Levels

- **ERROR**: System errors, exceptions
- **WARN**: Degraded performance, retries
- **INFO**: Significant events (user login, transaction created)
- **DEBUG**: Detailed information (development only)

### Metrics to Track

**Business Metrics:**

- Active users
- Transactions created
- Bank accounts connected
- Budgets created

**Technical Metrics:**

- API response time (p50, p95, p99)
- Database query time
- Cache hit rate
- Error rate
- Request rate

**Cost Metrics:**

- LLM API calls
- Database storage
- Bandwidth usage

---

## Future Architecture Evolution

### 10K Users (Current)

- Single EC2 instance
- Docker Compose
- Monolithic architecture

### 25K Users

- 2x EC2 instances
- Application Load Balancer
- Same architecture (horizontal scaling)

### 50K Users

- 4x EC2 instances
- Consider extracting Banking service (if bottleneck)
- Read replicas for database

### 100K+ Users

- Extract to microservices:
  1. Analytics (already separate)
  2. Banking (high latency, independent scaling)
  3. Transactions (highest traffic)
- Kubernetes on EKS
- Multi-region deployment

---

## Frontend Theme System (v0.3.0)

### Theme Provider Implementation

**Status:** ✅ Implemented
**Date:** 2026-01-20
**Review Score:** 8.5/10

#### Decision

**Implement frontend theme system with:**

- FOUC prevention via inline script
- System preference detection
- localStorage persistence with error handling
- Zustand state management
- Custom React hooks for consumption

#### Rationale

**User Experience:**

- No theme flickering on page load (FOUC prevention)
- Respects OS dark mode preference
- Theme persists across sessions
- Works offline without backend API

**Developer Experience:**

- Simple useTheme() hook API
- Type-safe theme management
- Easy to extend for future backend sync
- Clear error handling

**Technical Benefits:**

- Inline script prevents rendering delays
- Safe localStorage wrapper handles errors
- Zustand persist middleware for automatic hydration
- Media query listener for system preference changes

#### Consequences

**Positive:**

- Zero FOUC, instant theme application
- Offline-first (works without backend initially)
- Respects user OS preference
- Graceful degradation on errors

**Negative:**

- Requires inline script (CSP consideration)
- Future server sync will need migration logic
- localStorage quota must be monitored

#### Implementation Details

**Components:**

1. **theme-script.ts**: FOUC prevention
   - Runs in `<head>` before React
   - Reads localStorage, applies theme class
   - Detects system preference fallback
   - Error handling (quota exceeded, private browsing)

2. **useUIStore (Zustand)**:
   - Theme state: 'light' | 'dark' | 'system'
   - Resolved theme: 'light' | 'dark'
   - Persist middleware for automatic storage
   - Safe localStorage wrapper

3. **useTheme() Hook**:
   - Get/set theme
   - Listen for system preference changes
   - Return isDark flag
   - Type-safe API

4. **ThemeProvider Component**:
   - Initializes theme on mount
   - Placeholder for future server sync
   - Wrapped in error boundary

#### File Structure

```
src/
├── lib/store/
│   └── ui-store.ts (theme state + safe localStorage)
├── hooks/
│   └── use-theme.ts (theme consumption hook)
├── features/preferences/
│   ├── utils/
│   │   └── theme-script.ts (FOUC prevention)
│   └── components/
│       ├── theme-provider.tsx (provider)
│       └── theme-error-boundary.tsx (resilience)
└── app/
    ├── layout.tsx (script injection + provider)
    └── providers.tsx (provider setup)
```

#### Features

- ✅ FOUC prevention (instant theme application)
- ✅ System preference detection (prefers-color-scheme)
- ✅ localStorage persistence (with quota handling)
- ✅ Theme sync across browser tabs
- ✅ Error boundary for resilience
- ✅ TypeScript support
- ✅ 83.33% test coverage

#### Future Enhancements

When backend is ready:

1. Add endpoint: `GET /api/auth/me` (includes user.preferences.theme)
2. Add endpoint: `PATCH /api/auth/preferences` (update theme)
3. Implement server-side sync in ThemeProvider
4. Handle conflict resolution (server vs localStorage)
5. Add theme scheduling (light at day, dark at night)

---

## Frontend Animation System (Motion Library)

### Motion Library Integration (v0.2.1)

**Status:** ✅ Implemented
**Date:** 2026-01-20
**Rationale:** Modern UX requires smooth 60fps animations with accessibility support

#### Decision

- **Use Framer Motion v12.27.1** for performant, accessible animations
- **LazyMotion** for optimized bundle size (tree-shake unused features)
- **Context-based MotionProvider** for centralized configuration
- **useReducedMotion hook** for respecting user accessibility preferences

#### Implementation

**Key Components:**

1. **MotionProvider**: Context wrapper for animation configuration
   - Disables animations based on prefers-reduced-motion
   - Centralizes animation settings

2. **useReducedMotion Hook**: Accessibility utility
   - Returns true if user prefers reduced motion
   - Used in all animation components

3. **Animated Components**:
   - FormField: Entrance animations, layout shift prevention
   - Input: Success state animations, focus transitions
   - Button: Hover/press scale animations
   - Modal: Fade + slide animations

#### Performance Benefits

- LazyMotion reduces bundle size by ~40KB (gzip)
- 60fps animations on modern browsers
- GPU-accelerated transforms (scale, opacity)
- Minimal layout shifts during animations

#### Accessibility

- ✅ WCAG 2.2 AA compliance
- ✅ prefers-reduced-motion support
- ✅ Enhanced focus indicators (2px + 2px offset)
- ✅ ARIA live regions for validation feedback
- ✅ Keyboard navigation preserved

#### Usage Pattern

```typescript
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from 'framer-motion';

export function AnimatedButton({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={!shouldReduceMotion ? { scale: 1.05 } : {}}
      whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
    >
      {children}
    </motion.button>
  );
}
```

---

## Phase 0: Configuration Fixes (Complete - 2026-01-21)

### Status

✅ **Complete** - All 146 TypeScript errors resolved

### Key Improvements

**Docker Secrets Management:**

- Pattern: `.env.docker` for local development secrets
- Contains: POSTGRES_PASSWORD, REDIS_PASSWORD, JWT secrets
- Never committed to Git (.gitignore enforced)
- Example: `.env.docker.example` provided as template
- Developers copy example and populate with local values

**TypeScript Configuration:**

- Strict module resolution enabled
- All DTOs/entities use `!` assertion for property initialization
- Error types properly cast in catch blocks: `error as Error`
- Request parameters typed with explicit interfaces

**Testing Infrastructure:**

- Jest preset created: `jest.preset.js`
- Workspace configuration for multi-package testing
- Backend and frontend tests isolated
- Coverage tracking enabled

**Dependency Management:**

- ESLint dependencies installed and configured
- husky@9 for pre-commit hooks
- lint-staged@16 for staged file linting
- concurrently@9 for parallel task execution
- @types/node@22 for Node.js type definitions

**NX Caching:**

- Output caching optimized
- Incremental builds enabled
- Reduced build times for dependencies

**Source Code Refactoring:**

- 28 backend files fixed (DTOs, entities, controllers, services)
- All null/undefined assignments eliminated
- TypeScript strict mode compliance: 100%

### Files Modified

- 8 configuration files (tsconfig, jest, eslint, docker-compose)
- 2 new files (.env.docker.example, jest.preset.js)
- 28 backend source files (all TS errors resolved)

---

## References

- [Architecture Overview](./architecture-overview.md)
- [Backend Architecture](./backend-architecture/index.md)
  - [OAuth 2.1 Social Login](./backend-architecture/oauth-social-login.md)
- [Database Architecture](./database-architecture/index.md)
- [Infrastructure Architecture](./infrastructure-architecture/index.md)
- [Development Roadmap](./development-roadmap.md)
- [Code Standards](./code-standards.md)
- [Phase 01 Bundle Analysis Baseline](../plans/260121-0951-nextjs-performance-optimization/baseline-metrics.md)
- [Phase 02 Code-Split Heavy Libraries](../plans/260121-0951-nextjs-performance-optimization/phase-02-code-split-heavy-libraries.md)

---

**Last Updated:** 2026-01-21 14:47
**Maintained By:** Architecture Team
**Recent Updates:** Added ADR-011 (Phase 02: Dynamic Code-Splitting) with bundle optimization metrics and validation results
