# M-Tracking - Product Development Requirements & Project Overview

**Version:** 1.0.0 | **Status:** Active Development | **Last Updated:** January 21, 2026

---

## 1. Vision & Objectives

### Vision Statement

M-Tracking is an AI-powered personal finance management platform that eliminates manual transaction tracking by integrating directly with banking APIs, Telegram bots, and intelligent LLM-driven insights to help users achieve real-time financial awareness and better control over spending.

### Primary Objectives

1. **Reduce Financial Friction** - Automatic transaction aggregation eliminates manual entry overhead
2. **Provide Actionable Insights** - LLM-powered analysis reveals spending patterns and opportunities
3. **Support Multi-Channel Access** - Telegram bot for chat-based entry + web dashboard for dashboard views
4. **Enable Global Users** - Multi-currency and multi-language support with local payment integrations

---

## 2. Target Users & Use Cases

### Primary Users

- **Personal Finance Enthusiasts** - Age 25-45, tech-savvy, wants financial control
- **Expat Communities** - Managing multi-currency expenses (Vietnam, Asia region focus)
- **Small Business Owners** - Tracking personal and business expenses

### Use Cases

#### Use Case 1: Automatic Transaction Tracking

**Actor:** User
**Flow:**

1. User connects bank account via Plaid/Tink
2. System auto-syncs transactions daily
3. Transactions categorized by LLM
4. Dashboard displays spending overview

#### Use Case 2: Manual Entry via Telegram

**Actor:** User
**Flow:**

1. User sends `/expense $50 coffee @meals` to bot
2. Bot parses amount, merchant, category
3. Transaction recorded to dashboard
4. Weekly summary report sent

#### Use Case 3: Spending Analytics

**Actor:** User
**Flow:**

1. User opens dashboard
2. Views spending charts (by category, by merchant)
3. Receives AI-driven insights ("Increased coffee spending 23% vs last month")
4. Adjusts budget or spending behavior

---

## 3. Core Features & Capabilities

### Feature Set - Phase 1 (Current)

#### 3.1 Authentication & Authorization

- Email/password registration with verification
- OAuth 2.0 integration (Google, GitHub, Facebook)
- Two-factor authentication (TOTP)
- Magic link passwordless login
- Session management with device tracking

#### 3.2 Transaction Management

- Manual transaction entry (amount, category, merchant, date, description)
- Transaction listing with filtering (date range, category, amount)
- Transaction categorization (10 predefined + custom)
- Spending summary aggregation (daily, weekly, monthly)
- Transaction search and sorting

#### 3.3 Web Dashboard

- Next.js-based responsive UI
- Dashboard overview (spending widgets, charts)
- Transaction list page with filters
- User profile & settings management
- Preferences (theme, language, notifications)
- Security settings (password, 2FA, sessions)

#### 3.4 Budget Management (Placeholder)

- Budget creation by category
- Period-based budgets (weekly, monthly, yearly)
- Budget vs actual spending comparison
- Alert thresholds (80%, 100%)

### Feature Set - Phase 2 (Planned)

#### 3.5 Bank Account Integration

- Plaid integration (US, EU banks)
- Tink integration (European banks)
- MoMo integration (Vietnam payments)
- Real-time transaction sync
- Account balance tracking
- Multi-account support

#### 3.6 Telegram Bot Interface

- Natural language transaction entry
- Transaction parsing via LLM
- Weekly spending reports
- Budget alerts
- Account management commands

#### 3.7 AI-Powered Insights

- Transaction categorization using LLM
- Spending pattern analysis
- Merchant learning (auto-categorization)
- Anomaly detection (unusual spending)
- Personalized recommendations

---

## 4. Technical Requirements

### 4.1 Functional Requirements (FR)

| ID   | Requirement                            | Priority | Status      |
| ---- | -------------------------------------- | -------- | ----------- |
| FR1  | Users can register and authenticate    | Critical | Implemented |
| FR2  | Users can manually enter transactions  | Critical | Implemented |
| FR3  | Users can view transaction history     | High     | Implemented |
| FR4  | System categorizes transactions        | High     | In Progress |
| FR5  | Users can connect bank accounts        | High     | Placeholder |
| FR6  | Users can manage budgets               | Medium   | Placeholder |
| FR7  | Telegram bot accepts transaction input | Medium   | Placeholder |
| FR8  | System sends AI-powered insights       | Medium   | Placeholder |
| FR9  | Users can export transaction data      | Low      | Planned     |
| FR10 | System syncs transactions in real-time | High     | Placeholder |

### 4.2 Non-Functional Requirements (NFR)

