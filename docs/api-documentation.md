# API Documentation

**Version:** 1.0
**Last Updated:** 2026-01-18
**Status:** Active

---

## Overview

REST API documentation for M-Tracking backend services.

**Base URLs:**
- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.yourdomain.com/api`
- **Interactive Docs**: `/api/docs` (Swagger UI)

**API Format:**
- REST with JSON payloads
- OpenAPI 3.0 specification
- Bearer token authentication

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Transactions](#transactions-endpoints)
  - [Categories](#categories-endpoints)
  - [Budgets](#budgets-endpoints)
  - [Banking](#banking-endpoints)
  - [Notifications](#notifications-endpoints)
- [Webhooks](#webhooks)
- [WebSocket Events](#websocket-events)

---

## Authentication

### Bearer Token Authentication

All protected endpoints require a JWT access token in the `Authorization` header.

**Request Header:**
```http
Authorization: Bearer <access_token>
```

**Example:**
```bash
curl -X GET "http://localhost:4000/api/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Lifecycle

- **Access Token**: Valid for 15 minutes (RS256, asymmetric)
- **Refresh Token**: Valid for 7 days (HS256, symmetric, httpOnly cookie)
- **Token Refresh**: Use `/auth/refresh` endpoint before access token expires
- **Token Revocation**: Logout immediately blacklists tokens via Redis

### Token Algorithms

- **Access Token:** RS256 (RSA with SHA-256), public key verification
- **Refresh Token:** HS256 (HMAC with SHA-256), secret-only verification
- **Security:** Hybrid approach combines asymmetric and symmetric strengths

### Obtaining Tokens

```bash
# Login to get tokens
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## Rate Limiting

**Limits:**
- **Authenticated users**: 100 requests per minute
- **Public endpoints**: 20 requests per minute
- **IP-based**: Tracked by client IP address

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**429 Response (Rate Limit Exceeded):**
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "error": "Too Many Requests"
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created |
| 204 | No Content | Request succeeded, no content returned |
| 400 | Bad Request | Invalid request payload |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Pagination (Phase 01 - Optimized)

### Pagination Implementation

All list endpoints use pagination with strict limits to prevent memory exhaustion.

**Query Parameters:**

```http
GET /api/transactions?page=1&limit=50
```

**Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, min: 1, max: 100)

**Important Notes:**

- Limit is hard-capped at 100 to prevent DoS attacks
- Default limit is 20 for optimal performance
- Page numbering starts at 1 (not 0)
- Total records returned equals limit (or less on final page)

### Response Format (Phase 01 Optimized)

```json
{
  "data": [...],
  "total": 250,
  "page": 1,
  "limit": 50,
  "totalPages": 5
}
```

**Response Fields:**

- `data`: Array of transaction records
- `total`: Total number of records across all pages
- `page`: Current page number (1-indexed)
- `limit`: Records per page
- `totalPages`: Total number of pages available

**Calculation Example:**

```
Total records: 250
Limit per page: 50
Total pages: 250 ÷ 50 = 5 pages

Page 1: records 1-50
Page 2: records 51-100
Page 3: records 101-150
Page 4: records 151-200
Page 5: records 201-250
```

**Pagination Examples:**

```bash
# First page (default)
GET /api/transactions
# Returns page 1 with limit 20

# Specific page and limit
GET /api/transactions?page=2&limit=50
# Returns page 2 with 50 items (records 51-100)

# Large limit (hard-capped at 100)
GET /api/transactions?limit=200
# Returns limit 100 (not 200 - capped by server)

# Invalid limit (too small)
GET /api/transactions?limit=0
# Returns 400 Bad Request (limit must be min 1)
```

**Performance Characteristics:**

- Response time: <200ms (with pagination vs 2-5s without)
- Memory usage: Constant regardless of total records
- Database index utilization: 100% (offset pushdown to RDBMS)

---

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-18T10:00:00Z"
  }
}
```

**Errors:**
- `400`: Invalid email or weak password
- `409`: Email already registered

---

#### POST /auth/login

Authenticate user and obtain tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `401`: Invalid credentials

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Errors:**
- `401`: Invalid or expired refresh token

---

#### POST /auth/logout

Logout user and invalidate tokens.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

