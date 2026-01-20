# Contributing to M-Tracking

Thank you for your interest in contributing to M-Tracking! This guide will help you understand our development workflow, coding standards, and contribution process.

**Last Updated**: January 19, 2026

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## Code of Conduct

This project adheres to professional development standards. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

Ensure you have the required tools installed:

- **Node.js**: >= 20.10.0 (recommend 24.13.0 LTS)
- **pnpm**: >= 10.28.0 (enforced via packageManager field)
- **Python**: >= 3.12 (with uv)
- **Docker**: Latest version
- **Docker Compose**: Latest version
- **Git**: Latest version

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/m-tracking.git
   cd m-tracking
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/m-tracking.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Install Python dependencies** (Analytics service):
   ```bash
   cd services/analytics
   uv sync
   cd ../..
   ```

6. **Start local infrastructure**:
   ```bash
   pnpm run docker:up
   ```

7. **Configure environment variables**:
   ```bash
   cp apps/frontend/.env.example apps/frontend/.env
   cp services/backend/.env.example services/backend/.env
   cp services/analytics/.env.example services/analytics/.env
   ```

8. **Start development servers**:
   ```bash
   pnpm run dev
   ```

---

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

- **`main`** - Production-ready code, protected branch
- **`develop`** - Development branch (if used)
- **`feature/*`** - New features (e.g., `feature/add-budget-alerts`)
- **`fix/*`** - Bug fixes (e.g., `fix/transaction-sync-error`)
- **`docs/*`** - Documentation updates (e.g., `docs/update-api-docs`)
- **`refactor/*`** - Code refactoring (e.g., `refactor/auth-module`)
- **`test/*`** - Testing improvements (e.g., `test/add-e2e-budget-tests`)

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Push to your fork
git push -u origin feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch on top of upstream/main
git rebase upstream/main

# If conflicts occur, resolve them and continue
git rebase --continue

# Force push to your fork (required after rebase)
git push -f origin feature/your-feature-name
```

---

## Coding Standards

For complete coding standards, see [docs/code-standards.md](./docs/code-standards.md).

### Core Principles

- **YAGNI** (You Aren't Gonna Need It) - Don't build features until needed
- **KISS** (Keep It Simple, Stupid) - Favor simple, clear solutions
- **DRY** (Don't Repeat Yourself) - Avoid code duplication
- **SOLID** - Follow SOLID principles for object-oriented design

### File Naming

- Use **kebab-case**: `user-registration.service.ts`
- Be **descriptive**: `transaction-categorization-logic.ts` (long names OK)
- Readable names > short names: LLMs should understand purpose from name

### File Size

- **Maximum 200 lines per file** (exceptions require justification)
- Split large files into smaller, focused modules
- Extract complex logic into separate utility files

### TypeScript Guidelines

- **Strict mode**: Always enabled
- **No `any` types**: Use `unknown` with type guards instead
- **Explicit return types**: All functions must declare return types
- **Interfaces vs Types**:
  - Use `interface` for object shapes
  - Use `type` for unions, intersections, and primitives

### Backend (NestJS)

- **No `console.log`**: Use Winston logger
- **DTO validation**: Use class-validator for all DTOs
- **Repository pattern**: Data access via repositories
- **Error handling**: Use custom exception filters
- **Dependency injection**: Use NestJS DI container

### Frontend (Next.js)

- **Server Components first**: Default to RSC, use Client Components only when needed
- **File structure**: Co-locate components, hooks, and styles
- **Forms**: React Hook Form + Zod validation
- **Styling**: TailwindCSS (mobile-first approach)
- **Accessibility**: WCAG 2.1 AA compliance

### Code Quality

- Write **self-documenting code** with clear variable names
- Add **JSDoc comments** for public APIs
- **No dead code**: Remove commented-out code
- **No TODO comments**: Create GitHub issues instead

---

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): implement OAuth login` |
| `fix` | Bug fix | `fix(transaction): resolve sync timing issue` |
| `docs` | Documentation | `docs(readme): update installation steps` |
| `style` | Code style (formatting, no logic change) | `style(budget): format with prettier` |
| `refactor` | Code refactoring | `refactor(auth): extract JWT logic to service` |
| `test` | Add or update tests | `test(transaction): add unit tests for sync` |
| `chore` | Build, dependencies, tooling | `chore(deps): upgrade nestjs to 11.1.12` |
| `perf` | Performance improvement | `perf(db): optimize transaction query` |
| `ci` | CI/CD changes | `ci(gh-actions): add test coverage report` |

### Scope

Scope indicates the affected module or area:
- `auth`, `transaction`, `bank`, `budget`, `notification`
- `frontend`, `backend`, `analytics`
- `docs`, `deps`, `ci`, `docker`

### Examples

```bash
feat(auth): add refresh token rotation
fix(transaction): resolve duplicate detection bug
docs(api): update authentication endpoints
refactor(budget): extract calculation logic to service
test(bank): add integration tests for plaid sync
chore(deps): update typescript to 5.9.x
```

### Commit Best Practices

