# System Architecture

**Last Updated**: February 3, 2026 | **Version**: 1.1

---

## Architecture Overview

M-Tracking uses a **hybrid modular monolith** architecture combining a scalable NestJS backend, standalone FastAPI analytics service, and modern Next.js frontend. The system is designed for flexibility, scalability, and separation of concerns while maintaining simplicity during MVP phase.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                    │
│              Port 3000 - Web Dashboard & Bot UI              │
└──────────┬──────────────────────┬──────────────────┬────────┘
           │                      │                  │
           │ HTTP/REST            │ WebSocket        │ GraphQL
           │                      │ (future)         │ (future)
           │                      │                  │
    ┌──────▼─────────────────────────────────────────▼──────┐
    │       API Gateway & Load Balancer                     │
    │              (Production deployment)                   │
    └──────┬──────────────────────────────────────────┬─────┘
           │                                          │
    ┌──────▼──────────────────────┐      ┌──────────▼──────────┐
    │  NestJS Backend (Port 4000) │      │ FastAPI Service    │
    │   Modular Monolith          │      │ (Port 5000)        │
    │                              │      │ AI/LLM Operations   │
    │ • Auth Module                │      │                    │
    │ • Transactions Module        │      │ • Categorization   │
    │ • Banking Module (placeholder)│     │ • Chat Assistant   │
    │ • Budgets Module (placeholder)│     │ • Analytics        │
    │ • Notifications (placeholder) │      │                    │
    └──────┬──────────────────────┘      └──────┬─────────────┘
           │                                     │
           │ Internal Service Communication      │
           │ (Events, HTTP calls)                │
           │                                     │
    ┌──────▼────────────────────────────────────▼──────────┐
    │         Infrastructure & Data Layer                   │
    ├─────────────────────────────────────────────────────┤
    │                                                      │
    │  ┌──────────────────┐    ┌──────────────────┐      │
    │  │  PostgreSQL 17   │    │  Redis 7         │      │
    │  │ + TimescaleDB    │    │ Caching & Queues │      │
    │  │                  │    │                  │      │
    │  │ • Users          │    │ • Sessions       │      │
    │  │ • Transactions   │    │ • Rate limits    │      │
    │  │ • Categories     │    │ • Cache store    │      │
    │  │ • Sessions       │    │ • Token blacklist│      │
    │  │ • OAuth Accounts │    │ • Job queue      │      │
    │  └──────────────────┘    └──────────────────┘      │
    │                                                      │
    │  ┌──────────────────┐    ┌──────────────────┐      │
    │  │  RabbitMQ 3.12   │    │  External APIs   │      │
    │  │ Message Queue    │    │                  │      │
    │  │                  │    │ • Plaid (banks)  │      │
    │  │ • Async jobs     │    │ • Tink (banks)   │      │
    │  │ • Notifications  │    │ • MoMo (wallet)  │      │
    │  │ • Reports        │    │ • Telegram Bot   │      │
    │  │ • Analytics      │    │ • OpenAI/Claude  │      │
    │  └──────────────────┘    └──────────────────┘      │
    │                                                      │
    └─────────────────────────────────────────────────────┘

External
Integrations:
    • Telegram Bot API
    • OAuth Providers (Google, GitHub, Facebook)
    • LLM APIs (OpenAI, Anthropic)
    • Banking APIs (Plaid, Tink, MoMo)
    • Error Tracking (Sentry)
    • CI/CD (GitHub Actions)
    • Cloud Deploy (TBD)
```

---

## Application Architecture

### 1. Frontend Layer (Next.js 16)

**Purpose:** User interface for web dashboard and admin functions

**Architecture Pattern:** Feature-driven modular design

**Key Components:**

| Component  | Purpose            | Stack                 |
| ---------- | ------------------ | --------------------- |
| App Router | Page-based routing | Next.js 16 App Router |
| Components | UI primitives      | shadcn/ui + Radix UI  |
| Features   | Domain logic       | React + TypeScript    |
| State      | Global state       | Zustand + React Query |
| Forms      | User input         | React Hook Form + Zod |

**Request Flow:**

```
User Action (click, input)
    ↓
React Component Handler
    ↓
Custom Hook (useLogin, useSpending, etc.)
    ↓
API Client (axios with auth interceptor)
    ↓
NestJS Backend API
    ↓
Response → React Query Cache
    ↓
Component Re-render → UI Update
```

**Authentication Flow:**

```
1. Login form submission
   ↓