---

### Users Endpoints

#### GET /users/me

Get current authenticated user profile.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://cdn.example.com/avatars/uuid.jpg",
  "currency": "USD",
  "timezone": "America/New_York",
  "createdAt": "2026-01-18T10:00:00Z",
  "updatedAt": "2026-01-18T10:00:00Z"
}
```

---

#### PATCH /users/me

Update current user profile.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "currency": "EUR",
  "timezone": "Europe/London"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Smith",
  "currency": "EUR",
  "timezone": "Europe/London",
  "updatedAt": "2026-01-18T11:00:00Z"
}
```

---

### Transactions Endpoints

#### GET /transactions

List all transactions for authenticated user with pagination (Phase 01 Optimized).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, min: 1, max: 100)
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `categoryId` (optional): Filter by category
- `type` (optional): Filter by type (`income` or `expense`)
- `search` (optional): Search in description

**Examples:**
```http
# Default pagination
GET /transactions

# Specific page and limit
GET /transactions?page=2&limit=50

# With filters
GET /transactions?startDate=2026-01-01&endDate=2026-01-31&type=expense&page=1&limit=50

# All three
GET /transactions?page=1&limit=20&startDate=2026-01-01&endDate=2026-01-31&categoryId=uuid&type=expense
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "amount": 49.99,
      "currency": "USD",
      "description": "Grocery shopping",
      "type": "expense",
      "date": "2026-01-18T10:00:00Z",
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Groceries",
        "icon": "🛒"
      },
      "accountId": "uuid",
      "tags": ["food", "weekly"],
      "createdAt": "2026-01-18T10:00:00Z"
    }
  ],
  "total": 250,
  "page": 1,
  "limit": 50,
  "totalPages": 5
}
```

**Response Fields:**
- `data`: Array of transaction objects
- `total`: Total transactions matching filter (across all pages)
- `page`: Current page number (1-indexed)
- `limit`: Transactions per page
- `totalPages`: Total pages available

**Pagination Behavior:**

- Default returns 20 items per page
- Limit capped at 100 to prevent abuse
- Fast response time: <200ms (vs 2-5s without pagination)
- Uses database indexes for optimal performance

---

#### POST /transactions

Create a new transaction.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 49.99,
  "currency": "USD",
  "description": "Grocery shopping",
  "type": "expense",
  "date": "2026-01-18T10:00:00Z",
  "categoryId": "uuid",
  "accountId": "uuid",
  "tags": ["food", "weekly"]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "amount": 49.99,
  "currency": "USD",
  "description": "Grocery shopping",
  "type": "expense",
  "date": "2026-01-18T10:00:00Z",
  "categoryId": "uuid",
  "accountId": "uuid",
  "tags": ["food", "weekly"],
  "createdAt": "2026-01-18T10:00:00Z"
}
```

**Errors:**
- `400`: Invalid data
- `404`: Category or account not found

---

#### GET /transactions/:id

Get a specific transaction by ID.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "amount": 49.99,
  "currency": "USD",
  "description": "Grocery shopping",
  "type": "expense",
  "date": "2026-01-18T10:00:00Z",
  "category": {
    "id": "uuid",
    "name": "Groceries",
    "icon": "🛒"
  },
  "account": {
    "id": "uuid",
    "name": "Chase Checking",
    "type": "checking"
  },
  "tags": ["food", "weekly"],
  "createdAt": "2026-01-18T10:00:00Z"
}
```

**Errors:**
- `404`: Transaction not found
- `403`: Unauthorized access

---

#### PATCH /transactions/:id

Update a transaction.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 54.99,
  "description": "Updated description",
  "categoryId": "new-uuid"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "amount": 54.99,
  "description": "Updated description",
  "updatedAt": "2026-01-18T11:00:00Z"
}
```

---

#### DELETE /transactions/:id

Delete a transaction.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

**Errors:**
- `404`: Transaction not found
- `403`: Unauthorized access

---

### Categories Endpoints

#### GET /categories

List all categories.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Groceries",
      "icon": "🛒",
      "color": "#4CAF50",
      "type": "expense",
      "isDefault": true
    },
    {
      "id": "uuid",
      "name": "Salary",
      "icon": "💰",
      "color": "#2196F3",
      "type": "income",
      "isDefault": true
    }
  ]
}
```