- **Atomic commits**: One logical change per commit
- **Present tense**: "add feature" not "added feature"
- **Imperative mood**: "fix bug" not "fixes bug"
- **Reference issues**: `fix(auth): resolve login bug (#123)`
- **Keep commits focused**: Don't mix refactoring with features

---

## Pull Request Process

### Before Creating a PR

1. **Update your branch** with latest main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks locally**:
   ```bash
   # Lint code
   pnpm run lint

   # Run tests
   pnpm run test

   # Check formatting
   pnpm run format:check

   # Build all projects
   pnpm run build
   ```

3. **Ensure quality**:
   - ✅ All tests pass
   - ✅ No linting errors
   - ✅ No TypeScript errors
   - ✅ Code compiles successfully
   - ✅ No security vulnerabilities

### Creating a Pull Request

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open PR on GitHub**:
   - Go to the upstream repository
   - Click "New Pull Request"
   - Select your fork and branch

3. **Fill out PR template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Related Issues
   Closes #123

   ## Type of Change
   - [ ] Bug fix (non-breaking change)
   - [ ] New feature (non-breaking change)
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] E2E tests added/updated
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   [Add screenshots for UI changes]

   ## Checklist
   - [ ] Code follows project standards
   - [ ] Self-review completed
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   - [ ] All tests pass
   ```

### PR Title Format

Follow the same format as commit messages:

```
feat(auth): implement JWT refresh token rotation
fix(transaction): resolve duplicate detection bug
```

### Review Process

- **At least 1 approval** required before merge
- **All CI checks must pass**:
  - Lint & format check
  - Type check
  - Unit tests
  - Integration tests
  - Build check
  - E2E tests
- **No merge conflicts** with main branch
- **Documentation updated** (if needed)
- **Tests added/updated** (if needed)

### After PR is Merged

1. **Delete your feature branch**:
   ```bash
   git checkout main
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your main branch**:
   ```bash
   git pull upstream main
   ```

3. **Sync your fork**:
   ```bash
   git push origin main
   ```

---

## Testing Requirements

### Test Coverage

- **Minimum 80% coverage** for new code
- **Critical paths**: 100% coverage
- **Run tests before committing**

### Test Types

**Backend (NestJS)**
- **Unit Tests**: Jest - Test individual services and utilities
- **Integration Tests**: Testcontainers - Test with real database
- **E2E Tests**: Supertest - Test API endpoints

**Frontend (Next.js)**
- **Unit Tests**: Vitest - Test components and hooks
- **Integration Tests**: Testing Library - Test component interactions
- **E2E Tests**: Playwright - Test user workflows

**Analytics (FastAPI)**
- **Unit Tests**: pytest - Test services and utilities
- **Integration Tests**: pytest + testcontainers

### Running Tests

```bash
# All tests
pnpm run test

# With coverage
pnpm run test:cov

# Specific project
pnpm run test --filter=services/backend
pnpm run test --filter=apps/frontend

# Watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e
```

### Test Guidelines

- **Test behavior**, not implementation details
- **Descriptive names**: `it('should return 401 when token is invalid')`
- **AAA pattern**: Arrange, Act, Assert
- **Mock external dependencies** (APIs, third-party services)
- **Use test fixtures** for consistent data
- **Write tests first** (TDD encouraged)

---

## Documentation

### When to Update Documentation

- ✅ **New features** - Update relevant docs and README
- ✅ **API changes** - Update API documentation
- ✅ **Breaking changes** - Update CHANGELOG and migration guide
- ✅ **Architecture changes** - Update architecture docs
- ✅ **Configuration changes** - Update setup guides

### Documentation Standards

- **Markdown**: Use Markdown for all documentation
- **Max 800 lines**: Split longer docs into multiple files
- **Code examples**: Include working code examples
- **Diagrams**: Use Mermaid.js for diagrams
- **Up-to-date**: Keep docs synchronized with code

### Files to Update

| File | When to Update |
|------|---------------|
| `README.md` | Setup or key feature changes |
| `PROJECT_STRUCTURE.md` | Architecture or folder structure changes |
| `docs/api-documentation.md` | API endpoint changes |
| `docs/code-standards.md` | Coding standards updates |
| `docs/development-roadmap.md` | Milestone completions |
| `docs/project-changelog.md` | All user-facing changes |

---

## Pre-commit Hooks

We use Husky to enforce code quality:

**Pre-commit**:
- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking (staged files)

**Pre-push**:
- Run tests
- Check build

If hooks fail, fix the issues before committing/pushing.

---

## Questions and Support

- **Documentation**: See [docs/](./docs/)
- **Architecture**: See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- **Code Standards**: See [docs/code-standards.md](./docs/code-standards.md)
- **Issues**: Create a GitHub issue with detailed description
- **Discussions**: Use GitHub Discussions for questions

---

## License

By contributing to M-Tracking, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](./LICENSE)).

---

**Thank you for contributing to M-Tracking!** 🎉

Your contributions help make financial management better for everyone.

*Last Updated: January 19, 2026*