2. authApi.login(email, password)
   ↓
3. Backend returns accessToken (JWT) + refresh token (httpOnly cookie)
   ↓
4. TokenService stores accessToken in memory
   ↓
5. useAuth hook updates Zustand store
   ↓
6. ProtectedRoute checks isAuthenticated
   ↓
7. Axios interceptor attaches Bearer token to requests
```

**State Management Architecture:**

```
Component State (useState)
├── Form input, loading states, local UI

Feature Stores (Zustand)
├── useAuthStore → user, login, logout
├── useUiStore → theme, sidebar state

Server State (React Query)
├── useQuery for fetching
├── useMutation for mutations
└── Automatic cache invalidation
```

### 2. Backend Layer (NestJS 11)

**Purpose:** Core business logic, data validation, authentication, transaction processing

**Architecture Pattern:** Domain-driven modular monolith

**Module Structure:**

```
AppModule (Root)
├── Global Modules (always available)
│   ├── ConfigModule (environment)
│   ├── DatabaseModule (TypeORM + PostgreSQL)
│   ├── EventsModule (event emitter)
│   └── SharedModule (Redis, Logger, Queue)
├── Infrastructure
│   ├── GatewayModule (guards, filters, interceptors)
│   └── SentryModule (error tracking)
└── Domain Modules
    ├── AuthModule
    │   ├── AuthController
    │   ├── AuthService
    │   └── Services: Token, Password, Session, OAuth, Email
    ├── TransactionsModule
    │   ├── TransactionsController
    │   ├── TransactionsService
    │   └── Services: Analytics, Cache
    ├── BankingModule (placeholder)
    ├── BudgetsModule (placeholder)
    └── NotificationsModule (placeholder)
```

**Request Pipeline:**

```
HTTP Request
    ↓
Middleware (cookie-parser)
    ↓
Guards (JwtAuthGuard, RoleGuard)
    ↓
Controller (parse params, validate DTO)
    ↓
Service (business logic)
    ↓
Repository/ORM (database access)
    ↓
Database (PostgreSQL)
    ↓
Response (wrapped by TransformInterceptor)
    ↓
HTTP Response (JSON)
```

**Error Handling Pipeline:**

```
Error (thrown in service)
    ↓
Custom Exception (UserNotFoundException, ValidationException, etc.)
    ↓
HttpExceptionFilter (global)
    ↓
Sentry (for 5xx errors)
    ↓
Formatted Response
{
  success: false,
  error: {
    code: "USER_NOT_FOUND",
    message: "...",
    details: {...}
  }
}
    ↓
HTTP Response (appropriate status code)
```

### 3. Analytics Layer (FastAPI)

**Purpose:** AI/LLM operations for transaction categorization and chat assistant

**Architecture Pattern:** Microservice with request-response pattern

**Key Services:**

```
FastAPI Application (Port 5000)
├── /health                     # Health check
├── /api/v1/categorize         # Transaction categorization
└── /api/v1/chat               # AI chat assistant (TODO)
```

**Categorization Flow:**

```
POST /api/v1/categorize
{
  merchant: "Whole Foods Market",
  amount: 45.50,
  description: "Grocery shopping"
}
    ↓
4-Tier Cache Strategy:
    ├── Tier 1: Redis cache (80%+ hit rate)
    ├── Tier 2: User historical patterns (10%)
    ├── Tier 3: Global merchant database (5%)
    └── Tier 4: LLM API call (5%, most expensive)
    ↓
Response:
{
  category: "groceries",
  confidence: 0.95,
  source: "cache|user_history|global_db|llm"
}
```

**LLM Integration:**

```
Backend Service Request
    ↓
Analytics Service Receives Request
    ↓
Check Redis Cache (fast)
    ↓
If miss: Call LLM API (OpenAI/Anthropic)
    ↓
Cache result for 90 days
    ↓
Return response to Backend
    ↓
Backend updates transaction
```

---

## Data Architecture

### Database Schema

**Core Tables:**

```sql
-- Users & Authentication
users (id, email, password_hash, name, avatar, created_at, updated_at)
├── Indexed: email (unique), id
└── Relations: sessions (1:M), oauth_accounts (1:M), roles (M:M)

sessions (id, user_id, refresh_token_hash, device_info, ip_address, last_active_at)
├── Indexed: user_id, refresh_token_hash, expires_at
└── Relations: user (M:1)

roles (id, name, created_at)
└── Relations: users (M:M), permissions (M:M)

permissions (id, name, created_at)
└── Relations: roles (M:M)