---

#### POST /categories

Create a custom category.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Freelance Work",
  "icon": "💼",
  "color": "#9C27B0",
  "type": "income"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Freelance Work",
  "icon": "💼",
  "color": "#9C27B0",
  "type": "income",
  "isDefault": false,
  "userId": "uuid",
  "createdAt": "2026-01-18T10:00:00Z"
}
```

---

### Budgets Endpoints

#### GET /budgets

List all budgets for authenticated user.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Monthly Groceries",
      "amount": 500,
      "currency": "USD",
      "period": "monthly",
      "categoryId": "uuid",
      "spent": 320.50,
      "remaining": 179.50,
      "percentage": 64.1,
      "status": "on-track",
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    }
  ]
}
```

---

#### POST /budgets

Create a new budget.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Monthly Groceries",
  "amount": 500,
  "currency": "USD",
  "period": "monthly",
  "categoryId": "uuid",
  "alertThreshold": 80
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Monthly Groceries",
  "amount": 500,
  "currency": "USD",
  "period": "monthly",
  "categoryId": "uuid",
  "alertThreshold": 80,
  "createdAt": "2026-01-18T10:00:00Z"
}
```

---

### Banking Endpoints

#### GET /banking/accounts

List connected bank accounts.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Chase Checking",
      "type": "checking",
      "balance": 2500.00,
      "currency": "USD",
      "institutionName": "Chase Bank",
      "lastSyncedAt": "2026-01-18T10:00:00Z",
      "isActive": true
    }
  ]
}
```

---

#### POST /banking/link

Initiate bank account linking (Plaid).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "linkToken": "link-sandbox-xxx",
  "expiration": "2026-01-18T11:00:00Z"
}
```

---

### Notifications Endpoints

#### GET /notifications

List user notifications.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "budget-alert",
      "title": "Budget Alert",
      "message": "You've spent 80% of your Groceries budget",
      "isRead": false,
      "createdAt": "2026-01-18T10:00:00Z"
    }
  ]
}
```

---

## Webhooks

### Webhook Events

M-Tracking can send webhooks for various events.

**Supported Events:**
- `transaction.created`
- `transaction.updated`
- `transaction.deleted`
- `budget.exceeded`
- `account.synced`

**Webhook Payload:**
```json
{
  "event": "transaction.created",
  "timestamp": "2026-01-18T10:00:00Z",
  "data": {
    "id": "uuid",
    "amount": 49.99,
    "description": "Grocery shopping"
  }
}
```

### Webhook Signature Verification

```typescript
// Verify webhook signature
import crypto from 'crypto';

const signature = request.headers['x-webhook-signature'];
const payload = JSON.stringify(request.body);
const secret = process.env.WEBHOOK_SECRET;

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

---

## WebSocket Events

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: accessToken,
  },
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

### Events

#### transaction.created
```javascript
socket.on('transaction.created', (transaction) => {
  console.log('New transaction:', transaction);
});
```

#### budget.alert
```javascript
socket.on('budget.alert', (alert) => {
  console.log('Budget alert:', alert);
});
```

---

## Interactive API Documentation

Visit `/api/docs` for interactive Swagger UI documentation where you can:
- Explore all available endpoints
- Test API calls directly from browser
- View request/response schemas
- Download OpenAPI specification

**Access Swagger UI:**
- Development: http://localhost:4000/api/docs
- Production: https://api.yourdomain.com/api/docs

---

## Additional Resources

- [Backend Authentication Implementation](./backend-authentication.md) - Complete auth system documentation
- [System Architecture](./system-architecture.md) - Architectural decisions (ADR-006 JWT, ADR-007 OAuth)
- [Backend Configuration](./backend-configuration.md) - TypeScript and NestJS configuration
- [Code Standards](./code-standards.md) - Development guidelines and patterns
- [ENV Configuration Guide](./ENV_CONFIG_GUIDE.md) - Environment variable setup
- [Testing Guide](./testing.md) - Testing strategies
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

---

**Last Updated:** 2026-01-21
**Status:** ✅ Updated with Backend Authentication (Production Ready)
