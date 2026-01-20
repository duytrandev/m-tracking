# Frontend Phase 9: Testing & E2E

**Duration:** Week 7-8
**Priority:** High
**Status:** Skipped (2026-01-16) - Per user request, will be implemented later
**Dependencies:** Phase 8 (Profile Management)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 9](./phase-09-testing-security.md)
- [Testing Strategy](../../docs/frontend-architecture/testing-strategy.md)

---

## Overview

Comprehensive testing of the frontend authentication system including unit tests, component tests, integration tests, E2E tests, and accessibility audits.

---

## Key Insights

- Use Vitest for unit and component tests
- Use React Testing Library for component behavior
- Use Playwright for E2E tests
- Use axe-core for accessibility testing
- Test happy paths and error scenarios
- Mock API calls for unit tests, use real API for E2E

---

## Requirements

### Testing Requirements
- 80%+ code coverage for auth features
- All forms tested for validation
- All API calls mocked correctly
- E2E tests for complete auth flows
- Accessibility tests passing

### Test Categories
1. Unit Tests - Functions, hooks, utilities
2. Component Tests - UI components, forms
3. Integration Tests - Feature flows with mocked API
4. E2E Tests - Full browser-based tests
5. Accessibility Tests - WCAG 2.1 AA compliance

---

## Architecture

### Test File Structure

```
apps/frontend/
├── src/
│   ├── features/auth/
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── login-form.test.tsx    # Component tests
│   │   ├── hooks/
│   │   │   ├── use-login.ts
│   │   │   └── use-login.test.ts      # Hook tests
│   │   └── validations/
│   │       ├── auth-schemas.ts
│   │       └── auth-schemas.test.ts   # Schema tests
│   └── lib/
│       ├── api-client.ts
│       └── api-client.test.ts         # API client tests
├── tests/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── register.spec.ts
│   │   │   ├── password-reset.spec.ts
│   │   │   └── 2fa.spec.ts
│   │   └── setup/
│   │       └── global-setup.ts
│   └── fixtures/
│       └── auth-fixtures.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## Related Code Files

### Files to Create

**Config:**
- `apps/frontend/vitest.config.ts`
- `apps/frontend/playwright.config.ts`
- `apps/frontend/tests/setup.ts`

**Unit Tests:**
- `src/features/auth/validations/auth-schemas.test.ts`
- `src/features/auth/services/token-service.test.ts`
- `src/lib/api-client.test.ts`

**Component Tests:**
- `src/features/auth/components/login-form.test.tsx`
- `src/features/auth/components/register-form.test.tsx`
- `src/features/auth/components/password-input.test.tsx`
- `src/features/auth/components/code-input.test.tsx`

**Hook Tests:**
- `src/features/auth/hooks/use-login.test.ts`
- `src/features/auth/hooks/use-register.test.ts`
- `src/features/auth/hooks/use-auth-init.test.ts`

**E2E Tests:**
- `tests/e2e/auth/login.spec.ts`
- `tests/e2e/auth/register.spec.ts`
- `tests/e2e/auth/password-reset.spec.ts`
- `tests/e2e/auth/oauth.spec.ts`
- `tests/e2e/auth/2fa.spec.ts`

**Test Utilities:**
- `tests/fixtures/auth-fixtures.ts`
- `tests/mocks/handlers.ts`

---

## Implementation Steps

### Step 1: Install Testing Dependencies (15 minutes)

```bash
cd apps/frontend

# Unit and component testing
pnpm add -D vitest @vitest/coverage-v8 @vitest/ui
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D jsdom msw

# E2E testing
pnpm add -D @playwright/test

# Accessibility testing
pnpm add -D @axe-core/playwright axe-core
```

### Step 2: Configure Vitest (30 minutes)

Create `apps/frontend/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/features/auth/**/*.{ts,tsx}', 'src/lib/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `apps/frontend/tests/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Step 3: Set Up MSW Mocks (1 hour)

Create `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:4000'

