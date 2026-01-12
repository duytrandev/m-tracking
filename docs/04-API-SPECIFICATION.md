# API Specification Document

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2025-12-28 | API Architect | Draft |

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [API Gateway](#api-gateway)
4. [Service APIs](#service-apis)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)

---

## API Overview

### Base URLs

```
Production:    https://api.money-tracking.com
Staging:       https://api-staging.money-tracking.com
Development:   http://localhost:3000
```

### API Versioning

- **Strategy**: URL-based versioning
- **Format**: `/v1/`, `/v2/`
- **Current Version**: `v1`
- **Deprecation Policy**: Minimum 6 months notice before deprecation

### Standard Headers

**Request Headers**:
```http
Authorization: Bearer {access_token}
Content-Type: application/json
X-Request-ID: {uuid}           # Optional, for request tracing
X-Client-Version: {version}    # Client app version
```

**Response Headers**:
```http
Content-Type: application/json
X-Request-ID: {uuid}
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1672531200
```

### Response Format

**Success Response**:
```json
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "meta": {
    "timestamp": "2025-12-28T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Paginated Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-12-28T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "REQUIRED_FIELD"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-28T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Authentication

### Overview

- **Primary Method**: JWT Bearer Token
- **Token Lifetime**:
  - Access Token: 1 hour
  - Refresh Token: 30 days
- **Token Storage**:
  - Access: Client memory/localStorage
  - Refresh: httpOnly cookie (secure)

### Endpoints

#### 1. Register User

```http
POST /v1/auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "fullName": "John Doe",
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Errors**:
- `400`: Email already exists
- `422`: Invalid email format or weak password

---

#### 2. Login

```http
POST /v1/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "fullName": "John Doe",
      "twoFactorEnabled": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**If 2FA Enabled** (200 OK):
```json
{
  "data": {
    "requiresTwoFactor": true,
    "tempToken": "temp_token_abc123"
  }
}
```

**Errors**:
- `401`: Invalid credentials
- `403`: Account suspended
- `429`: Too many login attempts

---

#### 3. OAuth Login (Google)

```http
POST /v1/auth/oauth/google
```

**Request Body**:
```json
{
  "code": "google_auth_code",
  "redirectUri": "https://app.money-tracking.com/auth/callback"
}
```

**Response** (200 OK): Same as regular login

---

#### 4. Refresh Token

```http
POST /v1/auth/refresh
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Rotated
    "expiresIn": 3600
  }
}
```

---

#### 5. Logout

```http
POST /v1/auth/logout
Authorization: Bearer {access_token}
```

**Response** (204 No Content)

---

#### 6. Verify Email

```http
POST /v1/auth/verify-email
```

**Request Body**:
```json
{
  "token": "email_verification_token"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "verified": true
  }
}
```

---

#### 7. Reset Password Request

```http
POST /v1/auth/reset-password
```

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "message": "Password reset email sent"
  }
}
```

---

#### 8. Reset Password Confirm

```http
POST /v1/auth/reset-password/confirm
```

**Request Body**:
```json
{
  "token": "reset_token",
  "newPassword": "NewSecurePassword123!"
}
```

**Response** (200 OK)

---

## Service APIs

### User Service

#### 1. Get User Profile

