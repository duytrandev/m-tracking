# API Mocking with Mock Service Worker (MSW)

This project uses [Mock Service Worker (MSW)](https://mswjs.io/) to provide comprehensive API mocking for development, testing, and continuous integration.

## Overview

MSW intercepts network requests at the Service Worker level, allowing us to mock API responses without modifying application code. This enables frontend development and testing independent of backend availability.

## Features

- **Complete API Coverage**: Handlers for all authentication, spending, and profile endpoints
- **Realistic Responses**: Comprehensive mock data with edge cases and error scenarios
- **Network Simulation**: Configurable delays to test loading states
- **Type Safety**: Full TypeScript support with request/response type definitions
- **Feature Organization**: Handlers organized by feature module for maintainability

## Architecture

### Handler Structure

```
src/mocks/
├── handlers.ts              # Central export of all handlers
└── handlers/
    ├── auth.ts             # Authentication endpoints (login, register, 2FA, etc.)
    ├── spending.ts         # Transaction and category endpoints
    └── profile.ts          # User profile and settings endpoints
```

### Supported Endpoints

#### Authentication (`auth.ts`)

- `POST /auth/login` - User login with credential validation
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `POST /auth/verify-email` - Email verification
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/forgot-password` - Initiate password reset
- `POST /auth/reset-password` - Complete password reset
- `POST /auth/magic-link/request` - Request magic link
- `POST /auth/magic-link/verify` - Verify magic link
- `POST /auth/otp/request` - Request OTP
- `POST /auth/otp/verify` - Verify OTP
- `POST /auth/2fa/enroll` - Enroll in 2FA
- `POST /auth/2fa/verify` - Verify 2FA setup
- `GET /auth/2fa/backup-codes` - Get backup codes
- `POST /auth/2fa/disable` - Disable 2FA
- `POST /auth/2fa/validate` - Validate 2FA during login

#### Spending/Transactions (`spending.ts`)

- `GET /transactions` - List transactions with filtering
- `GET /transactions/:id` - Get transaction by ID
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- `GET /transactions/summary` - Get spending analytics
- `GET /transactions/categories` - List categories
- `GET /transactions/categories/:id` - Get category by ID
- `POST /transactions/categories` - Create category
- `PUT /transactions/categories/:id` - Update category
- `DELETE /transactions/categories/:id` - Delete category

#### Profile (`profile.ts`)

- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update profile
- `DELETE /users/me/avatar` - Delete avatar
- `GET /users/me/sessions` - Get active sessions
- `DELETE /users/me/sessions/:id` - Revoke session
- `DELETE /users/me/sessions` - Revoke all other sessions

## Configuration

### Environment Variables

```bash
# Enable/disable mocking in development
NEXT_PUBLIC_API_MOCKING=enabled
```

When `NEXT_PUBLIC_API_MOCKING` is set to `enabled`, the application will use MSW handlers instead of making real API calls.

### API Base URL

MSW handlers use the API URL from environment:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
```

## Mock Data

### Realistic Test Data

The mocking system includes comprehensive mock data:

- **Users**: Test accounts with different states (verified, unverified, 2FA enabled)
- **Transactions**: 30+ transactions across multiple categories with realistic amounts
- **Categories**: 10 pre-defined spending categories with colors and icons
- **Sessions**: Active and historical login sessions

### Test Accounts

| Email              | Password      | Description                   |
| ------------------ | ------------- | ----------------------------- |
| `test@example.com` | `password123` | Standard test user            |
| `demo@example.com` | `demo123`     | Demo user with verified email |

### Development Features

In development mode, some endpoints return additional debug information:

- **Magic Link**: Includes `devMagicLink` in response
- **OTP**: Includes `devOtp` in response (set to `123456`)

## Usage

### For Development

1. Create `.env.local` in the frontend directory:

   ```bash
   NEXT_PUBLIC_API_MOCKING=enabled
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Check browser console for MSW activation message:
   ```
   [MSW] Mocking enabled.
   ```

### For Testing

MSW is automatically configured in tests through the test setup. All API calls made during tests will be intercepted by MSW handlers.

Example test:

```typescript
import { http, HttpResponse } from 'msw'
import { handlers } from '@/mocks/handlers'

describe('Auth', () => {
  it('should login successfully', async () => {
    // Mock implementation is handled by MSW
    const response = await authApi.login({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(response.accessToken).toBeDefined()
    expect(response.user.email).toBe('test@example.com')
  })
})
```

## Handler Implementation Patterns

### Consistent Structure

Each handler follows this pattern:

```typescript
http.METHOD(`${API_URL}/endpoint`, async ({ params, request }) => {
  // 1. Simulate network delay
  await delay(300)

  // 2. Validate request
  const body = await request.json()
  if (!body.requiredField) {
    return HttpResponse.json(
      { message: 'Error message', statusCode: 400, error: 'ERROR_CODE' },
      { status: 400 }
    )
  }

  // 3. Process and return response
  return HttpResponse.json(responseData, { status: 200 })
})
```

### Request Matching

Handlers support comprehensive request matching:

- **URL matching**: Path parameters and query strings
- **Method matching**: GET, POST, PUT, DELETE, PATCH
- **Header matching**: Content-Type, Authorization, custom headers
- **Body matching**: JSON body validation and parsing

### Error Scenarios

All handlers include realistic error scenarios:

- **Validation errors**: Missing required fields, invalid formats
- **Authentication errors**: Invalid tokens, expired sessions
- **Authorization errors**: Insufficient permissions
- **Not found errors**: Resource doesn't exist
- **Conflict errors**: Duplicate entries, resource in use
- **Rate limiting**: Too many requests

### Delay Simulation

Network delays are simulated for testing:

- **Fast responses**: 200-300ms for simple reads
- **Medium responses**: 400-500ms for writes and updates
- **Slow responses**: 500ms+ for complex queries (summaries, analytics)

```typescript
// Adjust delay based on expected complexity
const delay = (ms: number = 300) =>
  new Promise(resolve => setTimeout(resolve, ms))
```

## Adding New Handlers

### 1. Create Handler Module

Add new handlers to the appropriate feature module or create a new one:

```typescript
// src/mocks/handlers/new-feature.ts
import { http, HttpResponse } from 'msw'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const newFeatureHandlers = [
  http.get(`${API_URL}/new-feature`, async () => {
    return HttpResponse.json({ data: 'mock response' })
  }),
]
```

### 2. Export from handlers.ts

```typescript
// src/mocks/handlers.ts
import { authHandlers } from './handlers/auth'
import { spendingHandlers } from './handlers/spending'
import { profileHandlers } from './handlers/profile'
import { newFeatureHandlers } from './handlers/new-feature'

export const handlers = [
  ...authHandlers,
  ...spendingHandlers,
  ...profileHandlers,
  ...newFeatureHandlers,
]
```

### 3. Update Documentation

Update this README with new endpoints and their descriptions.

## Best Practices

1. **Handler Organization**: Group handlers by feature module
2. **Descriptive Names**: Use clear handler names and comments
3. **Realistic Delays**: Simulate realistic network latency
4. **Error Coverage**: Include all possible error scenarios
5. **Type Safety**: Use TypeScript interfaces for request/response
6. **Data Consistency**: Use shared mock data across handlers
7. **Version Compatibility**: Keep handlers in sync with API changes

## Troubleshooting

### Handlers Not Working

1. Verify `NEXT_PUBLIC_API_MOCKING=enabled` is set
2. Check browser console for MSW activation message
3. Ensure handlers are properly exported in `handlers.ts`

### Test Failures

1. Verify all handlers are imported in test setup
2. Check for handler conflicts or missing endpoints
3. Ensure mock data matches expected response structure

### Performance Issues

1. Reduce delay times in handlers for faster tests
2. Use smaller subsets of mock data for unit tests
3. Consider lazy loading handlers for large projects

## Resources

- [MSW Documentation](https://mswjs.io/docs/)
- [MSW GitHub](https://github.com/mswjs/msw)
- [Testing Library Integration](https://mswjs.io/docs/recipes/debugging-uncaught-requests)
