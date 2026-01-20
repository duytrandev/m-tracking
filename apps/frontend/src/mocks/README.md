# API Mocking with MSW

This project uses [Mock Service Worker (MSW)](https://mswjs.io/) to mock API requests during development. This allows the frontend to be developed independently of the backend.

## Getting Started

### 1. Enable Mocking

To enable mocking, add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_API_MOCKING=enabled
```

If this variable is not set or set to anything else, the application will attempt to connect to the real API.

### 2. Verify Setup

When mocking is enabled, you will see the following message in your browser console:

```
[MSW] Mocking enabled.
```

## Adding New Mocks

### 1. Create a Handler

Open `src/mocks/handlers.ts` and add a new request handler. MSW supports REST and GraphQL.

Example REST handler:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('http://localhost:4000/api/resource', () => {
    return HttpResponse.json({
      id: '123',
      name: 'Mocked Resource',
    })
  }),
]
```

### 2. Update Types

Ensure that your mock responses match the TypeScript interfaces defined in your application (e.g., in `src/features/*/types`).

## Project Structure

- `src/mocks/browser.ts`: Configures the Service Worker for browser environments.
- `src/mocks/handlers.ts`: Contains the request handlers (routes and mock responses).
- `src/mocks/MSWProvider.tsx`: A wrapper component that initializes MSW on the client side based on the environment variable.