| ID   | Requirement            | Target                | Implementation                   |
| ---- | ---------------------- | --------------------- | -------------------------------- |
| NFR1 | Authentication latency | < 200ms               | JWT with caching                 |
| NFR2 | Dashboard load time    | < 1s                  | Code splitting + Redis caching   |
| NFR3 | Availability           | 99.5%                 | RabbitMQ queuing + failover      |
| NFR4 | Data security          | End-to-end encryption | Bcrypt passwords, RS256 JWT      |
| NFR5 | Concurrent users       | 10,000+               | Horizontal scaling with Nx cache |
| NFR6 | Database connections   | 10-50 pool            | TypeORM connection pooling       |
| NFR7 | Rate limiting          | 10 req/60s            | Global throttler                 |
| NFR8 | Error tracking         | 100% of 5xx           | Sentry integration               |

### 4.3 Technology Stack

| Layer          | Technology       | Version | Purpose              |
| -------------- | ---------------- | ------- | -------------------- |
| **Frontend**   | Next.js          | 16.1    | Web dashboard + SSR  |
| **Backend**    | NestJS           | 11.1    | API server           |
| **Analytics**  | FastAPI          | 0.110   | LLM operations       |
| **Database**   | PostgreSQL       | 17.7    | Data persistence     |
| **Cache**      | Redis            | 7       | Session + caching    |
| **Queue**      | RabbitMQ         | 3.12    | Job processing       |
| **Auth**       | Passport.js      | 0.7     | Authentication       |
| **ORM**        | TypeORM          | 0.3     | Database abstraction |
| **LLM**        | OpenAI/Anthropic | Latest  | Text analysis        |
| **Monitoring** | Sentry           | 10.35   | Error tracking       |
| **Deployment** | Docker           | Latest  | Containerization     |

---

## 5. System Architecture Overview

### 5.1 Architecture Pattern

**Hybrid Modular Monolith** with specialized service:

- NestJS monolith handles auth, transactions, budgets, banking
- FastAPI service handles AI/LLM operations
- Frontend (Next.js) for web dashboard
- Telegram bot as external interface

### 5.2 High-Level Diagram

```
Frontend (Next.js:3000)
    ↓
Backend API (NestJS:4000) ← TanStack Query
    ├─ Auth Module
    ├─ Transactions Module
    ├─ Budgets Module
    ├─ Banking Module
    └─ Notifications Module
        ↓
    Database (PostgreSQL)
    Redis Cache
    RabbitMQ Queue
        ↓
Analytics Service (FastAPI:5000)
    └─ LLM Integration
        (OpenAI/Anthropic)
        ↓
External Services
    ├─ Plaid (Bank sync)
    ├─ Tink (Bank sync)
    ├─ MoMo (Vietnam payments)
    ├─ Telegram Bot API
    └─ Sentry (Monitoring)
```

### 5.3 Data Flow

1. **Authentication**: User login → JWT token → TanStack Query caching
2. **Transactions**: Manual entry → Backend validation → PostgreSQL storage
3. **Bank Sync**: Scheduled job → Plaid API → Transaction creation
4. **Categorization**: New transaction → LLM → Redis cache → Category assignment
5. **Analytics**: User request → Backend aggregation → Dashboard visualization

---

## 6. Success Metrics

### 6.1 Technical Metrics

- **Build Time**: < 2 minutes (cached)
- **API Response Time**: p99 < 200ms
- **Test Coverage**: > 80% critical paths
- **Type Safety**: 0 implicit any types
- **Linting Score**: 100% pass on CI

### 6.2 Business Metrics

- **User Adoption**: 1,000+ registered users (first quarter)
- **Active DAU**: 300+ daily active users
- **Retention**: 60% 30-day retention
- **Transaction Volume**: 10,000+ transactions/month
- **Feature Adoption**: 70% use at least 2 features

### 6.3 Quality Metrics

- **System Uptime**: 99.5%
- **Mean Time to Recovery**: < 5 minutes
- **Security Incidents**: 0 (zero tolerance)
- **Critical Bugs**: 0 in production
- **User Satisfaction**: > 4.5/5 stars

---

## 7. Security & Compliance

### 7.1 Authentication & Authorization

- **Password Policy**: bcrypt with cost 12, minimum 12 characters
- **JWT Tokens**: RS256 asymmetric, 15-minute expiry
- **Refresh Tokens**: httpOnly cookies, 14-day expiry
- **Session Tracking**: Device fingerprinting, IP logging
- **RBAC**: Role-based access control (admin, user, guest)

### 7.2 Data Protection

- **Encryption in Transit**: HTTPS/TLS only
- **Encryption at Rest**: Database encryption via Supabase
- **PII Handling**: Never log passwords, tokens, credit cards
- **Data Retention**: User data deleted 30 days after account closure
- **GDPR Compliance**: Right to export, right to deletion

