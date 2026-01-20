# Testing Guide

**Version:** 1.0
**Last Updated:** 2026-01-18
**Status:** Active

---

## Overview

Comprehensive testing strategy for M-Tracking covering unit tests, integration tests, end-to-end tests, and quality assurance processes.

**Testing Philosophy:**
- **Test behavior, not implementation**
- **Write tests alongside code (TDD encouraged)**
- **Maintain 80%+ code coverage**
- **Fast feedback loops**
- **Reliable, deterministic tests**

---

## Table of Contents

- [Testing Stack](#testing-stack)
- [Test Structure](#test-structure)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Test Coverage](#test-coverage)
- [Testing Best Practices](#testing-best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting Tests](#troubleshooting-tests)

---

## Testing Stack

### Backend (NestJS)

- **Framework**: Jest 29+
- **HTTP Testing**: Supertest
- **Database**: Testcontainers (PostgreSQL)
- **Mocking**: Jest mocks, jest-mock-extended
- **Coverage**: Istanbul (built into Jest)

### Frontend (Next.js)

- **Framework**: Vitest
- **Component Testing**: React Testing Library
- **E2E Testing**: Playwright
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: Vitest coverage

### Analytics (FastAPI)

- **Framework**: pytest
- **HTTP Testing**: httpx TestClient
- **Async Testing**: pytest-asyncio
- **Mocking**: unittest.mock, pytest-mock
- **Coverage**: pytest-cov

---

## Test Structure

### Directory Structure

```
services/backend/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts         # Unit tests
│   │   ├── auth.controller.ts
│   │   ├── auth.controller.spec.ts      # Unit tests
│   │   └── __tests__/
│   │       └── auth.integration.spec.ts # Integration tests
│   └── ...
├── test/
│   ├── e2e/
│   │   ├── auth.e2e-spec.ts             # E2E tests
│   │   └── transactions.e2e-spec.ts
│   ├── fixtures/
│   │   └── user.fixture.ts              # Test data
│   └── helpers/
│       └── test-helpers.ts              # Test utilities

apps/frontend/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx          # Component tests
│   └── ...
├── e2e/
│   ├── auth.spec.ts                     # Playwright E2E
│   └── dashboard.spec.ts
└── tests/
    ├── setup.ts                         # Test setup
    └── mocks/
        └── handlers.ts                  # MSW handlers
```

---

## Unit Testing

### Backend Unit Tests (Jest)

#### Service Testing

```typescript
// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const user = { id: '1', email, passwordHash: 'hashed' };

      usersRepository.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('mock-token');

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toEqual({ accessToken: 'mock-token' });
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      usersRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.login('invalid@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

#### Controller Testing

```typescript
// auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  describe('POST /auth/login', () => {
    it('should return tokens when login succeeds', async () => {
      // Arrange
      const dto: LoginDto = { email: 'test@example.com', password: 'pass' };
      const expectedResult = { accessToken: 'token', refreshToken: 'refresh' };
      service.login.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(dto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.login).toHaveBeenCalledWith(dto.email, dto.password);
    });
  });
});
```

### Frontend Unit Tests (Vitest)

#### Component Testing

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### Hook Testing

```typescript
// useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should return null user initially', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await result.current.login('test@example.com', 'password');

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

### Running Unit Tests

```bash
# Backend (Jest)
pnpm run test                           # Run all tests
pnpm run test:watch                     # Watch mode
pnpm run test --filter=services/backend # Backend only
pnpm run test auth.service.spec         # Specific file

# Frontend (Vitest)
pnpm run test --filter=@m-tracking/frontend
pnpm run test:ui                        # UI mode
pnpm run test Button.test               # Specific component

# Analytics (pytest)
cd services/analytics
pytest                                  # Run all tests
pytest tests/test_categorization.py     # Specific file
pytest -k "test_categorize"             # Pattern match
```

---

## Integration Testing

### Backend Integration Tests

```typescript
// auth.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let postgresContainer: PostgreSqlContainer;

  beforeAll(async () => {
    // Start PostgreSQL container
    postgresContainer = await new PostgreSqlContainer('postgres:15')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_pass')
      .start();

    // Create app with test database
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_URL')
      .useValue(postgresContainer.getConnectionUri())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
  });

  describe('POST /auth/register', () => {
    it('should register new user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'StrongPass123!',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        email: 'newuser@example.com',
        name: 'Test User',
      });
    });

    it('should return 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
```

