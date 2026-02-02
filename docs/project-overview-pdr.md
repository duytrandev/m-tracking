# M-Tracking Project Overview & Requirements

**Version**: 1.0 | **Last Updated**: February 1, 2026 | **Status**: Phase 1 MVP

---

## Executive Summary

M-Tracking is an AI-powered personal finance management platform that automatically aggregates bank transactions, provides intelligent spending insights through LLM technology, and delivers a hybrid Telegram bot + web dashboard experience. The MVP (Phase 1) focuses on establishing a 26-week foundation with core features for transaction aggregation, AI-powered categorization, budget management, and dual-interface support (web + Telegram).

---

## Product Vision

Eliminate manual transaction tracking by integrating directly with banking APIs (Plaid, Tink, momo.vn, Stripe), while supporting manual entry for cash/untracked accounts via Telegram chat. Enable real-time financial awareness and better spending control through intelligent AI-powered insights delivered via web dashboard and Telegram bot.

---

## Target Users

**Primary Audience:**

- Young professionals (25-35): Tech-savvy, expect modern UX, want automated tracking
- Family budget managers (35-50): Manage household finances, need visibility into spending
- Freelancers & gig workers: Variable income, need cash flow visibility

**Common Needs:**

- Automatic transaction collection (bank APIs + manual Telegram entry)
- Clear spending categorization (AI-powered)
- Budget creation and tracking with real-time alerts
- Visual dashboards and reports (web + Telegram bot)
- Multi-account support
- Secure bank connections
- Proactive notifications via Telegram

---

## Phase 1 MVP Scope (26 Weeks)

### Core Features Implemented

**Authentication & Onboarding (Epic 1)**

- Email/password registration with email verification
- OAuth login (Google, GitHub, Facebook)
- 2FA (TOTP) support
- Password reset flow
- Profile management (name, email, language, currency preferences)
- Multi-language support (English, Vietnamese)
- JWT-based session management (15m access, 7d refresh tokens)

**Bank Integration & Transaction Collection (Epic 2)**

- Plaid API integration (US banks)
- Tink API integration (European banks)
- MoMo API integration (Vietnam e-wallet)
- Stripe transaction API support
- Automatic transaction sync with conflict detection
- Transaction list with search, filtering, pagination

**Money Management (Epic 3)**

- 4-tier AI categorization strategy (cache → user history → global DB → LLM)
- Manual category override with learning feedback
- Category-based budgets (monthly periods)
- Budget threshold alerts (80%, 100%, 120%)
- Real-time budget calculations
- Transaction duplicate detection
- Manual transaction entry via Telegram

**Dashboard & Reporting (Epic 4)**

- Real-time spending overview (current month summary)
- Interactive charts (Recharts): line, bar, pie charts
- Category breakdown and drill-down views
- Budget progress indicators with alerts
- Month-over-month comparison reports
- AI chat assistant for natural language queries
- Transaction list with search/filter/sort
- Responsive design (mobile browser support)

**Telegram Bot System (Epic 6)**

- Slash commands: /spending, /budget, /analyze, /add, /settings, /help
- Manual transaction entry (natural language + slash command)
- Daily check-in summaries (opt-in, user-configurable time)
- Proactive notifications (large transactions, budget alerts, anomalies)
- AI-powered financial analysis via chat
- Customizable notification preferences
- Bilingual support (English/Vietnamese)

**Infrastructure & DevOps (Epic 5)**

- Docker Compose setup (PostgreSQL, Redis, RabbitMQ)
- CI/CD pipeline (GitHub Actions)
- Environment configuration
- Monitoring setup (Sentry for error tracking)
- Graceful error handling and logging

---

## Success Metrics

### User Engagement

- 70% of users connect ≥1 bank account within 7 days
- 60% of users create a budget within 14 days
- 50% of users link Telegram account within first week
- 80% of users return weekly (dashboard OR bot)
- 40%+ notification engagement rate via Telegram
- 60% AI chat engagement monthly

### Technical Performance

