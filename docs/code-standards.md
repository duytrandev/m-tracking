# Code Standards & Guidelines

**Last Updated**: February 1, 2026 | **Version**: 1.0

---

## Overview

This document establishes the coding standards and conventions for the M-Tracking project. All developers must follow these guidelines to maintain code quality, consistency, and maintainability across the monorepo.

**Core Principles:** YAGNI (You Aren't Gonna Need It) | KISS (Keep It Simple, Stupid) | DRY (Don't Repeat Yourself)

---

## File Organization

### File Naming

**Convention:** kebab-case for all file names

```
src/features/auth/components/login-form.tsx      ✓ Correct
src/features/auth/components/LoginForm.tsx       ✗ Wrong (PascalCase)
src/features/auth/components/login_form.tsx      ✗ Wrong (snake_case)
```

**Guidelines:**

- Descriptive names that convey purpose (avoid abbreviations)
- Component files: match component name in lowercase
- Utility files: describe what they do (e.g., format-currency.ts)
- Test files: `{name}.test.ts` or `{name}.spec.ts`
- API clients: `{feature}-api.ts`
- Hooks: `use-{feature}.ts`
- Services: `{service}.service.ts`
- Constants: `constants.ts` or `{feature}.constants.ts`

### File Size Limits

**Target:** Keep all code files under 200 LOC for optimal context management

```typescript
// Good: Small, focused component (60 LOC)
export function LoginForm() {
  const form = useForm({ resolver: zodResolver(loginSchema) })
  return <Form {...form}><Input /></Form>
}

// Bad: Large component that should be split (250+ LOC)
// - Extract helper components to separate files
// - Extract validation logic to separate module
// - Use composition over large single files
```

**Splitting Strategy:**

- Extract utilities into separate `utils/` folder
- Break complex components into smaller focused ones
- Move business logic to services/hooks
- Create feature-specific modules for large features

### Directory Structure

**Frontend Feature Module:**

```
src/features/{feature}/
├── components/               # UI components (each <200 LOC)
│   ├── {component}.tsx
│   └── index.ts
├── hooks/                    # Custom React hooks
│   ├── use-{feature}.ts
│   └── index.ts
├── api/                      # API client
│   └── {feature}-api.ts
├── services/                 # Business logic
│   └── {service}.ts
├── store/                    # Zustand stores
│   └── {feature}-store.ts
├── validations/              # Zod schemas
│   └── {feature}-schemas.ts
├── types/                    # Feature-specific types
│   └── index.ts
└── index.ts                  # Public API
```

**Backend Module:**

```
src/{module}/
├── {module}.module.ts        # NestJS module definition
├── {module}.controller.ts    # HTTP endpoints
├── {module}.service.ts       # Business logic
├── entities/                 # TypeORM entities
│   └── {entity}.entity.ts
├── dto/                      # Data transfer objects
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── {entity}.dto.ts
├── repositories/             # Data access (optional, use services)
├── guards/                   # Authorization
├── strategies/               # Auth strategies
└── services/                 # Utility services
```

---

## TypeScript Configuration

### Compiler Settings

**All projects use strict mode:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "incremental": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Type Safety Requirements

**Rule 1: No `any` types**

```typescript
// Bad
const value: any = getSomeValue()

// Good - Use unknown and type guard
const value: unknown = getSomeValue()
if (typeof value === 'string') {
  // value is narrowed to string
}

// Good - Use proper types
const value: User = getUserData()
```

**Rule 2: Explicit return types**

```typescript
// Bad - Omit return type
function calculate(a: number, b: number) {
  return a + b
}

// Good - Explicit return type
function calculate(a: number, b: number): number {
  return a + b
}

// React component return type
function LoginForm(): React.ReactElement {
  return <form>...</form>
}
```

**Rule 3: No non-null assertions except justified cases**

```typescript
// Bad - Unjustified ! operator
const user = users.find(u => u.id === '123')!

// Good - Use optional chaining + nullish coalescing
const user = users.find(u => u.id === '123')
const userName = user?.name ?? 'Unknown'

// Justified - DOM elements that must exist
const input = document.getElementById('email') as HTMLInputElement
```

**Rule 4: Proper error handling with unknown type**

```typescript
// Bad
catch (error) {
  console.error(error.message) // error could be anything
}

// Good
catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
}
```

### Module System

**ES Modules everywhere:**

```typescript
// Correct
import { create } from 'zustand'
export function myFunction() {}

// Wrong
const express = require('express')
module.exports = MyClass
```

**Barrel exports for public APIs:**

