# Database Design Document

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2025-12-28 | Database Architect | Draft |

## Table of Contents
1. [Overview](#overview)
2. [Database Strategy](#database-strategy)
3. [Schema Design by Service](#schema-design-by-service)
4. [Data Relationships](#data-relationships)
5. [Indexes & Performance](#indexes--performance)
6. [Data Migration Strategy](#data-migration-strategy)
7. [Backup & Recovery](#backup--recovery)

---

## Overview

### Database Architecture
- **Pattern**: Database-per-Service (logical separation, can share physical instance initially)
- **Primary Database**: PostgreSQL 15
- **Extensions**: TimescaleDB (time-series), pgvector (embeddings), pg_stat_statements (monitoring)
- **Cache**: Redis 7 (sessions, rate limiting, cache)
- **Search**: Elasticsearch (optional, Phase 2)

### Connection Pooling
```yaml
Application → PgBouncer → PostgreSQL

PgBouncer Configuration:
  - Mode: Transaction pooling
  - Max connections: 100
  - Default pool size: 20 per service
  - Server lifetime: 3600s
  - Server idle timeout: 600s
```

---

## Database Strategy

### Service Database Ownership

| Service | Database Schema | Tables | Purpose |
|---------|----------------|--------|---------|
| User Service | `user_schema` | users, user_preferences | User management |
| Auth Service | Redis | sessions, tokens | Authentication state |
| Bank Service | `bank_schema` | bank_connections, bank_accounts | Bank integrations |
| Transaction Service | `transaction_schema` | transactions | Transaction data (TimescaleDB) |
| Analytics Service | `analytics_schema` | insights, merchant_categories, embeddings | AI/ML data |
| Budget Service | `budget_schema` | budgets, budget_utilization, savings_goals | Budget management |
| Notification Service | `notification_schema` | notifications, notification_rules | Notification logs |

### Shared Database vs Separate Instances

**Phase 1 (MVP)**: Single PostgreSQL instance with separate schemas
- **Pros**: Lower cost, simpler ops, easier cross-schema queries (if needed)
- **Cons**: Service coupling, resource contention

**Phase 2 (Scale)**: Separate PostgreSQL instances per service
- **Pros**: True isolation, independent scaling, failure isolation
- **Cons**: Higher cost, complex joins impossible, eventual consistency required

---

## Schema Design by Service

### 1. User Service Schema

```sql
-- ============================================
-- USER SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS user_schema;
SET search_path TO user_schema;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP NULL,

  -- Profile
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT FALSE,

  -- Settings
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',
  locale VARCHAR(10) DEFAULT 'en-US',

  -- Security
  password_hash VARCHAR(255), -- NULL for OAuth-only users
  password_changed_at TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),

  -- Metadata
  last_login_at TIMESTAMP,
  last_login_ip INET,
  login_count INT DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- OAuth connections
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'apple', 'facebook'
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  profile_data JSONB,
  connected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Notifications
  notification_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  telegram_notifications BOOLEAN DEFAULT TRUE,
  telegram_chat_id VARCHAR(255),
  telegram_username VARCHAR(255),

  -- Notification schedule
  daily_summary_enabled BOOLEAN DEFAULT TRUE,
  daily_summary_time TIME DEFAULT '09:00',
  weekly_report_enabled BOOLEAN DEFAULT TRUE,
  weekly_report_day VARCHAR(10) DEFAULT 'Monday',

  -- Alerts
  transaction_alert_enabled BOOLEAN DEFAULT TRUE,
  transaction_alert_threshold DECIMAL(10,2) DEFAULT 500.00,
  budget_alert_enabled BOOLEAN DEFAULT TRUE,
  budget_alert_thresholds DECIMAL[] DEFAULT ARRAY[0.8, 1.0, 1.2],

  -- Other preferences
  dashboard_layout JSONB DEFAULT '{}',
  custom_categories JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_oauth_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_provider ON oauth_connections(provider, provider_user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_updated_at BEFORE UPDATE ON oauth_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. Bank Service Schema

```sql
-- ============================================
-- BANK SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS bank_schema;
SET search_path TO bank_schema;

-- Bank connections (Plaid/Tink items)
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Reference to user_schema.users

  -- Provider info
  provider VARCHAR(50) NOT NULL, -- 'plaid', 'tink', 'open_banking'
  provider_item_id VARCHAR(255) NOT NULL, -- Plaid item_id, Tink item_id

  -- Institution info
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  institution_logo_url TEXT,

  -- Credentials (encrypted)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,

  -- Connection status
  status VARCHAR(50) DEFAULT 'active', -- active, error, disconnected, requires_update
  error_code VARCHAR(100),
  error_message TEXT,
  consent_expires_at TIMESTAMP, -- For Open Banking (90 days)

  -- Sync info
  last_sync_at TIMESTAMP,
  last_sync_status VARCHAR(50), -- success, partial, failed
  last_successful_sync_at TIMESTAMP,
  sync_cursor VARCHAR(255), -- For incremental syncs

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(provider, provider_item_id)
);

-- Bank accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Denormalized for quick lookups

  -- Account identification
  provider_account_id VARCHAR(255) NOT NULL,
  account_type VARCHAR(50), -- checking, savings, credit, investment, loan
  account_subtype VARCHAR(50), -- checking, money_market, cd, etc.

  -- Account details
  account_name VARCHAR(255),
  account_official_name VARCHAR(255),
  account_mask VARCHAR(10), -- Last 4 digits

  -- Balances
  current_balance DECIMAL(15,2),
  available_balance DECIMAL(15,2),
  credit_limit DECIMAL(15,2), -- For credit cards
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, closed
  is_manual BOOLEAN DEFAULT FALSE, -- Manual account entry (Phase 2)

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  balance_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(connection_id, provider_account_id)
);

-- Sync history (audit trail)
CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'retry'
  status VARCHAR(50) NOT NULL, -- 'started', 'success', 'failed', 'partial'
  transactions_added INT DEFAULT 0,
  transactions_updated INT DEFAULT 0,
  error_code VARCHAR(100),
  error_message TEXT,
  duration_ms INT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_bank_connections_user ON bank_connections(user_id) WHERE status = 'active';
CREATE INDEX idx_bank_connections_status ON bank_connections(status);
CREATE INDEX idx_bank_connections_last_sync ON bank_connections(last_sync_at);
CREATE INDEX idx_bank_accounts_user ON bank_accounts(user_id) WHERE status = 'active';
CREATE INDEX idx_bank_accounts_connection ON bank_accounts(connection_id);
CREATE INDEX idx_sync_history_connection ON sync_history(connection_id, started_at DESC);

-- Triggers
CREATE TRIGGER update_bank_connections_updated_at BEFORE UPDATE ON bank_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 3. Transaction Service Schema

```sql
-- ============================================
-- TRANSACTION SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS transaction_schema;
SET search_path TO transaction_schema;

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Transactions table (hypertable)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Reference to user_schema.users
  account_id UUID NOT NULL, -- Reference to bank_schema.bank_accounts

  -- Provider info
  provider VARCHAR(50) NOT NULL, -- 'plaid', 'tink', 'manual'
  provider_transaction_id VARCHAR(255) NOT NULL,

  -- Transaction details
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  direction VARCHAR(10) NOT NULL, -- 'debit' (expense), 'credit' (income)

  -- Merchant info
  merchant_name VARCHAR(255),
  merchant_logo_url TEXT,

  -- Description
  description TEXT,
  original_description TEXT, -- Provider's original description

  -- Categorization
  category VARCHAR(100), -- Auto-categorized
  category_detailed VARCHAR(100), -- Sub-category
  category_confidence DECIMAL(3,2), -- 0.00 to 1.00
  user_category VARCHAR(100), -- User override
  category_method VARCHAR(50) DEFAULT 'auto', -- auto, user, rule

  -- Location
  location_address VARCHAR(500),
  location_city VARCHAR(100),
  location_region VARCHAR(100),
  location_postal_code VARCHAR(20),
  location_country VARCHAR(2),
  location_lat DECIMAL(10,8),
  location_lon DECIMAL(11,8),

  -- Dates
  transaction_date DATE NOT NULL,
  authorized_date DATE,
  posted_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'posted', -- pending, posted, cancelled
  is_pending BOOLEAN DEFAULT FALSE,

  -- Flags
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID, -- References another transaction
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_series_id UUID, -- Groups recurring transactions

  -- User annotations
  notes TEXT,
  tags TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}',
  payment_meta JSONB, -- Payment method, reference number, etc.

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(provider_transaction_id, account_id)
);

-- Convert to TimescaleDB hypertable (partitioned by transaction_date)
SELECT create_hypertable(
  'transactions',
  'transaction_date',
  chunk_time_interval => INTERVAL '1 month',
  if_not_exists => TRUE
);

-- Retention policy (keep 5 years, then archive or delete)
SELECT add_retention_policy('transactions', INTERVAL '5 years');

-- Compression policy (compress chunks older than 6 months)
ALTER TABLE transactions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'user_id',
  timescaledb.compress_orderby = 'transaction_date DESC'
);

SELECT add_compression_policy('transactions', INTERVAL '6 months');

-- Transaction categories (reference data)
CREATE TABLE categories (
  id VARCHAR(100) PRIMARY KEY,
  parent_id VARCHAR(100) REFERENCES categories(id),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7), -- Hex color
  type VARCHAR(20) DEFAULT 'expense', -- expense, income, transfer
  is_default BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User custom categories
CREATE TABLE user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  icon VARCHAR(50),
  color VARCHAR(7),
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Recurring transaction patterns
CREATE TABLE recurring_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  merchant_name VARCHAR(255),
  amount_min DECIMAL(15,2),
  amount_max DECIMAL(15,2),
  frequency VARCHAR(20), -- weekly, biweekly, monthly, quarterly, yearly
  last_transaction_date DATE,
  next_expected_date DATE,
  confidence DECIMAL(3,2),
  transaction_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes (TimescaleDB automatically creates chunk-specific indexes)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category) WHERE category IS NOT NULL;
CREATE INDEX idx_transactions_merchant ON transactions(merchant_name) WHERE merchant_name IS NOT NULL;
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_pending ON transactions(is_pending) WHERE is_pending = TRUE;
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_transactions_search ON transactions
  USING gin(to_tsvector('english', coalesce(description, '') || ' ' || coalesce(merchant_name, '')));

-- Triggers
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Materialized view for quick category summaries
CREATE MATERIALIZED VIEW monthly_category_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', transaction_date) AS month,
  COALESCE(user_category, category) AS category,
  direction,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count,
  AVG(amount) AS avg_amount
FROM transactions
WHERE status = 'posted'
GROUP BY user_id, DATE_TRUNC('month', transaction_date), COALESCE(user_category, category), direction;

CREATE UNIQUE INDEX ON monthly_category_summary(user_id, month, category, direction);
CREATE INDEX ON monthly_category_summary(user_id, month);

-- Refresh policy (daily at 2 AM)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('refresh-monthly-summary', '0 2 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY transaction_schema.monthly_category_summary');
```

---

### 4. Analytics Service Schema

```sql
-- ============================================
-- ANALYTICS SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS analytics_schema;
SET search_path TO analytics_schema;

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Insights generated by LLM
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Insight type
  type VARCHAR(50) NOT NULL, -- 'savings_opportunity', 'spending_spike', 'forecast', 'category_trend'
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high

  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  actionable_advice TEXT,

  -- Data
  data JSONB DEFAULT '{}', -- Supporting data (charts, numbers)
  affected_categories TEXT[],
  time_period_start DATE,
  time_period_end DATE,

  -- User interaction
  viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP,
  feedback VARCHAR(20), -- 'helpful', 'not_helpful'

  -- Metadata
  generated_by VARCHAR(50) DEFAULT 'llm', -- llm, rule_engine
  model_version VARCHAR(50),
  confidence DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Insights can be time-sensitive

  CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high'))
);

-- Merchant category mappings (cached from LLM)
CREATE TABLE merchant_categories (
  merchant_name VARCHAR(255) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  category_detailed VARCHAR(100),
  confidence DECIMAL(3,2),
  sample_description TEXT,
  categorized_by VARCHAR(50) DEFAULT 'llm', -- llm, user, rule
  user_count INT DEFAULT 1, -- How many users validated this
  last_seen_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction embeddings (for semantic search)
CREATE TABLE transaction_embeddings (
  transaction_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embedding size
  embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
  text_content TEXT, -- What was embedded
  created_at TIMESTAMP DEFAULT NOW()
);

-- Spending patterns (ML-detected patterns)
CREATE TABLE spending_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_type VARCHAR(50), -- 'seasonal', 'day_of_week', 'time_of_day', 'location_based'
  category VARCHAR(100),
  merchant_name VARCHAR(255),

  -- Pattern details
  pattern_data JSONB NOT NULL, -- Pattern-specific data
  frequency VARCHAR(50),
  avg_amount DECIMAL(15,2),

  -- Confidence
  confidence DECIMAL(3,2),
  sample_size INT, -- Number of transactions used to detect pattern

  -- Timestamps
  first_detected_at TIMESTAMP DEFAULT NOW(),
  last_observed_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, pattern_type, category, merchant_name)
);

-- LLM query cache (to save costs)
CREATE TABLE llm_query_cache (
  query_hash VARCHAR(64) PRIMARY KEY, -- SHA256 of query
  query_text TEXT NOT NULL,
  query_type VARCHAR(50), -- 'categorization', 'insight', 'natural_language_query'
  response JSONB NOT NULL,
  model VARCHAR(50),
  tokens_used INT,
  cost_usd DECIMAL(10,6),
  hit_count INT DEFAULT 0,
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Cache expiry
);

-- Indexes
CREATE INDEX idx_insights_user ON insights(user_id, created_at DESC) WHERE NOT dismissed;
CREATE INDEX idx_insights_type ON insights(type, priority) WHERE NOT dismissed;
CREATE INDEX idx_insights_expires ON insights(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_merchant_categories_name ON merchant_categories(merchant_name);
CREATE INDEX idx_merchant_categories_category ON merchant_categories(category);
CREATE INDEX idx_transaction_embeddings_user ON transaction_embeddings(user_id);

-- Vector similarity search index (HNSW algorithm)
CREATE INDEX ON transaction_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_spending_patterns_user ON spending_patterns(user_id);
CREATE INDEX idx_llm_cache_type ON llm_query_cache(query_type, created_at);
CREATE INDEX idx_llm_cache_expires ON llm_query_cache(expires_at);

-- Triggers
CREATE TRIGGER update_merchant_categories_updated_at BEFORE UPDATE ON merchant_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 5. Budget Service Schema

```sql
-- ============================================
-- BUDGET SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS budget_schema;
SET search_path TO budget_schema;

-- Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Budget definition
  name VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,

  -- Period
  period VARCHAR(20) DEFAULT 'monthly', -- weekly, biweekly, monthly, quarterly, yearly
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for ongoing

  -- Behavior
  rollover BOOLEAN DEFAULT FALSE, -- Carry over unused budget
  rollover_amount DECIMAL(15,2) DEFAULT 0,

  -- Alerts
  alert_enabled BOOLEAN DEFAULT TRUE,
  alert_thresholds DECIMAL[] DEFAULT ARRAY[0.8, 1.0, 1.2], -- 80%, 100%, 120%
  last_alert_sent_at TIMESTAMP,
  last_alert_threshold DECIMAL(3,2),

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, deleted

  -- Metadata
  notes TEXT,
  color VARCHAR(7), -- UI color
  icon VARCHAR(50), -- UI icon

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Budget utilization (current period spend)
CREATE TABLE budget_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Spending
  amount_spent DECIMAL(15,2) DEFAULT 0,
  amount_remaining DECIMAL(15,2),
  percentage_used DECIMAL(5,2) DEFAULT 0,

  -- Transactions
  transaction_count INT DEFAULT 0,
  last_transaction_at TIMESTAMP,

  -- Pace
  daily_average DECIMAL(15,2),
  projected_end_amount DECIMAL(15,2), -- Based on current pace

  -- Status
  is_exceeded BOOLEAN DEFAULT FALSE,
  is_current BOOLEAN DEFAULT TRUE, -- Only one current period per budget

  -- Timestamps
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(budget_id, period_start)
);

-- Savings goals
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Goal definition
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,

  -- Timeline
  target_date DATE,
  started_at DATE DEFAULT CURRENT_DATE,

  -- Progress
  percentage_complete DECIMAL(5,2) DEFAULT 0,
  months_remaining INT,
  required_monthly_contribution DECIMAL(15,2),

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, achieved, abandoned, paused
  achieved_at TIMESTAMP,

  -- Metadata
  image_url TEXT,
  color VARCHAR(7),
  priority INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Goal contributions (manual tracking)
CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  contribution_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budget history (for trend analysis)
CREATE TABLE budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  budget_amount DECIMAL(15,2) NOT NULL,
  amount_spent DECIMAL(15,2) NOT NULL,
  amount_remaining DECIMAL(15,2),
  percentage_used DECIMAL(5,2),
  was_exceeded BOOLEAN,
  transaction_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_budgets_user ON budgets(user_id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_budgets_category ON budgets(user_id, category) WHERE status = 'active';
CREATE INDEX idx_budget_utilization_budget ON budget_utilization(budget_id, period_start DESC);
CREATE INDEX idx_budget_utilization_current ON budget_utilization(budget_id) WHERE is_current = TRUE;
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_savings_goals_status ON savings_goals(status, target_date);
CREATE INDEX idx_goal_contributions_goal ON goal_contributions(goal_id, contribution_date DESC);
CREATE INDEX idx_budget_history_budget ON budget_history(budget_id, period_start DESC);

-- Triggers
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update budget utilization
CREATE OR REPLACE FUNCTION update_budget_utilization()
RETURNS TRIGGER AS $$
BEGIN
  -- Update percentage, remaining amount, etc.
  UPDATE budget_utilization
  SET
    amount_remaining = (SELECT amount FROM budgets WHERE id = budget_id) - amount_spent,
    percentage_used = (amount_spent / (SELECT amount FROM budgets WHERE id = budget_id) * 100),
    is_exceeded = amount_spent > (SELECT amount FROM budgets WHERE id = budget_id),
    last_updated = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_utilization
  AFTER UPDATE OF amount_spent ON budget_utilization
  FOR EACH ROW EXECUTE FUNCTION update_budget_utilization();
```

---

### 6. Notification Service Schema

```sql
-- ============================================
-- NOTIFICATION SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS notification_schema;
SET search_path TO notification_schema;

-- Notifications log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Notification details
  type VARCHAR(50) NOT NULL, -- 'transaction_alert', 'budget_alert', 'insight', 'daily_summary', 'weekly_report'
  channel VARCHAR(20) NOT NULL, -- 'telegram', 'email', 'push', 'in_app'

  -- Content
  title VARCHAR(255),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional structured data

  -- Delivery
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,

  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMP,

  -- Metadata
  correlation_id UUID, -- Link to originating event
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- For time-sensitive notifications
);

-- Notification rules (user preferences)
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Rule definition
  name VARCHAR(255),
  rule_type VARCHAR(50) NOT NULL, -- 'large_transaction', 'budget_threshold', 'category_limit', 'custom'
  enabled BOOLEAN DEFAULT TRUE,

  -- Conditions (JSONB for flexibility)
  conditions JSONB NOT NULL,
  /* Example conditions:
    {
      "amount_threshold": 500,
      "categories": ["Dining", "Entertainment"],
      "time_of_day": {"start": "09:00", "end": "18:00"},
      "days_of_week": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    }
  */

  -- Channels
  channels VARCHAR[] DEFAULT ARRAY['telegram'],

  -- Rate limiting
  max_frequency VARCHAR(50) DEFAULT 'immediate', -- immediate, hourly, daily, weekly
  last_triggered_at TIMESTAMP,
  trigger_count INT DEFAULT 0,

  -- Metadata
  priority VARCHAR(20) DEFAULT 'normal',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(100) UNIQUE NOT NULL,
  channel VARCHAR(20) NOT NULL,

  -- Template content
  subject_template VARCHAR(255),
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- List of required variables

  -- Localization
  locale VARCHAR(10) DEFAULT 'en-US',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery stats (for monitoring)
CREATE TABLE notification_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,

  -- Counts
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  read_count INT DEFAULT 0,

  -- Performance
  avg_delivery_time_ms INT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(date, channel, type)
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_status ON notifications(status, next_retry_at) WHERE status = 'failed';
CREATE INDEX idx_notifications_channel ON notifications(channel, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX idx_notification_rules_user ON notification_rules(user_id) WHERE enabled = TRUE;
CREATE INDEX idx_notification_rules_type ON notification_rules(rule_type) WHERE enabled = TRUE;
CREATE INDEX idx_notification_templates_key ON notification_templates(template_key) WHERE is_active = TRUE;
CREATE INDEX idx_notification_stats_date ON notification_stats(date DESC, channel, type);

-- Triggers
CREATE TRIGGER update_notification_rules_updated_at BEFORE UPDATE ON notification_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 7. Audit & Compliance Schema

```sql
-- ============================================
-- AUDIT SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS audit_schema;
SET search_path TO audit_schema;

-- Audit logs (immutable)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  user_id UUID,
  service_name VARCHAR(50) NOT NULL,

  -- Action
  action VARCHAR(100) NOT NULL, -- USER_LOGIN, USER_LOGOUT, BANK_CONNECTED, TRANSACTION_VIEWED, etc.
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  correlation_id UUID,

  -- Changes (for UPDATE actions)
  old_values JSONB,
  new_values JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  timestamp TIMESTAMP DEFAULT NOW()
);

-- GDPR data export requests
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  export_format VARCHAR(10) DEFAULT 'json', -- json, csv
  file_url TEXT,
  file_size_bytes BIGINT,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP, -- URL expires after 7 days
  created_at TIMESTAMP DEFAULT NOW()
);

-- GDPR deletion requests
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, processing, completed, rejected
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_data_export_user ON data_export_requests(user_id, created_at DESC);
CREATE INDEX idx_deletion_requests_user ON deletion_requests(user_id);

-- Partition audit_logs by month (for better performance)
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- (Create partitions programmatically or via cron)
```

---

## Data Relationships

### Cross-Schema Relationships

```
user_schema.users (1) ──┬──< bank_schema.bank_connections (N)
                        ├──< transaction_schema.transactions (N)
                        ├──< budget_schema.budgets (N)
                        ├──< budget_schema.savings_goals (N)
                        ├──< analytics_schema.insights (N)
                        └──< notification_schema.notifications (N)

bank_schema.bank_connections (1) ──< bank_schema.bank_accounts (N)

bank_schema.bank_accounts (1) ──< transaction_schema.transactions (N)

budget_schema.budgets (1) ──< budget_schema.budget_utilization (N)

budget_schema.savings_goals (1) ──< budget_schema.goal_contributions (N)
```

**Note**: Foreign keys across schemas are avoided in microservices. Instead, we use:
- Soft references (UUID stored but no FK constraint)
- Event-driven eventual consistency
- API calls for data integrity

---

## Indexes & Performance

### Index Strategy

1. **Primary Keys**: Always UUID (distributed ID generation)
2. **Foreign Keys**: Always indexed
3. **Query Patterns**: Index columns used in WHERE, JOIN, ORDER BY
4. **Partial Indexes**: For filtered queries (e.g., WHERE status = 'active')
5. **Composite Indexes**: For multi-column filters (user_id + date)
6. **Full-Text Search**: GIN indexes for text search
7. **JSONB**: GIN or BTREE indexes on specific keys

### Query Optimization Examples

```sql
-- Slow query (no index)
SELECT * FROM transactions WHERE user_id = 'abc' ORDER BY transaction_date DESC;
-- Execution time: 500ms, Seq Scan

-- After index
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
-- Execution time: 15ms, Index Scan

-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE user_id = 'abc' AND transaction_date >= '2025-01-01'
ORDER BY transaction_date DESC
LIMIT 20;
```

### Slow Query Monitoring

```sql
-- Enable pg_stat_statements
CREATE EXTENSION pg_stat_statements;

-- Find slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## Data Migration Strategy

### Migration Tools
- **Prisma Migrate** (Node.js services)
- **Alembic** (Python services)
- **Flyway** or **Liquibase** (alternative)

### Migration Process

```bash
# Development
1. Create migration: npx prisma migrate dev --name add_user_preferences
2. Test migration: run locally
3. Commit migration files to Git

# Staging
4. Run migration: npx prisma migrate deploy
5. Verify: run automated tests

# Production
6. Backup database
7. Run migration during maintenance window
8. Verify data integrity
9. Monitor for issues
```

### Zero-Downtime Migrations

**Example: Adding a new column**
```sql
-- Step 1: Add column (nullable)
ALTER TABLE users ADD COLUMN phone VARCHAR(50);

-- Step 2: Deploy application code (reads/writes new column)
-- Application handles NULL values gracefully

-- Step 3: Backfill data (if needed)
UPDATE users SET phone = '' WHERE phone IS NULL;

-- Step 4: Add constraint (if needed)
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

---

## Backup & Recovery

### Backup Strategy

**Automated Backups (AWS RDS)**:
```yaml
Frequency: Daily at 03:00 UTC
Retention: 30 days
Point-in-Time Recovery: Enabled (5 minutes granularity)
Snapshots: Manual snapshots before major changes
```

**Backup Types**:
1. **Full Backup**: Complete database snapshot (daily)
2. **Incremental Backup**: Transaction logs (continuous)
3. **Logical Backup**: pg_dump (weekly, for specific tables)

### Disaster Recovery

**Recovery Scenarios**:

1. **Accidental Data Deletion**:
   - Restore from PITR to 5 minutes before deletion
   - Recovery time: ~15 minutes

2. **Database Corruption**:
   - Restore from latest snapshot
   - Recovery time: ~30 minutes

3. **Region Failure**:
   - Failover to read replica in different region
   - Promote replica to primary
   - Recovery time: ~10 minutes (automated)

**DR Drill**: Quarterly practice recovery in test environment

---

## Monitoring & Alerts

### Database Metrics

```yaml
Metrics to Monitor:
  - Connection count (alert > 90% of max)
  - Query latency (p95, p99)
  - Slow queries (> 1 second)
  - Disk space (alert < 20% free)
  - Replication lag (alert > 10 seconds)
  - Cache hit rate (alert < 90%)
  - Deadlocks (alert > 5/hour)
  - Failed transactions (alert > 1%)

Tools:
  - Prometheus + Grafana
  - AWS CloudWatch
  - pganalyze or pgBadger
```

---

## Compliance & Security

### Data Classification

| Data Type | Classification | Encryption | Retention |
|-----------|---------------|------------|-----------|
| User credentials | Sensitive | At-rest + in-transit | Until account deletion |
| Bank tokens | Highly Sensitive | AES-256 + in-transit | Until disconnection |
| Transactions | Sensitive | At-rest + in-transit | 5 years |
| Audit logs | Compliance | At-rest | 7 years |
| Analytics data | Internal | At-rest | 2 years |

### GDPR Compliance

**Right to Access**: `data_export_requests` table
**Right to Erasure**: Soft delete + anonymization
**Data Portability**: Export in JSON/CSV format
**Consent Management**: Tracked in `user_preferences`

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Database Architect | ___________ | ___________ | _____ |
| Backend Lead | ___________ | ___________ | _____ |
| Security Lead | ___________ | ___________ | _____ |

---

*This schema will evolve as requirements change. All schema changes must go through migration review process.*
