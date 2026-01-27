# @m-tracking/shared

A consolidated library containing all shared utilities, types, constants, and interfaces for the M-Tracking application.

## Overview

This library consolidates code from the following previously separated libraries:

- `@m-tracking/common` - Common interfaces and utilities
- `@m-tracking/types` - Shared TypeScript types
- `@m-tracking/constants` - Shared constants
- `@m-tracking/utils` - Utility functions

## Directory Structure

```text
src/
├── constants/           # Shared constants and enums
│   ├── index.ts         # Transaction categories, currencies, error codes, regex patterns
│   └── index.spec.ts    # Constants tests
├── types/               # TypeScript interfaces and types
│   ├── index.ts         # User, Transaction, Budget, BankAccount types
│   └── index.spec.ts    # Types tests
├── interfaces/          # Domain interfaces
│   ├── api-response.interface.ts
│   └── user.interface.ts
├── utils/               # Utility functions and helpers
│   ├── index.ts         # Formatting, validation, logging utilities
│   ├── index.spec.ts    # Utils tests
│   └── utils.spec.ts    # Logger and validation tests
├── vitest.config.ts     # Test configuration
├── tsconfig.json        # TypeScript configuration
└── index.ts             # Main entry point
```

## Installation

```bash
pnpm install
```

## Building

```bash
pnpm build
```

## Testing

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

## Quick Start

### Importing from Shared Library

```typescript
// Import types
import type { User, Transaction, Budget } from '@m-tracking/shared'

// Import constants
import {
  TRANSACTION_CATEGORIES,
  SUPPORTED_CURRENCIES,
} from '@m-tracking/shared'

// Import utilities
import { formatCurrency, sleep, LoggerUtil } from '@m-tracking/shared'

// Import interfaces
import type { IApiResponse } from '@m-tracking/shared'
```

## API Reference

### Types

- `User` - User model
- `Transaction` - Transaction model
- `Budget` - Budget model
- `BankAccount` - Bank account model
- `ApiResponse<T>` - API response wrapper
- `PaginatedResponse<T>` - Paginated API response

### Constants

- `TRANSACTION_CATEGORIES` - Available transaction categories
- `SUPPORTED_CURRENCIES` - Supported currencies
- `TRANSACTION_TYPES` - Transaction types (income/expense)
- `BUDGET_PERIODS` - Budget periods (weekly/monthly/yearly)
- `BANK_PROVIDERS` - Bank providers
- `API_ENDPOINTS` - API route constants
- `ERROR_CODES` - Standard error codes
- `REGEX_PATTERNS` - Validation regex patterns

### Utility Functions

**Formatting & Generation:**

- `formatCurrency(amount, currency)` - Format currency values
- `formatDate(date, format)` - Format dates
- `isValidEmail(email)` - Validate email format
- `generateId()` - Generate random IDs
- `sleep(ms)` - Async sleep utility

**Logger Utilities:**

- `LoggerUtil.sanitizeForLogging(data)` - Redact sensitive fields
- `LoggerUtil.maskEmail(email)` - Mask email addresses

**Validation Utilities:**

- `ValidationUtil.isValidEmail(email)` - Validate email
- `ValidationUtil.isValidPassword(password)` - Validate password strength
- `ValidationUtil.isValidUUID(uuid)` - Validate UUID format
- `ValidationUtil.isValidPhone(phone)` - Validate phone number

### Interfaces

- `IApiResponse<T>` - Standard API response format
- `IApiError` - Error details in API response
- `IApiMeta` - Metadata in API response
- `IPagination` - Pagination information
- `IUser` - User interface
- `IUserPreferences` - User preferences interface

## Best Practices

1. **Keep it Shared**: Only add code here if it's used across multiple packages
2. **Type Safety**: Always export types and interfaces, not just implementations
3. **Documentation**: Add JSDoc comments for public APIs
4. **Testing**: Aim for >80% test coverage
5. **No Side Effects**: This library is marked with `sideEffects: false`

## Development Guide

### Adding New Exports

1. Create the file in the appropriate subdirectory (`constants/`, `types/`, `utils/`, or `interfaces/`)
2. Export from the local index.ts file
3. Export from the root `src/index.ts` file
4. Add tests in corresponding `.spec.ts` files

### File Organization

- **constants/**: All constant values and types derived from constants
- **types/**: TypeScript interfaces and types
- **interfaces/**: Specific interface definitions (API contracts, domain models)
- **utils/**: Functions and utility classes

## Migration Information

- **Migration Date**: January 23, 2026
- **Consolidated From**: `@m-tracking/common`, `@m-tracking/types`, `@m-tracking/constants`, `@m-tracking/utils`
- **Updated**: `tsconfig.base.json` path mappings point to `@m-tracking/shared`

pnpm build

````

## Testing

```bash
pnpm test
````

## Usage

```typescript
import {
  formatCurrency,
  TRANSACTION_CATEGORIES,
  type Transaction,
  ValidationUtil,
} from '@m-tracking/shared'
```
