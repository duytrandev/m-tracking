# Technical Architecture Document

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2025-12-28 | Technical Architect | Draft |

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [System Architecture](#system-architecture)
4. [Microservices Design](#microservices-design)
5. [Data Architecture](#data-architecture)
6. [Integration Architecture](#integration-architecture)
7. [Security Architecture](#security-architecture)
8. [Infrastructure Architecture](#infrastructure-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Observability Architecture](#observability-architecture)

---

## System Overview

### Architecture Style
**Microservices Architecture** with event-driven communication patterns and API gateway facade.

### Key Characteristics
- **Distributed**: Services deployed independently across multiple containers
- **Polyglot**: NestJS for most services, FastAPI for ML/AI workloads
- **Event-Driven**: RabbitMQ for asynchronous communication
- **API-First**: RESTful APIs with OpenAPI documentation
- **Cloud-Native**: Kubernetes orchestration, horizontally scalable
- **Database-per-Service**: Each service owns its data domain

### Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui |
| **API Gateway** | Kong Gateway (or NestJS custom) |
| **Backend Services** | NestJS, FastAPI (Python) |
| **Message Broker** | RabbitMQ (AMQP protocol) |
| **Databases** | PostgreSQL 15, Redis 7, TimescaleDB |
| **Search** | Elasticsearch (optional) |
| **Cache** | Redis |
| **Container Runtime** | Docker |
| **Orchestration** | Kubernetes (AWS EKS) |
| **Infrastructure** | Terraform, Helm |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus, Grafana, Jaeger, ELK Stack |
| **LLM** | OpenAI GPT-4, Anthropic Claude |

---

## Architecture Principles

### 1. Domain-Driven Design
- Services organized around business domains
- Bounded contexts clearly defined
- Ubiquitous language within each service

### 2. Single Responsibility
- Each microservice has one clear purpose
- Services are independently deployable
- Minimal coupling between services

### 3. API-First Development
- All service interactions via well-defined APIs
- OpenAPI/Swagger documentation mandatory
- Versioned APIs for backward compatibility

### 4. Resilience & Fault Tolerance
- Circuit breakers for external dependencies
- Retry logic with exponential backoff
- Graceful degradation when dependencies fail
- Health checks for all services

### 5. Security by Design
- Zero-trust security model
- Principle of least privilege
- Defense in depth
- Security at every layer

### 6. Observability
- Structured logging (JSON format)
- Distributed tracing (correlation IDs)
- Metrics collection (RED/USE method)
- Alerting on anomalies

### 7. Scalability
- Horizontal scaling for all services
- Stateless service design
- Database read replicas
- Caching at multiple layers

### 8. Data Consistency
- Eventual consistency between services
- Saga pattern for distributed transactions
- Idempotent operations
- Event sourcing where appropriate

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │   WAF   │ (AWS WAF)
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │   ALB   │ (Application Load Balancer)
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │ Frontend│     │   API   │     │ Telegram│
   │ (Next.js│     │ Gateway │     │ Webhook │
   │  on     │     │ (Kong)  │     │Endpoint │
   │ Vercel) │     └────┬────┘     └────┬────┘
   └─────────┘          │               │
                        │               │
        ┌───────────────┴───────┬───────┴────────┬───────────┐
        │                       │                │           │
   ┌────▼────┐            ┌────▼────┐      ┌────▼────┐ ┌───▼─────┐
   │  Auth   │            │  User   │      │  Bank   │ │  Trans- │
   │ Service │            │ Service │      │ Service │ │ action  │
   │(NestJS) │            │(NestJS) │      │(NestJS) │ │ Service │
   └────┬────┘            └────┬────┘      └────┬────┘ └───┬─────┘
        │                      │                │          │
        │         ┌────────────┴────────┬───────┴──────┬───┴──────┐
        │         │                     │              │          │
   ┌────▼────┐ ┌─▼────────┐      ┌────▼────┐   ┌─────▼─────┐ ┌──▼──────┐
   │ Budget  │ │Analytics │      │Notific- │   │  Report   │ │ Other   │
   │ Service │ │ Service  │      │  ation  │   │  Service  │ │Services │
   │(NestJS) │ │(FastAPI) │      │ Service │   │ (NestJS)  │ │         │
   └────┬────┘ └─────┬────┘      │(NestJS) │   └───────────┘ └─────────┘
        │            │            └────┬────┘
        │            │                 │
        └────────────┼─────────────────┴─────────────┐
                     │                                │
              ┌──────▼──────┐                  ┌─────▼──────┐
              │  RabbitMQ   │                  │  BullMQ    │
              │  (Message   │                  │  (Job      │
              │   Broker)   │                  │  Queue)    │
              └─────────────┘                  └─────┬──────┘
                     │                               │
        ┌────────────┴────────────┬──────────────────┘
        │                         │
   ┌────▼────────┐         ┌─────▼────────┐
   │ PostgreSQL  │         │    Redis     │
   │ (TimescaleDB│         │   Cluster    │
   │  Extension) │         │              │
   └─────────────┘         └──────────────┘
```

### Component Description

#### 1. Entry Points
- **WAF (Web Application Firewall)**: Protects against common web exploits
- **ALB (Application Load Balancer)**: Routes traffic, SSL termination
- **Vercel Edge Network**: CDN for frontend static assets

#### 2. API Gateway Layer
- **Kong Gateway**:
  - Authentication validation (JWT)
  - Rate limiting (per user, per IP)
  - Request/response transformation
  - API versioning
  - Logging and analytics
  - Circuit breaking

#### 3. Service Layer
All microservices follow consistent patterns:
- Health check endpoints (`/health`, `/ready`)
- Metrics endpoint (`/metrics`)
- OpenAPI documentation (`/api-docs`)
- Graceful shutdown handling
- Correlation ID propagation

#### 4. Data Layer
- **PostgreSQL**: Persistent storage for business data
- **TimescaleDB**: Time-series extension for transaction data
- **Redis**: Caching, session storage, rate limiting
- **Elasticsearch**: Full-text search (optional for MVP)

#### 5. Integration Layer
- **RabbitMQ**: Event-driven communication between services
- **BullMQ**: Job queue for background tasks
- **External APIs**: Plaid, Tink, OpenAI, Telegram

---

## Microservices Design

### Service Catalog

#### 1. Auth Service
**Port**: 3001
**Responsibilities**: Authentication, authorization, session management

**Endpoints**:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login (email/password)
- `POST /auth/oauth/google` - OAuth Google login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/verify-email` - Email verification
- `POST /auth/reset-password` - Password reset
- `POST /auth/2fa/enable` - Enable 2FA
- `POST /auth/2fa/verify` - Verify 2FA token

**Database**: Redis (sessions, refresh tokens)

**Dependencies**: User Service (user creation)

**Technology**:
```typescript
// Key packages
- @nestjs/jwt
- @nestjs/passport
- passport-jwt
- passport-google-oauth20
- bcrypt
- speakeasy (for 2FA)
```

---

#### 2. User Service
**Port**: 3002
**Responsibilities**: User profile management, preferences

**Endpoints**:
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `GET /users/:id/preferences` - Get user preferences
- `PUT /users/:id/preferences` - Update preferences
- `DELETE /users/:id` - Delete user account (GDPR)
- `GET /users/:id/export` - Export user data (GDPR)

**Database**: PostgreSQL

**Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  notification_enabled BOOLEAN DEFAULT TRUE,
  telegram_chat_id VARCHAR(255),
  daily_summary_time TIME DEFAULT '09:00',
  weekly_report_day VARCHAR(10) DEFAULT 'Monday',
  transaction_alert_threshold DECIMAL(10,2) DEFAULT 500.00,
  preferences JSONB DEFAULT '{}'
);
```

**Dependencies**: None (foundational service)

---

#### 3. Bank Service
**Port**: 3003
**Responsibilities**: Bank account integration, transaction sync

**Endpoints**:
- `POST /banks/connect` - Initiate bank connection (Plaid Link)
- `GET /banks/accounts` - List connected accounts
- `POST /banks/:accountId/sync` - Trigger manual sync
- `DELETE /banks/:accountId` - Disconnect bank account
- `GET /banks/:accountId/status` - Connection health status

**Database**: PostgreSQL

**Schema**:
```sql
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL, -- 'plaid', 'tink', 'open_banking'
  provider_account_id VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, error, disconnected
  last_sync_at TIMESTAMP,
  last_sync_status VARCHAR(50),
  error_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES bank_connections(id),
  provider_account_id VARCHAR(255) NOT NULL,
  account_type VARCHAR(50), -- checking, savings, credit
  account_name VARCHAR(255),
  account_mask VARCHAR(10), -- last 4 digits
  current_balance DECIMAL(15,2),
  available_balance DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Background Jobs**:
- Scheduled sync (every 6 hours)
- Retry failed syncs (exponential backoff)
- Connection health check (daily)

**Integration**:
```typescript
// Plaid SDK
import { PlaidApi, Configuration } from 'plaid';

// Adapter pattern for multiple providers
interface BankProvider {
  connect(userId: string): Promise<ConnectionToken>;
  sync(accountId: string): Promise<Transaction[]>;
  disconnect(accountId: string): Promise<void>;
}

class PlaidProvider implements BankProvider { ... }
class TinkProvider implements BankProvider { ... }
```

**Events Published**:
- `bank.connected` → Transaction Service
- `bank.sync.completed` → Transaction Service
- `bank.sync.failed` → Notification Service

---

#### 4. Transaction Service
**Port**: 3004
**Responsibilities**: Transaction storage, categorization, querying

**Endpoints**:
- `GET /transactions` - List transactions (paginated, filtered)
- `GET /transactions/:id` - Get transaction details
- `PUT /transactions/:id/category` - Update category
- `PUT /transactions/:id/notes` - Add notes
- `GET /transactions/search` - Search transactions
- `GET /transactions/categories/summary` - Category spending summary

**Database**: PostgreSQL with TimescaleDB extension

**Schema**:
```sql
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  account_id UUID REFERENCES bank_accounts(id),
  provider_transaction_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  direction VARCHAR(10) NOT NULL, -- 'debit', 'credit'
  merchant_name VARCHAR(255),
  description TEXT,
  category VARCHAR(100), -- auto-categorized
  category_confidence DECIMAL(3,2), -- 0.00 to 1.00
  user_category VARCHAR(100), -- user override
  transaction_date DATE NOT NULL,
  posted_date DATE,
  status VARCHAR(50) DEFAULT 'posted', -- pending, posted
  notes TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('transactions', 'transaction_date');

-- Indexes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_name);
CREATE INDEX idx_transactions_amount ON transactions(amount);
```

**Categorization Logic**:
1. Check user's previous categorization history (ML model)
2. Use LLM (GPT-4 or Claude) for new merchants
3. Cache merchant → category mappings
4. Provide confidence score

**Events Subscribed**:
- `bank.sync.completed` → Ingest new transactions

**Events Published**:
- `transaction.created` → Analytics Service, Budget Service
- `transaction.large` (>$500) → Notification Service

---

#### 5. Analytics Service
**Port**: 3005
**Responsibilities**: LLM-powered insights, spending analysis, forecasting

**Technology**: **FastAPI** (Python) for better ML/AI library support

**Endpoints**:
- `POST /analytics/categorize` - Categorize transaction using LLM
- `GET /analytics/insights` - Get personalized insights
- `POST /analytics/query` - Natural language query
- `GET /analytics/spending-trends` - Spending patterns
- `GET /analytics/anomalies` - Detect unusual spending
- `GET /analytics/forecast` - Cash flow forecast

**Database**: PostgreSQL + Redis cache

**Schema**:
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  insight_type VARCHAR(50), -- 'savings_opportunity', 'spending_spike', 'forecast'
  title VARCHAR(255),
  description TEXT,
  data JSONB,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  viewed BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE merchant_categories (
  merchant_name VARCHAR(255) PRIMARY KEY,
  category VARCHAR(100),
  confidence DECIMAL(3,2),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**LLM Integration**:
```python
# Using LangChain for LLM orchestration
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.cache import RedisCache

# Setup
llm = ChatOpenAI(model="gpt-4", temperature=0)
cache = RedisCache(redis_client)

# Categorization prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a financial transaction categorizer..."),
    ("user", "Categorize: {merchant_name}, amount: {amount}")
])

# Invoke
result = llm.invoke(prompt.format_messages(...))
```

**Vector Database** (for semantic search):
```sql
-- Add pgvector extension
CREATE EXTENSION vector;

CREATE TABLE transaction_embeddings (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(id),
  embedding vector(1536), -- OpenAI embedding size
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON transaction_embeddings USING ivfflat (embedding vector_cosine_ops);
```

**Events Subscribed**:
- `transaction.created` → Categorize and analyze

**Events Published**:
- `insight.generated` → Notification Service

---

#### 6. Budget Service
**Port**: 3006
**Responsibilities**: Budget management, goal tracking, alerts

**Endpoints**:
- `POST /budgets` - Create budget
- `GET /budgets` - List user budgets
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget
- `GET /budgets/:id/progress` - Budget utilization
- `POST /goals` - Create savings goal
- `GET /goals` - List goals
- `GET /goals/:id/progress` - Goal progress

**Database**: PostgreSQL

**Schema**:
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly, yearly
  start_date DATE NOT NULL,
  end_date DATE,
  rollover BOOLEAN DEFAULT FALSE,
  alert_thresholds DECIMAL[] DEFAULT ARRAY[0.8, 1.0, 1.2], -- 80%, 100%, 120%
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE budget_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budgets(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_spent DECIMAL(15,2) DEFAULT 0,
  transaction_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- active, achieved, abandoned
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Background Jobs**:
- Calculate budget utilization (daily)
- Check alert thresholds (real-time + daily)
- Reset monthly budgets (cron: 1st of month)
- Send budget reports (weekly)

**Events Subscribed**:
- `transaction.created` → Update budget utilization

**Events Published**:
- `budget.threshold.reached` (80%) → Notification Service
- `budget.exceeded` (100%) → Notification Service
- `budget.overspent` (120%) → Notification Service

---

#### 7. Notification Service
**Port**: 3007
**Responsibilities**: Send Telegram messages, emails, manage notification preferences

**Endpoints**:
- `POST /notifications/send` - Send notification (internal API)
- `GET /notifications/history` - User notification history
- `PUT /notifications/preferences` - Update preferences
- `POST /telegram/webhook` - Telegram webhook endpoint
- `POST /telegram/link` - Link Telegram account

**Database**: PostgreSQL

**Schema**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'transaction_alert', 'budget_alert', 'insight', 'summary'
  channel VARCHAR(20) NOT NULL, -- 'telegram', 'email', 'push'
  title VARCHAR(255),
  message TEXT NOT NULL,
  data JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  rule_type VARCHAR(50), -- 'large_transaction', 'daily_summary', 'budget_alert'
  enabled BOOLEAN DEFAULT TRUE,
  conditions JSONB, -- e.g., {"amount_threshold": 500}
  channels VARCHAR[] DEFAULT ARRAY['telegram'],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Telegram Bot**:
```typescript
// Using Telegraf framework
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Commands
bot.command('start', (ctx) => {
  // Link user account
});

bot.command('summary', async (ctx) => {
  // Send today's summary
});

bot.command('budget', async (ctx) => {
  // Show budget status
});

bot.launch();
```

**Queue Processing**:
```typescript
// BullMQ queue for notification jobs
@Processor('notifications')
export class NotificationProcessor {
  @Process('send-telegram')
  async sendTelegram(job: Job) {
    const { userId, message } = job.data;
    // Send via Telegram API
  }

  @Process('send-email')
  async sendEmail(job: Job) {
    // Send via nodemailer
  }
}
```

**Events Subscribed**:
- `transaction.large` → Send alert
- `budget.threshold.reached` → Send alert
- `insight.generated` → Send insight
- `bank.sync.failed` → Send error notification

---

#### 8. Report Service (Optional for MVP)
**Port**: 3008
**Responsibilities**: Generate PDF reports, export data

**Endpoints**:
- `POST /reports/generate` - Generate PDF report
- `GET /reports/:id` - Download report
- `POST /exports/transactions` - Export transactions (CSV/Excel)

**Technology**:
```typescript
// Puppeteer for PDF generation
import puppeteer from 'puppeteer';

// Generate PDF from HTML template
async generatePDF(data: ReportData): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(renderTemplate(data));
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdf;
}
```

**Storage**: AWS S3 for generated reports

---

## Data Architecture

### Database Strategy

#### 1. Database-per-Service Pattern
- Each microservice owns its database schema
- No direct database access between services
- Data sharing via APIs or events

#### 2. PostgreSQL Configuration
```yaml
# Primary Database Cluster
- Version: PostgreSQL 15
- High Availability: Primary + 2 Read Replicas
- Backup: Daily automated backups, 30-day retention
- Point-in-Time Recovery: Enabled
- Connection Pooling: PgBouncer (transaction mode)
- Extensions: TimescaleDB, pgvector, pg_stat_statements
```

#### 3. Data Partitioning
```sql
-- Partition transactions by month (TimescaleDB automatic)
SELECT create_hypertable('transactions', 'transaction_date',
  chunk_time_interval => INTERVAL '1 month');

-- Retention policy (keep 5 years)
SELECT add_retention_policy('transactions', INTERVAL '5 years');
```

#### 4. Caching Strategy

**Redis Architecture**:
- **Cluster Mode**: 3 master nodes + 3 replicas
- **Use Cases**:
  - Session storage (TTL: 24 hours)
  - JWT token blacklist (TTL: token expiry)
  - API response caching (TTL: 5-60 minutes)
  - Rate limiting counters (TTL: 1 hour)
  - LLM response caching (TTL: 7 days)

**Cache Patterns**:
```typescript
// Cache-aside pattern
async getTransaction(id: string): Promise<Transaction> {
  const cached = await redis.get(`transaction:${id}`);
  if (cached) return JSON.parse(cached);

  const transaction = await db.findOne(id);
  await redis.setex(`transaction:${id}`, 3600, JSON.stringify(transaction));
  return transaction;
}

// Write-through pattern
async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
  const transaction = await db.create(data);
  await redis.setex(`transaction:${transaction.id}`, 3600, JSON.stringify(transaction));
  return transaction;
}
```

---

## Integration Architecture

### Event-Driven Architecture

**Message Broker**: RabbitMQ

**Exchange Types**:
1. **Topic Exchange** (primary): `money-tracking.events`
2. **Fanout Exchange**: `money-tracking.broadcasts`
3. **Dead Letter Exchange**: `money-tracking.dlx`

**Event Schema**:
```typescript
interface DomainEvent {
  eventId: string;          // UUID
  eventType: string;        // e.g., 'transaction.created'
  aggregateId: string;      // Entity ID
  aggregateType: string;    // e.g., 'Transaction'
  payload: Record<string, any>;
  metadata: {
    userId: string;
    timestamp: string;
    correlationId: string;  // Request trace ID
    causationId: string;    // Parent event ID
  };
  version: string;          // Schema version
}
```

**Event Examples**:
```typescript
// Published by Transaction Service
{
  eventType: 'transaction.created',
  aggregateId: 'txn_123',
  aggregateType: 'Transaction',
  payload: {
    userId: 'user_456',
    amount: 125.50,
    merchant: 'Starbucks',
    category: 'Food & Dining'
  },
  metadata: {
    userId: 'user_456',
    timestamp: '2025-12-28T10:30:00Z',
    correlationId: 'req_789'
  }
}

// Subscribed by: Analytics Service, Budget Service, Notification Service
```

**Routing Keys Convention**:
```
<domain>.<entity>.<action>

Examples:
- bank.connection.created
- bank.sync.completed
- bank.sync.failed
- transaction.created
- transaction.updated
- budget.threshold.reached
- budget.exceeded
- insight.generated
```

**RabbitMQ Configuration**:
```typescript
// NestJS microservice setup
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EVENT_BUS',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'transaction_service_queue',
          queueOptions: {
            durable: true,
            deadLetterExchange: 'money-tracking.dlx',
            messageTtl: 86400000, // 24 hours
          },
          prefetchCount: 10,
        },
      },
    ]),
  ],
})
export class AppModule {}

// Publisher
@Injectable()
export class TransactionEventPublisher {
  constructor(@Inject('EVENT_BUS') private client: ClientProxy) {}

  async publishTransactionCreated(transaction: Transaction) {
    const event: DomainEvent = {
      eventType: 'transaction.created',
      aggregateId: transaction.id,
      aggregateType: 'Transaction',
      payload: transaction,
      metadata: {
        userId: transaction.userId,
        timestamp: new Date().toISOString(),
        correlationId: RequestContext.get('correlationId'),
      },
    };

    await this.client.emit('transaction.created', event).toPromise();
  }
}

// Subscriber
@Controller()
export class AnalyticsEventHandler {
  @EventPattern('transaction.created')
  async handleTransactionCreated(@Payload() event: DomainEvent) {
    // Process event
    await this.analyticsService.analyzeTransaction(event.payload);
  }
}
```

### Synchronous Communication

**REST API Standards**:
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Status Codes**: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503
- **Content-Type**: `application/json`
- **API Versioning**: URL-based (`/v1/users`, `/v2/users`)

**Request/Response Format**:
```typescript
// Success Response
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-28T10:30:00Z",
    "requestId": "req_789"
  }
}

// Error Response
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  },
  "meta": {
    "timestamp": "2025-12-28T10:30:00Z",
    "requestId": "req_789"
  }
}

// Paginated Response
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "meta": { ... }
}
```

**Service-to-Service Communication**:
```typescript
// Using HTTP client with circuit breaker
import { HttpService } from '@nestjs/axios';
import CircuitBreaker from 'opossum';

@Injectable()
export class UserServiceClient {
  private circuitBreaker: CircuitBreaker;

  constructor(private http: HttpService) {
    this.circuitBreaker = new CircuitBreaker(
      this.getUser.bind(this),
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      }
    );
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.http.get(`${USER_SERVICE_URL}/users/${userId}`).toPromise();
    return response.data;
  }

  async getUserSafe(userId: string): Promise<User | null> {
    try {
      return await this.circuitBreaker.fire(userId);
    } catch (error) {
      // Circuit open or timeout
      return null; // Graceful degradation
    }
  }
}
```

---

## Security Architecture

### 1. Authentication & Authorization

**JWT Token Strategy**:
```typescript
// Access Token (short-lived)
{
  "sub": "user_123",        // User ID
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1672531200,        // Issued at
  "exp": 1672534800,        // Expires (1 hour)
  "iss": "money-tracking",  // Issuer
  "aud": "money-tracking-api" // Audience
}

// Refresh Token (long-lived, stored in Redis)
{
  "sub": "user_123",
  "type": "refresh",
  "iat": 1672531200,
  "exp": 1675123200,        // Expires (30 days)
  "jti": "token_uuid"       // Unique token ID (for revocation)
}
```

**Auth Flow**:
1. User logs in → Auth Service validates credentials
2. Auth Service issues Access Token (JWT) + Refresh Token
3. Client stores Refresh Token (httpOnly cookie)
4. Client includes Access Token in `Authorization: Bearer` header
5. API Gateway validates JWT signature and expiry
6. Request forwarded to services with validated user context
7. When Access Token expires, client uses Refresh Token
8. Auth Service validates Refresh Token (Redis lookup)
9. Issue new Access Token + rotate Refresh Token

**Role-Based Access Control**:
```typescript
// Decorator for endpoint protection
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('/admin/users')
async getAllUsers() { ... }

// JWT validation middleware
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Validate JWT, check expiry, verify signature
    return super.canActivate(context);
  }
}
```

### 2. Data Encryption

**Encryption at Rest**:
- PostgreSQL: Transparent Data Encryption (TDE) via AWS RDS encryption
- Redis: Encryption enabled (AWS ElastiCache encryption)
- S3: Server-side encryption (SSE-S3)
- Secrets: AWS Secrets Manager with KMS encryption

**Encryption in Transit**:
- All HTTP traffic: TLS 1.3
- Internal service communication: TLS (optional for MVP, required for production)
- Database connections: SSL/TLS required
- Redis connections: TLS enabled

**Sensitive Data Encryption**:
```typescript
// Bank access tokens encrypted before storage
import { createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted: encrypted.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  }

  decrypt(ciphertext: string): string {
    const { iv, encrypted, authTag } = JSON.parse(ciphertext);
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final()
    ]).toString('utf8');
  }
}
```

### 3. API Security

**Rate Limiting**:
```typescript
// Kong Gateway configuration
rate-limiting:
  minute: 60
  hour: 1000
  policy: local

// Or NestJS throttler
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})

// Per-endpoint override
@Throttle(10, 60) // 10 requests per 60 seconds
@Post('/auth/login')
async login() { ... }
```

**Input Validation**:
```typescript
// Use class-validator + class-transformer
export class CreateBudgetDto {
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  amount: number;

  @IsEnum(['weekly', 'monthly', 'yearly'])
  period: string;

  @IsISO8601()
  startDate: string;
}

// Automatic validation in controller
@Post('/budgets')
async createBudget(@Body() dto: CreateBudgetDto) { ... }
```

**SQL Injection Prevention**:
```typescript
// Use parameterized queries (Prisma/TypeORM)
const transactions = await prisma.transaction.findMany({
  where: {
    userId: userId, // Parameterized
    amount: { gte: minAmount },
  },
});

// NEVER do this:
const query = `SELECT * FROM transactions WHERE user_id = '${userId}'`; // VULNERABLE
```

**XSS Prevention**:
- Sanitize user input on backend
- Content Security Policy (CSP) headers
- Frontend framework escaping (React auto-escapes)

### 4. Secrets Management

**AWS Secrets Manager**:
```typescript
// Load secrets at startup
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function loadSecrets() {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: 'prod/money-tracking/db' })
  );

  const secrets = JSON.parse(response.SecretString);
  process.env.DATABASE_URL = secrets.url;
  process.env.DATABASE_PASSWORD = secrets.password;
}
```

**Secrets Rotation**:
- Database passwords: Automatic rotation (90 days)
- API keys: Manual rotation (quarterly)
- JWT signing keys: Key versioning (support multiple active keys)

### 5. Audit Logging

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL, -- 'USER_LOGIN', 'TRANSACTION_VIEWED', 'BANK_CONNECTED'
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);
```

**Retention**: 7 years (compliance requirement)

---

## Infrastructure Architecture

### AWS Infrastructure

**VPC Design**:
```
VPC: 10.0.0.0/16

Subnets:
- Public Subnets (ALB, NAT Gateway):
  - us-east-1a: 10.0.1.0/24
  - us-east-1b: 10.0.2.0/24
  - us-east-1c: 10.0.3.0/24

- Private Subnets (EKS Nodes):
  - us-east-1a: 10.0.10.0/24
  - us-east-1b: 10.0.11.0/24
  - us-east-1c: 10.0.12.0/24

- Database Subnets:
  - us-east-1a: 10.0.20.0/24
  - us-east-1b: 10.0.21.0/24
  - us-east-1c: 10.0.22.0/24
```

**Compute**:
- **EKS Cluster**: Kubernetes 1.28
  - Node Groups: 3-10 nodes (t3.large), auto-scaling
  - Fargate: For lightweight workloads

**Databases**:
- **RDS PostgreSQL**: db.r6g.xlarge (4 vCPU, 32 GB RAM)
  - Multi-AZ deployment
  - Read replicas: 2x db.r6g.large
- **ElastiCache Redis**: cache.r6g.large (2 nodes, cluster mode)

**Storage**:
- **S3**: Documents, reports, backups
- **EBS**: Persistent volumes for Kubernetes

**Networking**:
- **ALB**: Application Load Balancer (internet-facing)
- **Route53**: DNS management
- **CloudFront**: CDN for frontend (optional)

**Security**:
- **WAF**: Web Application Firewall
- **Security Groups**: Least privilege access
- **IAM Roles**: Service accounts with IRSA (IAM Roles for Service Accounts)

---

## Deployment Architecture

### Kubernetes Resources

**Namespace Structure**:
```yaml
namespaces:
  - money-tracking-prod
  - money-tracking-staging
  - money-tracking-dev
  - monitoring
  - ingress-nginx
```

**Service Deployment Example**:
```yaml
# user-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: money-tracking-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        version: v1
    spec:
      serviceAccountName: user-service-sa
      containers:
      - name: user-service
        image: ecr.aws/money-tracking/user-service:v1.2.3
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: database-url
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: money-tracking-prod
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: money-tracking-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
# .github/workflows/deploy-service.yml
name: Deploy Service
on:
  push:
    branches: [main]
    paths:
      - 'services/user-service/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/user-service:$IMAGE_TAG \
            -f services/user-service/Dockerfile .
          docker push $ECR_REGISTRY/user-service:$IMAGE_TAG

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure kubectl
        run: |
          aws eks update-kubeconfig --name money-tracking-prod --region us-east-1

      - name: Deploy with Helm
        run: |
          helm upgrade --install user-service ./helm/user-service \
            --namespace money-tracking-prod \
            --set image.tag=${{ github.sha }} \
            --set replicaCount=3 \
            --wait --timeout 5m

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/user-service \
            -n money-tracking-prod --timeout=5m
```

### Disaster Recovery

**Backup Strategy**:
- **PostgreSQL**: Automated daily backups, 30-day retention, PITR enabled
- **Application Data**: S3 cross-region replication
- **Infrastructure**: Terraform state in S3 with versioning

**Recovery Objectives**:
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 5 minutes (database replication lag)

---

## Observability Architecture

### Monitoring Stack

**Prometheus + Grafana**:
```yaml
# ServiceMonitor for automatic scraping
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: user-service
spec:
  selector:
    matchLabels:
      app: user-service
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
```

**Key Metrics**:
```typescript
// RED Method (Rate, Errors, Duration)
- http_requests_total{service, endpoint, method, status}
- http_request_duration_seconds{service, endpoint}
- http_errors_total{service, endpoint, error_type}

// USE Method (Utilization, Saturation, Errors)
- cpu_usage_percent{service}
- memory_usage_bytes{service}
- disk_io_operations{service}

// Business Metrics
- transactions_processed_total{service}
- bank_syncs_completed{service, provider}
- notifications_sent_total{channel, type}
- llm_api_calls_total{model, status}
- llm_api_cost_usd{model}
```

**Grafana Dashboards**:
1. **System Overview**: Cluster health, resource utilization
2. **Service Health**: Per-service RED metrics
3. **Business KPIs**: User activity, transaction volume
4. **Cost Monitoring**: Infrastructure + API costs

### Logging Stack

**ELK Stack (Elasticsearch, Logstash, Kibana)**:
```typescript
// Structured logging format
{
  "@timestamp": "2025-12-28T10:30:00.000Z",
  "level": "info",
  "service": "user-service",
  "traceId": "abc123",
  "spanId": "def456",
  "userId": "user_789",
  "message": "User profile updated",
  "context": {
    "endpoint": "/users/789",
    "method": "PUT",
    "statusCode": 200,
    "duration": 45
  }
}
```

**Log Levels**:
- **ERROR**: Service errors, exceptions
- **WARN**: Degraded performance, retry attempts
- **INFO**: Business events, state changes
- **DEBUG**: Detailed flow (disabled in production)

**Log Retention**: 30 days (hot), 90 days (warm), 1 year (cold storage)

### Distributed Tracing

**Jaeger**:
```typescript
// OpenTelemetry instrumentation
import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(new JaegerExporter()));
provider.register();

// Trace example
const tracer = trace.getTracer('user-service');
const span = tracer.startSpan('updateUser');
try {
  await this.userRepository.update(userId, data);
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  span.end();
}
```

### Alerting

**AlertManager Rules**:
```yaml
groups:
- name: service_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_errors_total[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Service {{ $labels.service }} error rate is {{ $value }}"

  - alert: ServiceDown
    expr: up{job="user-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is down"

  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_memory_limit_bytes > 0.9
    for: 5m
    labels:
      severity: warning
```

**Notification Channels**:
- **Critical**: PagerDuty → On-call engineer
- **Warning**: Slack → #alerts channel
- **Info**: Email → Team distribution list

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | <500ms | Prometheus |
| Dashboard Load Time | <2s | Lighthouse |
| Transaction Sync Time | 1000 txns in <30s | Application metrics |
| Database Query Time (p95) | <100ms | Slow query log |
| Cache Hit Rate | >80% | Redis INFO |

### Scalability Measures

**Horizontal Scaling**:
- Kubernetes HPA based on CPU/memory
- Service instances scale 3-10 replicas
- Database read replicas for read-heavy workloads

**Database Optimization**:
- Indexed queries (see index definitions above)
- Connection pooling (PgBouncer: 100 connections)
- Query optimization (EXPLAIN ANALYZE)
- Partitioning (TimescaleDB automatic)

**Caching**:
- Redis for frequently accessed data
- LLM response caching (7-day TTL)
- API response caching (CDN + application layer)

**Asynchronous Processing**:
- Background jobs for non-critical tasks
- Message queues for event processing
- Batch processing for analytics

---

## Technology Decisions Summary

| Decision | Technology | Rationale |
|----------|-----------|-----------|
| Backend Framework | NestJS | TypeScript, modular, microservices support, large ecosystem |
| AI/ML Service | FastAPI | Python ecosystem for ML/AI, async support |
| Database | PostgreSQL | ACID compliance, JSON support, extensions (TimescaleDB, pgvector) |
| Cache | Redis | In-memory speed, pub/sub, TTL support |
| Message Broker | RabbitMQ | Reliable, proven, easier than Kafka for this scale |
| Container Orchestration | Kubernetes | Industry standard, auto-scaling, self-healing |
| Cloud Provider | AWS | Mature services, compliance certifications, wide adoption |
| Infrastructure as Code | Terraform | Cloud-agnostic, declarative, state management |
| CI/CD | GitHub Actions | Integrated with repo, flexible, cost-effective |
| Monitoring | Prometheus + Grafana | Open-source, powerful, standard for K8s |
| Logging | ELK Stack | Centralized, searchable, scalable |
| Tracing | Jaeger | OpenTelemetry compatible, distributed tracing |
| Frontend | Next.js | SSR, React, TypeScript, excellent DX |
| Bank APIs | Plaid | Market leader, comprehensive coverage |
| LLM Provider | OpenAI/Anthropic | Best-in-class models, reliable APIs |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Chief Architect | ___________ | ___________ | _____ |
| Technical Lead | ___________ | ___________ | _____ |
| DevOps Lead | ___________ | ___________ | _____ |
| Security Lead | ___________ | ___________ | _____ |

---

## Next Steps

1. **Week 1-2**: Infrastructure setup (Terraform, EKS, databases)
2. **Week 3-4**: Core services development (Auth, User, Bank)
3. **Week 5-8**: Feature services (Transaction, Analytics, Budget)
4. **Week 9-10**: Notification service, frontend integration
5. **Week 11-12**: Testing, security audit, performance tuning
6. **Week 13**: Beta release

---

*This document will be updated as architectural decisions evolve.*