```http
GET /v1/users/me
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "avatarUrl": "https://...",
    "timezone": "America/New_York",
    "currency": "USD",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

#### 2. Update User Profile

```http
PUT /v1/users/me
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "fullName": "Jane Doe",
  "timezone": "America/Los_Angeles",
  "currency": "USD"
}
```

**Response** (200 OK): Updated user object

---

#### 3. Get User Preferences

```http
GET /v1/users/me/preferences
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "data": {
    "notificationEnabled": true,
    "emailNotifications": true,
    "telegramNotifications": true,
    "telegramChatId": "123456789",
    "dailySummaryEnabled": true,
    "dailySummaryTime": "09:00",
    "transactionAlertThreshold": 500.00
  }
}
```

---

#### 4. Update User Preferences

```http
PUT /v1/users/me/preferences
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "dailySummaryEnabled": true,
  "dailySummaryTime": "08:00",
  "transactionAlertThreshold": 1000.00
}
```

**Response** (200 OK): Updated preferences

---

### Bank Service

#### 1. Create Plaid Link Token

```http
POST /v1/banks/plaid/link-token
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "data": {
    "linkToken": "link-sandbox-abc123",
    "expiration": "2025-12-28T11:00:00Z"
  }
}
```

---

#### 2. Exchange Public Token

```http
POST /v1/banks/connect
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "publicToken": "public-sandbox-abc123",
  "provider": "plaid",
  "institutionId": "ins_1",
  "institutionName": "Chase"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "connectionId": "conn_abc123",
    "accounts": [
      {
        "id": "acc_xyz789",
        "name": "Checking Account",
        "mask": "0000",
        "type": "checking",
        "currentBalance": 5432.10,
        "currency": "USD"
      }
    ]
  }
}
```

---

#### 3. List Bank Connections

```http
GET /v1/banks/connections
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "conn_abc123",
      "institutionName": "Chase",
      "institutionLogo": "https://...",
      "status": "active",
      "lastSyncAt": "2025-12-28T10:00:00Z",
      "accountCount": 2
    }
  ]
}
```

---

#### 4. Get Bank Accounts

```http
GET /v1/banks/accounts
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `connectionId` (optional): Filter by connection
- `status` (optional): active | closed

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "acc_xyz789",
      "connectionId": "conn_abc123",
      "institutionName": "Chase",
      "accountName": "Checking Account",
      "accountMask": "0000",
      "accountType": "checking",
      "currentBalance": 5432.10,
      "availableBalance": 5432.10,
      "currency": "USD",
      "status": "active",
      "lastSyncAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

---

#### 5. Sync Bank Account

```http
POST /v1/banks/accounts/{accountId}/sync
Authorization: Bearer {access_token}
```

**Response** (202 Accepted):
```json
{
  "data": {
    "message": "Sync initiated",
    "syncId": "sync_abc123",
    "estimatedCompletionTime": "2025-12-28T10:05:00Z"
  }
}
```

---

#### 6. Disconnect Bank Connection

```http
DELETE /v1/banks/connections/{connectionId}
Authorization: Bearer {access_token}
```

**Response** (204 No Content)

---

### Transaction Service

#### 1. List Transactions

```http
GET /v1/transactions
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `accountId` (optional)
- `category` (optional)
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `minAmount` (optional)
- `maxAmount` (optional)
- `search` (optional): Full-text search
- `sortBy` (default: transactionDate)
- `sortOrder` (default: desc)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "txn_123",
      "accountId": "acc_xyz789",
      "amount": 45.50,
      "currency": "USD",
      "direction": "debit",
      "merchantName": "Starbucks",
      "description": "Coffee purchase",
      "category": "Food & Dining",
      "categoryConfidence": 0.95,
      "transactionDate": "2025-12-28",
      "status": "posted",
      "isPending": false,
      "notes": null,
      "tags": []
    }
  ],
  "pagination": { ... }
}
```

---

#### 2. Get Transaction Details

```http
GET /v1/transactions/{transactionId}
Authorization: Bearer {access_token}
```

**Response** (200 OK): Full transaction object with additional fields

---

#### 3. Update Transaction Category

```http
PATCH /v1/transactions/{transactionId}/category
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "category": "Entertainment"
}
```

**Response** (200 OK): Updated transaction

---

#### 4. Add Transaction Notes

```http
PATCH /v1/transactions/{transactionId}/notes
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "notes": "Client dinner - reimbursable"
}
```

**Response** (200 OK)

---

#### 5. Add Transaction Tags

```http
PATCH /v1/transactions/{transactionId}/tags
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "tags": ["business", "reimbursable"]
}
```

**Response** (200 OK)

---

#### 6. Get Category Summary