- Dashboard loads in <2 seconds (p95)
- Transaction sync success rate >95%
- System uptime >99.9%
- API response time (p95) <500ms
- LLM categorization latency <3 seconds per batch

### Business KPIs

- 10,000 active users within 12 months
- 30-day user retention >60%
- LLM API costs <$0.10 per user per month (95%+ cache hit rate)
- Infrastructure cost per user <$1.00 per month

---

## Key Technical Decisions

### Authentication

- RS256 JWT signing (asymmetric, harder to forge)
- Session tracking with device info + IP address
- Token blacklisting via Redis
- Rate limiting on auth endpoints (5/min)

### AI Categorization (4-Tier Strategy)

- **Tier 1**: Redis cache (80%+ hit rate, 0 cost)
- **Tier 2**: User historical patterns (10% hit rate)
- **Tier 3**: Global merchant database (5% hit rate)
- **Tier 4**: LLM API call (5% usage, <$0.10/user/month)

### Budget Calculation

- Monthly periods (1st to last day of month)
- Real-time spent calculation (excludes pending by default)
- Customizable rollover and alert thresholds
- Pending transaction inclusion (user preference)

### Data Storage

- PostgreSQL 17 for relational data + TimescaleDB for time-series
- JSONB columns for flexible data (preferences, device info)
- Strategic indexes (user_id, category_id, date, email)
- UUID primary keys for distributed systems

### Caching Strategy

- Redis for transaction summaries (5-min TTL)
- User session caching with device info
- Token blacklisting with automatic expiry
- Rate limit tracking with per-minute reset

---

## Phase 2 Post-Launch Enhancements (Triggered at 10K+ users)

- **Multi-Currency Support** (3 weeks): VND, EUR, GBP with real-time exchange rates
- **Mobile Native Apps** (8-12 weeks): React Native/Flutter for iOS and Android
- **Investment Tracking** (4 weeks): Brokerage account integration
- **Advanced Analytics** (4 weeks): Cash flow forecasting, spending predictions

---

## Currency & Localization

**Phase 1 (MVP):**

- Currency: USD only (non-configurable)
- Language: English and Vietnamese
- Date/time formatting per locale
- Telegram bot messages localized

**Phase 2:**

- Multi-currency support (USD, VND, EUR, GBP)
- Real-time exchange rate integration
- Historical rate preservation
- Currency-specific formatting

---

## Security & Compliance

**Authentication:**

- Passwords: bcrypt (cost 12)
- Email verification required
- 2FA available for security-conscious users

**Data Protection:**

- Encryption in transit (TLS 1.2+)
- Encryption at rest (AES-256 for sensitive fields)
- PII masking in logs

**Session Management:**

- Multi-device support
- Manual session termination
- Concurrent session limits (configuration-driven)
- Device tracking (browser, OS, IP)

**Privacy:**

- GDPR-compliant data retention
- 30-day grace period for account deletion
- Audit log retention (7 years)
- User can revoke all sessions anytime

---

## External Integrations

| Service          | Type         | Status               | Notes                                |
| ---------------- | ------------ | -------------------- | ------------------------------------ |
| Plaid            | Bank API     | Implemented          | US banks, OAuth flow                 |
| Tink             | Bank API     | Infrastructure ready | European banks                       |
| MoMo             | Payment API  | Infrastructure ready | Vietnam e-wallet                     |
| Stripe           | Transactions | Infrastructure ready | Payment processing                   |
| OpenAI           | LLM          | Integrated           | Transaction categorization           |
| Anthropic Claude | LLM          | Available            | Alternative to OpenAI                |
| Sentry           | Monitoring   | Partial              | Error tracking (partial integration) |
| Telegram         | Bot Platform | Implemented          | Slash commands, notifications        |

---

## Known Limitations & Placeholders

**Ready for Implementation:**

- Email service (skeleton exists, needs provider integration)
- 2FA complete setup (TOTP fields present, logic ready)
- Notifications module (placeholder, ready for Telegram integration)
- Banking module (placeholder, ready for Plaid/Tink integration)
- Budgets module (placeholder, ready for logic implementation)