### 7.3 API Security

- **Rate Limiting**: 10 requests per 60 seconds globally
- **CORS**: Frontend origin only
- **Helmet**: Security headers enabled
- **Input Validation**: DTOs with whitelist mode
- **SQL Injection**: TypeORM parameterized queries

### 7.4 Secrets Management

- **JWT Keys**: RSA key pairs (not committed)
- **Database Credentials**: Via environment variables
- **API Keys**: OAuth secrets, LLM keys via .env
- **Rotation**: Plan for key rotation quarterly

---

## 8. Deployment & Infrastructure

### 8.1 Development Environment

- Docker Compose with PostgreSQL, Redis, RabbitMQ
- Nx monorepo with incremental builds
- Hot-reload for backend/frontend/analytics
- Local Sentry mock for error testing

### 8.2 Staging Environment

- Supabase PostgreSQL
- Staging Redis cluster
- Staging Sentry project
- Feature branch CI/CD

### 8.3 Production Environment

- Kubernetes cluster or Docker Swarm
- RDS PostgreSQL (managed)
- ElastiCache Redis (managed)
- CloudFront CDN for frontend assets
- Production Sentry with alerts

---

## 9. Project Timeline & Milestones

### Phase 1: MVP (Completed)

- Duration: 4 weeks
- Status: 85% complete
- Deliverables:
  - Authentication system
  - Transaction management
  - Web dashboard
  - Basic categorization

### Phase 2: Banking Integration (Current)

- Duration: 6 weeks
- Start: Late January 2026
- Deliverables:
  - Plaid integration
  - Tink integration
  - Real-time sync
  - MoMo integration (Vietnam)

### Phase 3: AI & Insights

- Duration: 4 weeks
- Start: March 2026
- Deliverables:
  - LLM transaction analysis
  - Spending patterns
  - AI-powered recommendations
  - Anomaly detection

### Phase 4: Telegram Bot

- Duration: 3 weeks
- Start: April 2026
- Deliverables:
  - Transaction entry via chat
  - Budget alerts
  - Weekly reports
  - Account management commands

### Phase 5: Production Launch

- Duration: 2 weeks
- Start: May 2026
- Deliverables:
  - Production deployment
  - User documentation
  - Support setup
  - Marketing materials

---

## 10. Risk Assessment

| Risk                          | Impact   | Probability | Mitigation                                     |
| ----------------------------- | -------- | ----------- | ---------------------------------------------- |
| **Banking API Delays**        | Critical | Medium      | Parallel testing with sandbox APIs             |
| **LLM Categorization Errors** | High     | High        | Manual verification, user feedback loop        |
| **Data Privacy Breach**       | Critical | Low         | Regular security audits, penetration testing   |
| **Performance Degradation**   | High     | Medium      | Load testing, caching optimization             |
| **Team Availability**         | Medium   | Low         | Documentation, knowledge sharing               |
| **Scope Creep**               | High     | Medium      | Strict sprint planning, feature prioritization |

---

## 11. Dependencies & Blockers

### External Dependencies

- Plaid API availability and pricing
- Tink API availability and pricing
- MoMo Vietnam integration requirements
- Telegram Bot API rate limits
- OpenAI/Anthropic API quotas

### Internal Dependencies

- PostgreSQL setup with Supabase
- Redis infrastructure availability
- RabbitMQ queue service
- Sentry project configuration

### Known Blockers

- None currently (Phase 2 ready to start)

---

## 12. Success Criteria

### Definition of Done

- [ ] All user stories implemented
- [ ] Unit tests pass (> 80% coverage)
- [ ] E2E tests pass
- [ ] Code review approved
- [ ] Documentation updated
- [ ] No critical bugs reported

### Go-Live Criteria

- [ ] 99.5% uptime in staging for 7 days
- [ ] Load testing completed (10,000+ concurrent)
- [ ] Security audit passed
- [ ] User documentation complete
- [ ] Support team trained
- [ ] Runbooks for common issues documented

---

## Appendix: Glossary

- **DAU**: Daily Active Users
- **MoM**: Month-over-Month growth
- **NFR**: Non-Functional Requirement
- **Plaid**: Banking API platform
- **Tink**: European banking API
- **MoMo**: Vietnamese mobile money service
- **LLM**: Large Language Model
- **RBAC**: Role-Based Access Control
- **RS256**: RSA asymmetric signing algorithm
- **GDPR**: General Data Protection Regulation

---

**Document Version Control:**

- v1.0: Initial PDR created (Jan 21, 2026)
- v1.1: Planning (pending)