```http
GET /v1/transactions/summary/categories
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `startDate`: ISO 8601 date (required)
- `endDate`: ISO 8601 date (required)
- `accountId` (optional)

**Response** (200 OK):
```json
{
  "data": {
    "period": {
      "start": "2025-12-01",
      "end": "2025-12-31"
    },
    "totalSpent": 2500.00,
    "totalIncome": 5000.00,
    "categories": [
      {
        "category": "Food & Dining",
        "amount": 450.50,
        "percentage": 18.02,
        "transactionCount": 23,
        "avgAmount": 19.59
      },
      {
        "category": "Shopping",
        "amount": 380.00,
        "percentage": 15.20,
        "transactionCount": 8,
        "avgAmount": 47.50
      }
    ]
  }
}
```

---

#### 7. Search Transactions

```http
POST /v1/transactions/search
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "query": "Starbucks",
  "filters": {
    "categories": ["Food & Dining"],
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    },
    "amountRange": {
      "min": 0,
      "max": 100
    }
  },
  "page": 1,
  "limit": 20
}
```

**Response** (200 OK): Paginated transaction list

---

### Analytics Service

#### 1. Get Insights

```http
GET /v1/analytics/insights
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `type` (optional): savings_opportunity | spending_spike | forecast
- `priority` (optional): low | medium | high
- `unread` (optional): true | false

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "insight_123",
      "type": "savings_opportunity",
      "priority": "high",
      "title": "You could save $150/month on dining",
      "description": "Your dining expenses are 30% higher than similar users...",
      "actionableAdvice": "Try meal prepping on Sundays...",
      "data": {
        "currentSpending": 450,
        "suggestedBudget": 300,
        "potentialSavings": 150
      },
      "viewed": false,
      "createdAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

---

#### 2. Mark Insight as Viewed

```http
POST /v1/analytics/insights/{insightId}/view
Authorization: Bearer {access_token}
```

**Response** (204 No Content)

---

#### 3. Dismiss Insight

```http
DELETE /v1/analytics/insights/{insightId}
Authorization: Bearer {access_token}
```

**Response** (204 No Content)

---

#### 4. Natural Language Query

```http
POST /v1/analytics/query
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "query": "How much did I spend on restaurants last month?"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "answer": "You spent $425.50 on restaurants last month.",
    "details": {
      "category": "Food & Dining",
      "period": "2025-11-01 to 2025-11-30",
      "totalAmount": 425.50,
      "transactionCount": 18
    },
    "visualizations": [
      {
        "type": "bar_chart",
        "data": [ ... ]
      }
    ]
  }
}
```

---

#### 5. Get Spending Trends