oauth_accounts (id, user_id, provider, provider_id, provider_email, ...)
├── Indexed: user_id, (provider, provider_id)
└── Relations: user (M:1)

-- Tokens
email_verification_tokens (user_id, token_hash, expires_at, used)
password_reset_tokens (user_id, token_hash, expires_at, used)

-- Transactions
transactions (id, user_id, category_id, amount, type, date, description, ...)
├── Indexed: user_id, category_id, date, (user_id, date)
└── Relations: user (M:1), category (M:1)

categories (id, user_id, name, color, icon, created_at)
├── Indexed: user_id
└── Relations: user (M:1), transactions (1:M)

-- Optional
user_category_mappings (user_id, merchant, category, created_at)
merchant_category_mappings (merchant, category, frequency, created_at)
budgets (id, user_id, category_id, amount, period, created_at)
```

**Key Indexes:**

- `(user_id)` on sessions, transactions, categories, oauth_accounts
- `(email)` on users (unique)
- `(refresh_token_hash)` on sessions
- `(date)` on transactions (for range queries)
- `(user_id, date)` composite on transactions (common queries)
- `(category_id)` on transactions

### Caching Strategy

**Redis Usage:**

```
Cache Layers:
├── Session Cache
│   ├── Key: session:{sessionId}
│   ├── Value: user data + permissions
│   └── TTL: Session expiry

├── Rate Limit Counters
│   ├── Key: ratelimit:{endpoint}:{identifier}
│   ├── Value: request count
│   └── TTL: 1 minute

├── Transaction Summary Cache
│   ├── Key: summary:{userId}:{month}
│   ├── Value: spending totals by category
│   └── TTL: 5 minutes

├── Category Cache
│   ├── Key: category:merchant:{normalizedName}
│   ├── Value: category_id
│   └── TTL: 90 days (for learned mappings)

└── Token Blacklist
    ├── Key: blacklist:{tokenHash}
    ├── Value: 1 (present/absent indicates blacklist)
    └── TTL: Token expiry
```

**Cache Invalidation:**

```
On Transaction Created:
  → Invalidate summary:{userId}:{month}
  → Invalidate summary:{userId}:{this_year}

On Category Changed:
  → Invalidate category:merchant:{merchant}
  → Invalidate summary:{userId}:{*}

On Logout:
  → Blacklist refresh token
  → Delete session:{sessionId}
```

---

## Service Communication

### Internal Communication (Backend Services)

**Event-Driven (Decoupled):**

```typescript
// Transaction Service publishes event
eventEmitter.emit('transaction.created', {
  transactionId,
  userId,
  amount,
  category,
})

// Notification Service subscribes
eventEmitter.on('transaction.created', async data => {
  // Check budget thresholds
  // Send alert if exceeded
})
```

**Direct Service Calls (Coupled):**

```typescript
// TransactionService calls Analytics
const category = await this.analyticsService.categorizeTransaction({
  merchant,
  amount,
  description,
})
```

### External Communication

**Synchronous (HTTP/REST):**

```
Frontend ← → NestJS Backend  ← → Plaid API
                           ← → Telegram API
                           ← → OpenAI/Anthropic
```

**Asynchronous (Message Queue):**

```
NestJS Backend
    ↓
BullMQ (Redis queue)
    ↓
RabbitMQ (for distributed scenarios, setup ready)
    ↓
Worker Process (not yet implemented)
    ↓
External Service (email, reports, notifications)
```

---

## Authentication & Authorization

### JWT Token Flow

```
1. Registration
   User creates account
   → Password hashed (bcrypt, cost 12)
   → User stored in DB
   → Verification email sent

2. Email Verification
   User clicks link with token
   → Token validated (SHA-256 hash match)
   → emailVerified set to true

3. Login
   User submits email + password
   → Credentials validated
   → Access token generated (RS256, 15m expiry)
   → Refresh token generated (7d expiry, stored in httpOnly cookie)
   → Session created in DB

4. Authenticated Request
   Client includes Authorization header
   → JWT middleware validates token
   → If valid: Attach user to request
   → If expired: Frontend calls refresh endpoint

5. Token Refresh
   Frontend calls POST /auth/refresh with refresh token
   → Old refresh token validated
   → New access token generated
   → Refresh token rotated (new token issued)

6. Logout
   Client deletes token from memory
   → Backend blacklists refresh token (Redis)
   → Session marked inactive