```typescript
// src/features/auth/index.ts
export * from './hooks/use-auth'
export * from './components/login-form'
export * from './api/auth-api'
// Public API is now: import { useAuth, LoginForm, authApi } from '@/features/auth'
```

---

## ESLint Configuration

### Setup

**Root Config:** `eslint.config.js` (flat config v9)
**Shared Config:** `libs/shared/eslint.config.js` (extends root)

### ESLint Rules

**Enforced:**

- `no-console`: Error (use logger instead)
- `no-debugger`: Error
- `no-var`: Error (use const/let)
- `prefer-const`: Error
- `eqeqeq`: Error (use === instead of ==)
- `no-implicit-coercion`: Error

**Frontend-Specific:**

- React hooks rules: Error
- Import order: Warnings auto-fixed

**Backend-Specific:**

- NestJS decorators: No warnings

**Shared Library:**

- Static-only classes: Allowed
- Non-null assertions: Warning level

### Running ESLint

```bash
# Lint all projects
pnpm run lint

# Lint specific project
pnpm run lint:frontend
pnpm run lint:backend

# Auto-fix issues
pnpm run lint:fix
pnpm run lint:frontend:fix
```

---

## Prettier Formatting

**Config:** `prettier.config.js`

**Settings:**

- Print width: 80 characters
- Tab width: 2 spaces
- Semicolons: Required
- Single quotes: Preferred
- Trailing commas: ES5
- Bracket spacing: true

### Formatting Workflow

```bash
# Check formatting
pnpm run format:check

# Auto-format
pnpm run format

# Pre-commit hook (automatic)
# Files are auto-formatted before commit
```

---

## Coding Conventions

### Naming Conventions

**Variables & Functions:**

```typescript
// camelCase for variables and functions
const userData = { name: 'John' }
function calculateTotal(items: number[]): number {}

// UPPER_SNAKE_CASE for constants
const MAX_RETRIES = 3
const API_BASE_URL = 'http://localhost:4000'
const ERROR_CODES = { INVALID: 'INVALID_INPUT' }
```

**Classes & Types:**

```typescript
// PascalCase for classes
class AuthService {}
class UserRepository {}

// PascalCase for interfaces/types
interface IUser {}
type User = { id: string; name: string }

// Prefix interfaces with 'I' (legacy, acceptable in shared lib)
// Prefer types over interfaces for consistency
```

**React Components:**

```typescript
// PascalCase for component names
export function LoginForm() {}
export const Dashboard = () => {}

// Avoid FC/FunctionComponent type (verbose)
// Preferred: function declaration or arrow returning JSX
```

### Variable Declaration

```typescript
// Prefer const (default)
const user = getUser()

// Use let only when reassignment is needed
let count = 0
count++

// Never use var
var old = true // ✗ Forbidden
```

### Function Declaration

**Preference Order:**

1. **Function declarations** (hoisting, clarity)
2. **Arrow functions** (concise, lexical this)
3. **Methods** (class/object context)

```typescript
// 1. Function declaration (preferred for top-level)
function getUserById(id: string): User | null {
  return users.find(u => u.id === id) ?? null
}

// 2. Arrow function (preferred for callbacks)
const calculateTotal = (items: number[]): number => {
  return items.reduce((sum, item) => sum + item, 0)
}

// 3. Method in class
class UserService {
  getById(id: string): User | null {
    return this.repository.find(id)
  }
}
```

### Destructuring

**Use destructuring for clarity:**

```typescript
// Good - Destructure props
function UserCard({ name, email, avatar }: User) {
  return <div>{name}</div>
}

// Good - Destructure from objects
const { data, isLoading, error } = useQuery(...)

// Good - Nested destructuring
const { user: { profile: { name } } } = getUserData()

// Avoid - Deep nesting (use intermediate variables)
// Bad
const { a: { b: { c: { d } } } } = deeply.nested.object
// Good
const { a } = deeply.nested
const { b } = a
const { c } = b
const { d } = c
```

### Comments & Documentation

**JSDoc for public APIs:**

```typescript
/**
 * Calculates spending summary for a user in a date range.
 * @param userId - The user's unique identifier
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Object with total expense, income, net cash flow
 * @throws {NotFoundError} If user doesn't exist
 */
export function getSpendingSummary(
  userId: string,
  startDate: Date,
  endDate: Date
): SpendingSummary {}
```

**Inline comments for complex logic:**

```typescript
// Check if transaction is a duplicate by matching merchant + amount within 24h
const isDuplicate = transactions.some(
  t =>
    t.merchant === merchant &&
    t.amount === amount &&
    Math.abs(daysBetween(t.date, date)) <= 1
)

// Event-driven approach: emit event instead of direct call
// to avoid tight coupling between modules
eventEmitter.emit('transaction.created', transaction)
```