```http
GET /v1/analytics/trends
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `period`: daily | weekly | monthly | yearly
- `category` (optional)
- `startDate`
- `endDate`

**Response** (200 OK):
```json
{
  "data": {
    "period": "monthly",
    "dataPoints": [
      {
        "date": "2025-01",
        "amount": 2500.00,
        "transactionCount": 45
      },
      {
        "date": "2025-02",
        "amount": 2800.00,
        "transactionCount": 52
      }
    ],
    "trend": "increasing",
    "trendPercentage": 12.0
  }
}
```

---

### Budget Service

#### 1. Create Budget

```http
POST /v1/budgets
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "name": "Dining Budget",
  "category": "Food & Dining",
  "amount": 300.00,
  "period": "monthly",
  "startDate": "2025-01-01",
  "alertEnabled": true,
  "alertThresholds": [0.8, 1.0, 1.2]
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "budget_123",
    "name": "Dining Budget",
    "category": "Food & Dining",
    "amount": 300.00,
    "period": "monthly",
    "startDate": "2025-01-01",
    "status": "active",
    "createdAt": "2025-12-28T10:00:00Z"
  }
}
```

---

#### 2. List Budgets

```http
GET /v1/budgets
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `status`: active | paused | completed
- `category` (optional)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "budget_123",
      "name": "Dining Budget",
      "category": "Food & Dining",
      "amount": 300.00,
      "period": "monthly",
      "currentPeriod": {
        "start": "2025-12-01",
        "end": "2025-12-31",
        "spent": 245.50,
        "remaining": 54.50,
        "percentageUsed": 81.83
      },
      "status": "active"
    }
  ]
}
```

---

#### 3. Get Budget Details

```http
GET /v1/budgets/{budgetId}
Authorization: Bearer {access_token}
```

**Response** (200 OK): Full budget object with historical data

---

#### 4. Update Budget

```http
PUT /v1/budgets/{budgetId}
Authorization: Bearer {access_token}
```

**Request Body**: Same as create (partial updates allowed)

**Response** (200 OK): Updated budget

---

#### 5. Delete Budget

```http
DELETE /v1/budgets/{budgetId}
Authorization: Bearer {access_token}
```

**Response** (204 No Content)

---

#### 6. Create Savings Goal

```http
POST /v1/goals
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "name": "Emergency Fund",
  "description": "Save for 6 months expenses",
  "targetAmount": 10000.00,
  "currentAmount": 2000.00,
  "targetDate": "2026-12-31"
}
```

**Response** (201 Created)

---

#### 7. List Savings Goals

```http
GET /v1/goals
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "goal_123",
      "name": "Emergency Fund",
      "targetAmount": 10000.00,
      "currentAmount": 2500.00,
      "percentageComplete": 25.00,
      "targetDate": "2026-12-31",
      "monthsRemaining": 12,
      "requiredMonthlyContribution": 625.00,
      "status": "active"
    }
  ]
}
```

---

#### 8. Add Goal Contribution

```http
POST /v1/goals/{goalId}/contributions
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "amount": 500.00,
  "contributionDate": "2025-12-28",
  "notes": "Bonus money"
}
```

**Response** (201 Created)

---

### Notification Service

#### 1. Get Notification History

```http
GET /v1/notifications
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `page`, `limit`
- `type`: transaction_alert | budget_alert | insight | daily_summary
- `channel`: telegram | email
- `status`: sent | delivered | read

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "notif_123",
      "type": "transaction_alert",
      "channel": "telegram",
      "title": "Large transaction detected",
      "message": "You spent $523.45 at Apple Store",
      "status": "delivered",
      "sentAt": "2025-12-28T10:00:00Z",
      "readAt": null
    }
  ],
  "pagination": { ... }
}
```

---

#### 2. Get Notification Preferences

```http
GET /v1/notifications/preferences
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "data": {
    "channels": {
      "telegram": true,
      "email": true
    },
    "rules": [
      {
        "id": "rule_123",
        "type": "large_transaction",
        "enabled": true,
        "conditions": {
          "amountThreshold": 500
        },
        "channels": ["telegram"]
      }
    ]
  }
}
```

---

#### 3. Update Notification Preferences

```http
PUT /v1/notifications/preferences
Authorization: Bearer {access_token}
```

**Request Body**: Same structure as GET response

**Response** (200 OK)

---

#### 4. Link Telegram Account

```http
POST /v1/notifications/telegram/link
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "linkToken": "telegram_link_token_from_bot"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "linked": true,
    "telegramUsername": "@johndoe"
  }
}
```

---

## Error Handling

### Standard Error Codes

| HTTP Code | Error Code | Description |
|-----------|-----------|-------------|
| 400 | BAD_REQUEST | Invalid request format |
| 400 | VALIDATION_ERROR | Input validation failed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 401 | TOKEN_EXPIRED | Access token expired |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | UNPROCESSABLE_ENTITY | Semantic validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

### Error Response Examples

**Validation Error**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "REQUIRED_FIELD"
      },
      {
        "field": "amount",
        "message": "Amount must be greater than 0",
        "code": "MIN_VALUE"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-28T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Rate Limit Error**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retryAfter": 60
  },
  "meta": {
    "timestamp": "2025-12-28T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Rate Limiting

### Default Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 10 requests | 5 minutes |
| Read operations | 1000 requests | 1 hour |
| Write operations | 500 requests | 1 hour |
| Analytics queries | 100 requests | 1 hour |
| File uploads | 10 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1672531200
```

### Handling Rate Limits

**Client Implementation**:
```typescript
async function makeRequest() {
  const response = await fetch('/v1/transactions');

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    await sleep(retryAfter * 1000);
    return makeRequest(); // Retry
  }

  return response.json();
}
```

---

## Webhooks

### Telegram Bot Webhook

```http
POST /v1/webhooks/telegram
Content-Type: application/json
X-Telegram-Bot-Api-Secret-Token: {secret}
```

**Telegram Update Body**:
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "date": 1672531200,
    "text": "/start"
  }
}
```

**Response** (200 OK): Empty response

---

## OpenAPI Documentation

Full OpenAPI 3.0 specification available at:
- Production: `https://api.money-tracking.com/api-docs`
- Swagger UI: `https://api.money-tracking.com/docs`

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| API Architect | ___________ | ___________ | _____ |
| Backend Lead | ___________ | ___________ | _____ |
| Frontend Lead | ___________ | ___________ | _____ |