**Out of Phase 1 Scope:**

- Mobile native apps (Phase 2)
- Multi-currency support (Phase 2)
- Investment tracking (Phase 2)
- Bill payment integration (Phase 3+)

---

## Implementation Timeline

**Weeks 1-2**: Setup & Configuration
**Weeks 3-6**: Authentication & Onboarding (Epic 1)
**Weeks 7-10**: Bank Integration & Transaction Collection (Epic 2)
**Weeks 9-14**: Money Management Core (Epic 3)
**Weeks 15-19**: Telegram Bot System (Epic 6, parallel with Epic 4)
**Weeks 17-20**: Dashboard & Reporting (Epic 4)
**Weeks 1-26**: Infrastructure & DevOps (Epic 5, ongoing)

**Total Stories**: ~127-132 user stories across 6 epics

---

## Acceptance Criteria (MVP Ready)

- All 6 Phase 1 epics completed and tested
- 95%+ AI categorization accuracy with cache hit rate >95%
- Dashboard loads <2 seconds (p95)
- All API endpoints respond <500ms (p95)
- > 95% transaction sync success rate
- Telegram bot fully functional with 7+ slash commands
- Bilingual UI (English/Vietnamese) complete
- Security audit passed (OWASP Top 10)
- Monitoring and error tracking operational
- CI/CD pipeline fully automated
- Documentation complete and accurate

---

## Team Composition (Recommended)

- 2x Senior Backend Engineers (NestJS, PostgreSQL)
- 2x Senior Frontend Engineers (React, Next.js)
- 1x DevOps/SRE Engineer
- 1x Python/ML Engineer (Analytics, LLM)
- 1x QA Engineer
- 1x Product Manager

---

## Success Definition

**Launch Readiness:**

- All epics 95%+ complete
- Zero critical/high severity bugs
- Performance targets achieved (load time <2s, API <500ms)
- > 60% user engagement in week 1
- > 40% Telegram adoption within first 7 days

**First 12 Months:**

- 10,000 active users
- > 60% 30-day retention
- <$1/user/month infrastructure cost
- > 99.9% system uptime
- <$0.10/user/month LLM costs

---

## Dependencies & Assumptions

**Technical Dependencies:**

- PostgreSQL 17 with TimescaleDB extension
- Redis 7 for caching/sessions
- RabbitMQ 3.12 for background jobs
- Node.js 20.10.0+, Python 3.12+

**External Integrations:**

- Plaid API access (US banks)
- OpenAI or Anthropic API (LLM)
- Telegram Bot API
- Email service provider (SendGrid/SMTP)

**Assumptions:**

- Users have at least one bank account
- Primary market is US (Phase 1)
- Users comfortable with Telegram bot interface
- LLM API costs scale linearly with users
- Infrastructure can scale horizontally

---

## Risk Mitigation

| Risk                      | Impact | Mitigation                               |
| ------------------------- | ------ | ---------------------------------------- |
| Plaid API delays          | High   | Have Tink/MoMo ready as fallback         |
| LLM API cost overruns     | High   | 4-tier caching strategy, cost monitoring |
| User adoption of Telegram | Medium | Web dashboard as primary fallback        |
| Data sync reliability     | High   | Duplicate detection, transaction audits  |
| Performance degradation   | High   | Caching strategy, read replicas, CDN     |

---

## Notes for Development

- All authentication methods fully implemented in backend (OAuth, email/password, 2FA ready)
- Frontend has comprehensive auth UI with 13+ components
- Mock Service Worker (MSW) configured for testing without backend
- TypeScript strict mode enforced across all services
- Pre-commit hooks validate formatting and linting
- Environment configuration supports multiple deployment contexts (dev/staging/prod)

---

**Related Documents:**

- [docs/system-architecture.md](./system-architecture.md) - Detailed system design
- [docs/codebase-summary.md](./codebase-summary.md) - Code organization
- [docs/code-standards.md](./code-standards.md) - Development standards
- [docs/prd.md](./prd.md) - Complete product requirements