### Running Integration Tests

```bash
# Backend
pnpm run test:integration

# With Testcontainers
docker ps  # Verify containers start/stop properly
```

---

## End-to-End Testing

### Frontend E2E Tests (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should allow user to register', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Sign Up');

    // Fill registration form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'StrongPass123!');
    await page.fill('input[name="confirmPassword"]', 'StrongPass123!');
    await page.fill('input[name="name"]', 'Test User');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('should allow user to login', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Install Playwright
pnpm create playwright

# Run E2E tests
pnpm run e2e

# Run with UI
pnpm run e2e:ui

# Run specific test
pnpm run e2e auth.spec.ts

# Debug mode
pnpm run e2e:debug
```

---

## Test Coverage

### Coverage Goals

- **Unit Tests**: 80%+ line coverage
- **Integration Tests**: Cover all critical paths
- **E2E Tests**: Cover all major user flows

### Generate Coverage Reports

```bash
# Backend
pnpm run test:cov --filter=services/backend

# Frontend
pnpm run test:coverage --filter=@m-tracking/frontend

# Analytics
cd services/analytics
pytest --cov=app --cov-report=html
```

### View Coverage Reports

```bash
# Backend & Frontend
open coverage/lcov-report/index.html

# Analytics
open htmlcov/index.html
```

---

## Testing Best Practices

### General Principles

1. **AAA Pattern** (Arrange, Act, Assert)
   ```typescript
   it('should do something', () => {
     // Arrange - Setup test data
     const input = { value: 10 };

     // Act - Execute the code
     const result = calculate(input);

     // Assert - Verify result
     expect(result).toBe(20);
   });
   ```

2. **Test Naming**
   ```typescript
   // ✅ Good - Descriptive
   it('should return 401 when token is expired')
   it('should calculate correct total for multiple items')

   // ❌ Bad - Vague
   it('works')
   it('test calculation')
   ```

3. **One Assertion Per Test** (when possible)
   ```typescript
   // ✅ Good
   it('should set user email', () => {
     expect(user.email).toBe('test@example.com');
   });

   it('should set user name', () => {
     expect(user.name).toBe('Test User');
   });

   // ⚠️ Acceptable for related properties
   it('should create user with correct properties', () => {
     expect(user.email).toBe('test@example.com');
     expect(user.name).toBe('Test User');
     expect(user.role).toBe('user');
   });
   ```

4. **Avoid Test Interdependence**
   ```typescript
   // ✅ Good - Independent tests
   describe('UserService', () => {
     beforeEach(() => {
       // Fresh setup for each test
       user = createTestUser();
     });
   });

   // ❌ Bad - Tests depend on order
   it('creates user', () => { /* ... */ });
   it('updates user', () => { /* depends on previous test */ });
   ```

5. **Mock External Dependencies**
   ```typescript
   // ✅ Good - Mock external API
   jest.mock('./plaid.service');

   // ❌ Bad - Real API calls in tests
   const response = await fetch('https://api.plaid.com/...');
   ```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm run lint --filter=services/backend

      - name: Run unit tests
        run: pnpm run test --filter=services/backend

      - name: Run integration tests
        run: pnpm run test:integration --filter=services/backend

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test --filter=@m-tracking/frontend

      - name: Run E2E tests
        run: pnpm run e2e

  test-analytics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          cd services/analytics
          pip install uv
          uv sync

      - name: Run tests
        run: |
          cd services/analytics
          pytest --cov=app
```

---

## Troubleshooting Tests

### Common Issues

#### Tests Timeout
```bash
# Increase timeout in Jest
jest.setTimeout(30000);

# Increase timeout in Playwright
test.setTimeout(60000);
```

#### Database Connection Issues
```bash
# Check Testcontainers logs
docker logs <container-id>

# Manually verify container
docker ps
docker exec -it <container-id> psql -U test_user -d test_db
```

#### Flaky Tests
```bash
# Run specific test multiple times
pnpm run test auth.spec --run-in-band

# Disable parallel execution
jest --runInBand
```

#### Coverage Not Generated
```bash
# Clear Jest cache
jest --clearCache

# Regenerate coverage
pnpm run test:cov --coverage --coverage-reporters=html
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [pytest Documentation](https://docs.pytest.org/)

---

**Last Updated:** 2026-01-18