**Avoid obvious comments:**

```typescript
// Bad - States the obvious
// Get all users
const users = await userRepository.findAll()

// Bad - Can be expressed in code
// Check if email is valid
if (!email.includes('@')) {
}

// Good - Explains why
// Fetch users in batches to avoid memory overload on large datasets
const users = await userRepository.findAll({ batch: 100 })
```

---

## Frontend Patterns

### React Components

**Functional components only (no class components):**

```typescript
// Good
export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  return <div>{user?.name}</div>
}

// Bad - Use functional component instead
class UserProfile extends React.Component {
  render() { return <div>...</div> }
}
```

**Component Size & Composition:**

```typescript
// Keep components small (max 200 LOC)
// Extract sub-components for clarity

// LoginForm.tsx (~60 LOC - good)
export function LoginForm() {
  const form = useForm({ resolver: zodResolver(schema) })
  return (
    <form>
      <EmailField {...form} />
      <PasswordField {...form} />
      <SubmitButton />
    </form>
  )
}

// EmailField.tsx (~40 LOC - extracted)
export function EmailField({ control, errors }) {
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <Input {...field} placeholder="Email" />
      )}
    />
  )
}
```

### Hooks

**Custom hook naming & pattern:**

```typescript
// Always start with 'use'
export function useAuth() {
  const [user, setUser] = useState(null)
  return { user, setUser }
}

// Export hooks from feature index
// src/features/auth/hooks/index.ts
export { useAuth } from './use-auth'
export { useLogin } from './use-login'
```

**Dependency arrays:**

```typescript
// Exhaustive dependencies - use ESLint to enforce
useEffect(() => {
  // ...
}, [userId, email]) // Include all dependencies

// Empty array for mount-only
useEffect(() => {
  initialize()
}, [])
```

### State Management

**Zustand for global UI state:**

```typescript
// src/lib/store/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiStore = create<UIState>()(
  persist(
    set => ({
      theme: 'light',
      setTheme: theme => set({ theme }),
    }),
    { name: 'ui-store' }
  )
)

// Usage
function App() {
  const theme = useUiStore(state => state.theme)
  const setTheme = useUiStore(state => state.setTheme)
}
```

**React Query for server state:**

```typescript
// Use query keys from factory
const { data: user } = useQuery({
  queryKey: queryKeys.auth.user,
  queryFn: () => authApi.getMe(),
})

// Invalidate on mutation
const { mutate: login } = useMutation({
  mutationFn: authApi.login,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.auth.all,
    })
  },
})
```

### Forms

**React Hook Form + Zod pattern:**

```typescript
// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})

// Use in component
export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            placeholder="Email"
            error={error?.message}
          />
        )}
      />
    </form>
  )
}
```

---

## Backend Patterns

### NestJS Architecture

**Module structure:**

```typescript
// auth.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User, Session])],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService],
  exports: [AuthService], // Make available to other modules
})
export class AuthModule {}
```

**Service pattern:**

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: LoggerService
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } })
  }
}
```

**Controller pattern:**

```typescript
@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Body() dto: LoginDto): Promise<ApiResponse<LoginResponse>> {
    return this.authService.login(dto.email, dto.password)
  }
}
```

### Error Handling

**Pattern: Centralized Auth Exceptions**

All authentication errors use type-safe `AuthException` classes with codes from `AuthErrorCode` enum. The global `HttpExceptionFilter` handles formatting and response delivery.

**Quick Reference:**

```typescript
// Always use factory functions - ensures correct HTTP status codes
throw AuthExceptions.invalidCredentials() // 401
throw AuthExceptions.emailNotVerified() // 401
throw AuthExceptions.emailAlreadyRegistered() // 409
throw AuthExceptions.accountLocked(60) // 429 + retryAfter
throw AuthExceptions.rateLimited(30) // 429 + retryAfter
throw AuthExceptions.oauthEmailConflict(email) // 409
```

**Features:**

- Error codes are **single source of truth** (shared between frontend/backend)
- Frontend receives both title + field-specific hints for each error
- Rate-limited errors include `retryAfter` field (seconds to wait)
- Stack traces filtered in production
- Auth failures logged at WARN level for security
- 5xx errors automatically sent to Sentry

**See [error-handling-guide.md](./error-handling-guide.md) for:**

- Complete factory API reference
- Response format examples
- Frontend error handling patterns
- Best practices and examples

**General Exception Pattern (Non-Auth):**

```typescript
// Use typed exceptions extending HttpException
export class UserNotFoundException extends HttpException {
  constructor(userId: string) {
    super(`User ${userId} not found`, HttpStatus.NOT_FOUND)
  }
}