```

### RBAC (Role-Based Access Control)

```
User ← → Role (many-to-many)
Role ← → Permission (many-to-many)

JWT Payload:
{
  sub: userId,
  email: user@example.com,
  roles: ['user', 'admin'],
  sessionId: session123,
  iat: 1234567890,
  exp: 1234571490
}

Route Protection:
@Roles('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
async deleteUser() {}
```

### OAuth Flow (Google Example)

```
1. Frontend redirects to: /auth/google
   → Parameter: redirect_uri = frontend_callback_url

2. Backend initiates OAuth with Google
   → Generates state + PKCE challenge
   → Redirects to Google consent screen

3. User consents on Google
   → Google redirects back with auth code + state

4. Backend exchanges code for tokens
   → Validates state + PKCE
   → Gets user profile from Google

5. Check/Create OAuthAccount
   → If exists: Link to existing user
   → If new: Create user + oauth account (no password)

6. Generate M-Tracking tokens
   → Create access token
   → Create refresh token
   → Return to frontend

7. Optional: User sets password later
   → Call POST /auth/add-password/request (authenticated)
   → Backend sends setup email (1-hour token)
   → User completes password setup via reset flow
```

---

## API Design

### Response Format

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "user@example.com"
  },
  "timestamp": "2026-02-01T10:00:00Z",
  "meta": {
    "requestId": "req-456"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": {
      "field": "email",
      "constraint": "unique"
    }
  },
  "timestamp": "2026-02-01T10:00:00Z",
  "path": "/auth/login"
}
```

### Error Codes

| Code             | Status | Meaning                          |
| ---------------- | ------ | -------------------------------- |
| VALIDATION_ERROR | 400    | Input validation failed          |
| UNAUTHORIZED     | 401    | Missing or invalid auth          |
| FORBIDDEN        | 403    | Authenticated but not authorized |
| NOT_FOUND        | 404    | Resource not found               |
| CONFLICT         | 409    | Resource already exists          |
| RATE_LIMITED     | 429    | Too many requests                |
| SERVER_ERROR     | 500    | Unhandled server error           |

### API Endpoint Categories

**Public Endpoints:**

- `POST /auth/register` - User registration
- `POST /auth/login` - Email/password login
- `POST /auth/verify-email` - Email verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Reset with token
- OAuth endpoints

**Protected Endpoints:**

- `GET /users/me` - Current user profile
- `PATCH /users/me` - Update profile
- `PATCH /users/me/password` - Change password
- `GET/POST/PUT/DELETE /transactions` - Transaction CRUD
- `GET/POST/PUT/DELETE /transactions/categories` - Category management
- `GET /transactions/summary` - Spending summary

---

## Deployment Architecture (Production)

### Multi-Environment Support

```
Development
├── Local docker-compose
├── Fake OAuth (Google, GitHub)
├── Local PostgreSQL
└── MSW for frontend testing

Staging
├── Docker containers on AWS ECS
├── Real OAuth providers
├── RDS PostgreSQL with backups
└── Monitoring enabled

Production
├── Kubernetes (EKS) for auto-scaling
├── Load balancer (ALB)
├── RDS PostgreSQL (multi-AZ)
├── ElastiCache (Redis)
├── CloudFront CDN for static assets
├── CloudWatch monitoring
└── Error tracking (Sentry)
```

### Infrastructure Services

```
Infrastructure Layer:
├── PostgreSQL 17 (RDS in prod)
├── Redis 7 (ElastiCache in prod)
├── RabbitMQ 3.12 (MSK/standalone in prod)
├── S3 (for user avatars, exports)
├── CloudWatch (logs, metrics)
├── Sentry (error tracking)
└── GitHub Actions (CI/CD)
```

---

## Security Architecture

### Defense in Depth

```
Layer 1: Network
├── CORS (frontend origin only)
├── HTTPS/TLS 1.2+ (encrypted transit)
└── WAF (AWS WAF in production)

Layer 2: Authentication
├── JWT with RS256 (asymmetric signing)
├── Bcrypt (cost 12) for passwords
├── Session tracking (device + IP)
└── Token blacklisting (Redis)

Layer 3: Authorization
├── RBAC (role-based access control)
├── Ownership checks (user can only access own data)
└── Rate limiting (prevent brute force)

Layer 4: Data Protection
├── Encryption at rest (AES-256 for sensitive)
├── PII masking in logs
├── Audit logging (7-year retention)
└── Secure cookie (httpOnly, Secure, SameSite)

Layer 5: Input Validation
├── Type validation (TypeScript)
├── Schema validation (class-validator, Zod)
├── SQL injection prevention (TypeORM parameterized)
└── XSS prevention (React auto-escapes)
```

---

## Performance Architecture

### Caching Strategy

```
Browser Cache
├── Static assets (Next.js automatic)
└── Service Worker (MSW in dev)

CDN Cache (CloudFront in prod)
├── CSS, JS, images
└── TTL: 1 year for versioned

Application Cache
├── React Query (5-min stale, 30-min GC)
├── Redis (transaction summary, 5-min)
└── Browser localStorage (UI preferences)

Database Cache
├── Connection pooling (PgBouncer)
├── Query result caching (Redis)
└── Strategic indexes (hot paths)
```

### Scaling Strategy

```
Vertical Scaling (temporary)
├── Increase instance size
└── Increase database resources

Horizontal Scaling (permanent)
├── Load balancer → Multiple backends
├── Read replicas for DB
├── Cache cluster (Redis cluster)
└── Message queue workers (auto-scaling)

Database Optimization
├── Indexes on hot paths
├── Partitioning by date (TimescaleDB)
├── Connection pooling
└── Query optimization (explain plans)
```

---

## Monitoring & Observability

### Logging

```
Frontend Logs
├── Browser console (dev)
├── Sentry client (prod)
└── Network logs (HTTP traces)

Backend Logs
├── Winston logger (structured JSON in prod)
├── Log levels: log, error, warn, debug, verbose
└── CloudWatch (ECS in prod)

Log Format (Production):
{
  "timestamp": "2026-02-01T10:00:00Z",
  "level": "info",
  "service": "backend",
  "requestId": "req-456",
  "userId": "user-123",
  "message": "Transaction created",
  "meta": {...}
}
```

### Metrics & Monitoring

```
Application Metrics
├── Request latency (p50, p95, p99)
├── Error rate (5xx, 4xx)
├── Cache hit rate
├── Database query time
└── API endpoint performance

Business Metrics
├── Daily active users
├── Transaction volume
├── Error incidents
└── Feature usage

Monitoring Tools (Production)
├── CloudWatch (AWS native)
├── Sentry (error tracking)
├── DataDog (optional)
└── Custom dashboards (optional)
```

### Health Checks

```
/health (every service)
├── Database connectivity
├── Redis connectivity
├── External API status
└── Returns 200 OK if healthy

/health/deep
├── Full system diagnostic
└── Returns detailed status
```

---

## Disaster Recovery

### Backup Strategy

```
PostgreSQL
├── Automated daily backups (AWS RDS)
├── 30-day retention
├── Cross-region replication
└── Restore time: < 1 hour

Redis
├── AOF (append-only file) enabled
├── Snapshots every 6 hours
└── Backup to S3

Configuration & Secrets
├── Stored in AWS Secrets Manager
├── Rotated every 90 days
└── Encrypted at rest

Data Retention Policy
├── Active users: Indefinite
├── Deleted users: 30-day soft delete, then purge
├── Transaction history: 7 years (compliance)
└── Audit logs: 7 years (compliance)
```

---

## Tech Stack Justification

| Component     | Choice                | Rationale                                   |
| ------------- | --------------------- | ------------------------------------------- |
| **Frontend**  | Next.js 16            | SSR, App Router, built-in optimization      |
| **Backend**   | NestJS                | TypeScript, modular, enterprise-ready       |
| **Analytics** | FastAPI               | Python, async, LLM integration              |
| **Database**  | PostgreSQL            | Relational, TimescaleDB extension, reliable |
| **Cache**     | Redis                 | In-memory, atomic operations, pub/sub       |
| **Queue**     | RabbitMQ              | Reliable, flexible routing, durable         |
| **Auth**      | JWT + OAuth           | Stateless, industry standard, flexible      |
| **Styling**   | TailwindCSS           | Utility-first, dark mode, responsive        |
| **State**     | Zustand + React Query | Lightweight, performant, intuitive          |
| **Monorepo**  | Nx                    | Efficient builds, affected detection        |

---

## Related Documents

- [docs/authentication.md](./authentication.md) - Authentication & authorization guide (JWT, OAuth, 2FA, RBAC)
- [docs/project-overview-pdr.md](./project-overview-pdr.md) - Product overview
- [docs/codebase-summary.md](./codebase-summary.md) - Code organization
- [docs/code-standards.md](./code-standards.md) - Development standards
- [docs/prd.md](./prd.md) - Complete product requirements