export const handlers = [
  // Login
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }

    if (body.email === 'test@example.com' && body.password === 'Test123!@#') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        expiresIn: 900,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          twoFactorEnabled: false,
          roles: ['user'],
        },
      })
    }

    if (body.email === '2fa@example.com') {
      return HttpResponse.json({
        requires2FA: true,
        email: '2fa@example.com',
      })
    }

    return HttpResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    )
  }),

  // Register
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string }

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      )
    }

    return HttpResponse.json({
      message: 'Registration successful. Please check your email.',
    })
  }),

  // Refresh
  http.post(`${API_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      accessToken: 'new-access-token',
      expiresIn: 900,
    })
  }),

  // Get current user
  http.get(`${API_URL}/users/me`, () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      twoFactorEnabled: false,
      roles: ['user'],
    })
  }),

  // Forgot password
  http.post(`${API_URL}/auth/forgot-password`, () => {
    return HttpResponse.json({
      message: 'If the email exists, a reset link has been sent.',
    })
  }),
]
```

Create `tests/mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Step 4: Write Validation Schema Tests (1 hour)

Create `src/features/auth/validations/auth-schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  calculatePasswordStrength,
} from './auth-schemas'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Test123!@#abc',
      name: 'Test User',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'Test123!@#abc',
      name: 'Test User',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejects weak password - too short', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Test1!',
      name: 'Test User',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('12 characters')
  })

  it('rejects password without special character', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'TestPassword123',
      name: 'Test User',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('special character')
  })

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Test123!@#abc',
      name: 'T',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'anypassword',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPassword123!',
      confirmPassword: 'DifferentPassword123!',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('do not match')
  })
})

describe('calculatePasswordStrength', () => {
  it('returns weak for short passwords', () => {
    expect(calculatePasswordStrength('abc')).toBe('weak')
    expect(calculatePasswordStrength('12345678')).toBe('weak')
  })

  it('returns medium for decent passwords', () => {
    expect(calculatePasswordStrength('Password123')).toBe('medium')
    expect(calculatePasswordStrength('abcdefghijkl')).toBe('medium')
  })

  it('returns strong for complex passwords', () => {
    expect(calculatePasswordStrength('Password123!@#')).toBe('strong')
    expect(calculatePasswordStrength('MyStr0ng!Pass')).toBe('strong')
  })
})
```

### Step 5: Write Component Tests (2 hours)

Create `src/features/auth/components/login-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './login-form'

// Create a wrapper with all providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />, { wrapper: createWrapper() })

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper: createWrapper() })

    await user.type(screen.getByLabelText(/email/i), 'invalid-email')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper: createWrapper() })

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Test123!@#')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument()
    })
  })

  it('has remember me checkbox checked by default', () => {
    render(<LoginForm />, { wrapper: createWrapper() })

    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeChecked()
  })

  it('has link to forgot password', () => {
    render(<LoginForm />, { wrapper: createWrapper() })

    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/auth/forgot-password'
    )
  })

  it('has link to register', () => {
    render(<LoginForm />, { wrapper: createWrapper() })

    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/auth/register'
    )
  })
})
```

Create `src/features/auth/components/code-input.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeInput } from './code-input'

describe('CodeInput', () => {
  it('renders 6 input boxes by default', () => {
    render(<CodeInput value="" onChange={() => {}} />)

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  it('renders custom length input boxes', () => {
    render(<CodeInput value="" onChange={() => {}} length={4} />)

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(4)
  })

  it('calls onChange when typing', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<CodeInput value="" onChange={onChange} />)

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], '1')

    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('auto-advances to next input', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<CodeInput value="" onChange={onChange} />)

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], '1')

    // Should focus on second input
    expect(document.activeElement).toBe(inputs[1])
  })

  it('calls onComplete when all digits entered', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <CodeInput value="" onChange={() => {}} onComplete={onComplete} />
    )

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], '123456')

    // Rerender with complete value
    rerender(
      <CodeInput value="123456" onChange={() => {}} onComplete={onComplete} />
    )

    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('handles paste correctly', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<CodeInput value="" onChange={onChange} />)

    const inputs = screen.getAllByRole('textbox')
    await user.click(inputs[0])
    await user.paste('123456')

    expect(onChange).toHaveBeenCalledWith('123456')
  })

  it('shows error state when error prop is true', () => {
    render(<CodeInput value="" onChange={() => {}} error />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveClass('border-destructive')
    })
  })
})
```

### Step 6: Configure Playwright (30 minutes)

Create `apps/frontend/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Step 7: Write E2E Tests (3 hours)