// Throw in service - filter handles formatting
async getUser(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } })
  if (!user) throw new UserNotFoundException(id)
  return user
}
```

### Validation

**DTOs with class-validator:**

```typescript
import { IsEmail, MinLength, IsString } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(12)
  password: string

  @IsString()
  name: string
}

// Auto-validated by global ValidationPipe
```

---

## Testing Standards

### Unit Tests (Vitest)

**File naming:** `{file}.test.ts` or `{file}.spec.ts`

**Structure:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('AuthService', () => {
  let service: AuthService
  let repository: Repository<User>

  beforeEach(() => {
    repository = createMockRepository()
    service = new AuthService(repository)
  })

  it('should hash password with bcrypt', async () => {
    const password = 'SecurePassword123!'
    const hash = await service.hashPassword(password)
    expect(hash).not.toBe(password)
  })
})
```

**Coverage targets:**

- Unit tests: 80%+ coverage
- Critical paths: 100% coverage
- Error scenarios: Covered

### E2E Tests (Playwright)

**File structure:** `tests/e2e/*.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })
})
```

---

## Git Commit Conventions

**Format:** `type(scope): description`

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `perf`: Performance improvement
- `test`: Test addition/modification
- `docs`: Documentation
- `style`: Formatting (no functional change)
- `chore`: Maintenance (deps, build, config)

**Examples:**

```bash
feat(auth): add 2FA TOTP setup flow
fix(transactions): correct duplicate detection logic
refactor(api-client): simplify error handling
perf(query): add caching for spending summaries
test(auth): add login mutation tests
docs(README): update quick start section
```

**Rules:**

- Use imperative mood ("add" not "added")
- Don't capitalize first letter
- No period at end
- Keep under 72 characters when possible
- Include issue number if applicable: `fix(auth): resolve #123`

---

## Pre-commit & Pre-push Hooks

**Husky + lint-staged configured:**

**Pre-commit (automatic):**

- ESLint --fix on staged files
- Prettier formatting
- Prevents commits with lint errors

**Pre-push (recommended):**

- Full test suite must pass
- Type checking must pass
- No console.logs in code

```bash
# Bypass hooks (discouraged)
git commit --no-verify
git push --no-verify
```

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] Code follows naming conventions (kebab-case files, camelCase vars)
- [ ] Files under 200 LOC (split if needed)
- [ ] No `any` types (use unknown or proper types)
- [ ] All functions have explicit return types
- [ ] No non-null assertions (!) unless justified
- [ ] Proper error handling with try-catch
- [ ] Comments only for complex logic
- [ ] Tests added for new functionality
- [ ] ESLint passes (pnpm run lint)
- [ ] Prettier formatted (pnpm run format)
- [ ] No console.logs in production code
- [ ] Commit messages follow conventions
- [ ] No secrets or credentials in code

---

## Performance Guidelines

### Frontend

- Keep components under 200 LOC
- Use React.memo for expensive components
- Lazy load routes with Next.js dynamic imports
- Optimize images with next/image
- Use query caching (5-min default)
- Avoid unnecessary re-renders (useCallback, useMemo)

### Backend

- Use database indexes on hot paths
- Implement caching (Redis) for frequent queries
- Paginate large result sets
- Use raw SQL for complex aggregations
- Connection pooling for databases
- Rate limiting on public endpoints

---

## Documentation Requirements

**Every public export needs documentation:**

```typescript
/**
 * Formats a currency amount according to locale and currency code.
 * @param amount - The amount to format (in cents)
 * @param currency - Currency code (e.g., 'USD', 'VND')
 * @returns Formatted string (e.g., '$12.34', '123,400 ₫')
 */
export function formatCurrency(amount: number, currency = 'USD'): string {}
```

**README in feature directories:**

```markdown
# Auth Feature

Brief description of what this feature does.

## Structure

- `components/` - UI components
- `hooks/` - Custom hooks
- `api/` - API client

## Usage

Basic usage example

## API Reference

Key exported functions/components
```

---

## Related Documents

- [docs/project-overview-pdr.md](./project-overview-pdr.md) - Product overview
- [docs/codebase-summary.md](./codebase-summary.md) - Project structure
- [docs/system-architecture.md](./system-architecture.md) - System design
- [docs/error-handling-guide.md](./error-handling-guide.md) - Error handling patterns and factories
- [docs/database-migrations.md](./database-migrations.md) - Database migrations guide
- [docs/project-roadmap.md](./project-roadmap.md) - Implementation status