Create `tests/e2e/auth/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('displays login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible()
  })

  test('shows validation errors for empty submission', async ({ page }) => {
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Test123!@#')
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page).toHaveURL('/dashboard')
  })

  test('redirects to intended destination after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/transactions')

    // Should redirect to login with redirect param
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/)

    // Login
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Test123!@#')
    await page.getByRole('button', { name: /log in/i }).click()

    // Should redirect to original destination
    await expect(page).toHaveURL('/transactions')
  })

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i)
    const toggleButton = page.getByRole('button', { name: /show password/i })

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('has no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('supports keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /google/i })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email/i)).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/password/i)).toBeFocused()
  })
})
```

Create `tests/e2e/auth/register.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register')
  })

  test('displays registration form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('shows password strength indicator', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i)

    // Weak password
    await passwordInput.fill('abc')
    await expect(page.getByText(/weak/i)).toBeVisible()

    // Medium password
    await passwordInput.fill('Password123')
    await expect(page.getByText(/medium/i)).toBeVisible()

    // Strong password
    await passwordInput.fill('Password123!@#')
    await expect(page.getByText(/strong/i)).toBeVisible()
  })

  test('validates all fields', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page.getByText(/name must be at least/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password must be at least/i)).toBeVisible()
  })

  test('successful registration shows verification page', async ({ page }) => {
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('newuser@example.com')
    await page.getByLabel(/password/i).fill('StrongPass123!@#')
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page.getByText(/check your email/i)).toBeVisible()
    await expect(page.getByText(/newuser@example.com/i)).toBeVisible()
  })

  test('shows error for existing email', async ({ page }) => {
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('existing@example.com')
    await page.getByLabel(/password/i).fill('StrongPass123!@#')
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page.getByText(/already registered/i)).toBeVisible()
  })

  test('has no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

Create `tests/e2e/auth/2fa.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('2FA Flow', () => {
  test('redirects to 2FA page when required', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByLabel(/email/i).fill('2fa@example.com')
    await page.getByLabel(/password/i).fill('Test123!@#')
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page).toHaveURL('/auth/2fa-verify')
    await expect(page.getByText(/enter verification code/i)).toBeVisible()
  })

  test('shows 6 code input boxes', async ({ page }) => {
    // Navigate to 2FA page with proper state
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('2fa@example.com')
    await page.getByLabel(/password/i).fill('Test123!@#')
    await page.getByRole('button', { name: /log in/i }).click()

    const inputs = page.getByRole('textbox')
    await expect(inputs).toHaveCount(6)
  })

  test('can switch to backup code mode', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('2fa@example.com')
    await page.getByLabel(/password/i).fill('Test123!@#')
    await page.getByRole('button', { name: /log in/i }).click()

    await page.getByText(/use a backup code/i).click()
    await expect(page.getByLabel(/backup code/i)).toBeVisible()
  })
})
```

### Step 8: Add Test Scripts to Package.json (15 minutes)

Update `apps/frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "pnpm test:coverage && pnpm test:e2e"
  }
}
```

---

## Todo List

- [ ] Install testing dependencies
- [ ] Configure Vitest
- [ ] Set up MSW mocks
- [ ] Write validation schema tests
- [ ] Write login form tests
- [ ] Write register form tests
- [ ] Write code input tests
- [ ] Write hook tests
- [ ] Configure Playwright
- [ ] Write login E2E tests
- [ ] Write register E2E tests
- [ ] Write password reset E2E tests
- [ ] Write 2FA E2E tests
- [ ] Write accessibility tests
- [ ] Achieve 80% coverage
- [ ] All tests passing

---

## Success Criteria

- [ ] 80%+ code coverage achieved
- [ ] All unit tests passing
- [ ] All component tests passing
- [ ] All E2E tests passing
- [ ] Zero accessibility violations
- [ ] Tests run in CI/CD pipeline

---

## Test Coverage Goals

| Area | Target |
|------|--------|
| Validation schemas | 100% |
| Auth hooks | 80% |
| Auth components | 80% |
| API client | 80% |
| E2E happy paths | 100% |
| E2E error paths | 80% |

---

## Next Steps

After completion:
1. Set up CI/CD pipeline for tests
2. Add visual regression tests
3. Add performance tests
4. Document testing strategy
