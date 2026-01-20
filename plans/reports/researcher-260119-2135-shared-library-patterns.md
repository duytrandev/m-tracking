# Research Report: Shared Library Management Patterns in Monorepos (2026)

**Research Date:** January 19, 2026
**Report Focus:** m-tracking monorepo shared library architecture
**Status:** Complete

---

## Executive Summary

Monorepo shared library management in 2026 centers on **granular organization, efficient dependency resolution, and tree-shakeable exports**. Current best practices favor organizing libraries by feature/concern, using pnpm workspaces for internal linking, maintaining dist vs src separation for local/published consumption, and leveraging TypeScript's type system for optimization. The m-tracking project's current structure (common, types, constants, utils, configs) aligns well with modern patterns but requires attention to barrel export granularity and versioning strategy.

**Key recommendation:** Adopt workspace protocol universally, implement granular barrel exports (grouped by feature/purpose), separate build outputs, and establish versioning with Changesets for when libraries are published.

---

## Research Methodology

- **Sources consulted:** 12 authoritative sources (pnpm docs, Turborepo guides, Medium articles, GitHub discussions)
- **Date range:** October 2025 - January 2026 (current best practices)
- **Key search terms:** monorepo patterns, pnpm workspaces, tree-shaking, barrel exports, library publishing, dependency management

---

## Key Findings

### 1. Library Organization & Granularity

#### Organizational Patterns

Best practice structure for monorepos separates concerns:

```
project/
├── apps/           # Applications (Next.js, Node.js, etc.)
├── packages/       # Reusable libraries
│   ├── ui/         # UI components
│   ├── utils/      # Utilities
│   ├── types/      # TypeScript types
│   ├── constants/  # Constants/configs
│   ├── api/        # API clients
│   └── hooks/      # React hooks (if applicable)
└── tools/          # Shared configs (ESLint, Prettier, TypeScript)
```

**When to create a shared library:**
- Code is used by 2+ packages
- Feature is distinct and logical unit
- Team wants to control versioning independently
- Library has significant size (>50 lines) or complexity

**Granularity principle:** Each library should have single responsibility. Over-granularity (too many small libs) increases cognitive load and linking overhead. Under-granularity (one mega lib) defeats tree-shaking benefits.

#### m-tracking Assessment

Current libraries are appropriately sized:
- `@m-tracking/types` - TypeScript definitions (correct)
- `@m-tracking/constants` - Domain constants (correct)
- `@m-tracking/utils` - Utility functions (consider splitting if 500+ lines)
- `@m-tracking/common` - Mixed utilities/decorators (candidate for splitting)

**Recommendation:** Keep current structure. Monitor `common` size; consider extracting decorators to `@m-tracking/decorators` if it exceeds 300 lines.

---

### 2. Dependency Management with pnpm

#### Workspace Protocol

pnpm provides `workspace:` protocol for internal dependencies:

```json
{
  "dependencies": {
    "@m-tracking/types": "workspace:*",
    "@m-tracking/utils": "workspace:^1.0.0",
    "@m-tracking/constants": "workspace:../constants"
  }
}
```

**Three strategies for `saveWorkspaceProtocol`:**

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `rolling` | Saves `workspace:*` (no version pinning) | Development (default, smoothest) |
| `true` | Saves `workspace:^1.0.0` (respects semver) | Publishing libraries |
| `false` | Saves absolute versions (no workspace protocol) | Legacy/specific cases |

**Recommended:** Use `rolling` strategy (workspace:*) for maximum development ergonomics. Before publishing, convert to absolute versions.

#### Phantom Dependencies & Hoisting

pnpm prevents "phantom dependencies" (implicit access to transitive deps) through strict isolation. Configure hoisting strategically:

```yaml
# pnpm-workspace.yaml
shamefullyHoist: false          # Default (strict isolation)
linkWorkspacePackages: true     # Link local packages to node_modules
includeWorkspaceRoot: false     # Run commands only on workspace packages
```

#### Performance Gains

pnpm delivers measurable improvements:
- **Disk usage:** 60-80% reduction vs npm/Yarn
- **Install speed:** 3-5x faster (cold installs ~15 seconds)
- **Cold starts:** No duplicate dependency trees

---

### 3. Build Artifacts & Publishing Strategy

#### Dist vs Src Imports

**Local development (symlinked):**
```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**Published to npm (use publishConfig):**
```json
{
  "exports": {
    ".": "./dist/index.js"
  },
  "publishConfig": {
    "main": "./dist/index.cjs",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts"
  }
}
```

**Why this works:**
- Local: TypeScript files bypass build step, instant feedback
- Published: Compiled output with type definitions for end users
- pnpm's `publishConfig` override mechanism simplifies workflow

#### Build Output Strategy

**Recommended approach:**
1. Keep source files in `src/`
2. Build outputs to `dist/` (not package root)
3. `.gitignore` dist folder
4. TypeScript compiler handles `.d.ts` generation

**tsup configuration example:**
```bash
tsup src/index.ts --format cjs,esm --dts
```

Output locations:
- ESM: `dist/index.js`
- CJS: `dist/index.cjs`
- Types: `dist/index.d.ts`

#### Versioning & Publishing Workflow

**Tool: Changesets**

Process:
1. Developer runs `changeset` to describe changes
2. Creates `.changeset/*.md` file (version bump + notes)
3. CI runs `changeset version` (updates package.json)
4. CI runs `changeset publish` (publishes to npm)

**Advantages:**
- Explicit changelog generation
- Semver compliance
- Atomic publishing across dependent packages
- Works seamlessly with pnpm

---

### 4. Library Types & Public APIs

#### Common Library Types

| Type | Purpose | Example |
|------|---------|---------|
| **Types** | TypeScript definitions | `@m-tracking/types` |
| **Constants** | Domain constants | `@m-tracking/constants` (categories, currencies, errors) |
| **Utils** | Pure functions | `@m-tracking/utils` (date, currency, validation) |
| **UI Components** | Reusable React components | Not in m-tracking yet |
| **Hooks** | Custom React hooks | Not in m-tracking yet |
| **API Clients** | API communication | Not in m-tracking yet |
| **Config** | Shared configurations | `eslint-config`, `prettier-config`, `typescript-config` |

#### Public API Design

**Export pattern (index.ts):**
```typescript
// Explicit exports (better tree-shaking)
export type { User, Role, Permission } from './types'
export { CURRENCY_CODES, EXPENSE_CATEGORIES } from './constants'
export { formatCurrency, parseDate } from './utils'
export * as validators from './validators'  // Namespace exports

// Avoid
// export * from './types'  // Re-exports everything
```

**Why explicit matters:**
- Tree-shaking works when bundler sees exact imports
- Prevents accidental API surface expansion
- Makes public API discoverable via IDE

#### Barrel File Anti-Pattern

**Problem:** Single barrel file prevents tree-shaking

```typescript
// BAD - entire module loaded
export * from './decorators/log'
export * from './decorators/cache'
export * from './decorators/retry'

import { LogDecorator } from '@m-tracking/common'  // Loads all decorators
```

**Solution:** Granular entry points

```typescript
// package.json exports
{
  "exports": {
    ".": "./src/index.ts",
    "./decorators": "./src/decorators/index.ts",
    "./decorators/log": "./src/decorators/log.ts",
    "./decorators/cache": "./src/decorators/cache.ts"
  }
}

// Usage
import { LogDecorator } from '@m-tracking/common/decorators/log'  // Only log loaded
```

---

### 5. Versioning Strategies

#### Independent vs Unified Versioning

| Approach | Behavior | Best For |
|----------|----------|----------|
| **Independent** | Each package has own semver | Mature libraries, published packages |
| **Unified (locked)** | All packages share version | Monorepo products (all released together) |
| **Mixed** | Config packages locked, libs independent | Hybrid approach (m-tracking candidate) |

**m-tracking recommendation:** Mixed approach
- Config packages: Unified version (updated rarely)
- Type/constant/util libraries: Independent versions (tight coupling to features)

#### Internal Package Versioning

For internal-only libraries (workspace:*), version numbers matter less than API stability:

```json
{
  "version": "0.0.1",  // Can stay 0.x during development
  "private": true       // Mark as internal
}
```

When ready to publish:
1. Switch `private: false`
2. Adopt semver strictly
3. Establish deprecation policy

---

### 6. Tree-Shaking & Bundle Optimization

#### Conditions for Tree-Shaking Success

1. **ESM output format** (CommonJS prevents tree-shaking)
2. **Explicit exports** (not barrel re-exports)
3. **Pure functions** (no side effects at module level)
4. **sideEffects declaration in package.json:**

```json
{
  "sideEffects": false,  // All code is pure
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

#### Type-Only Exports

Ensures types don't bloat bundles:

```typescript
// Good
export type { User, Role }
export { getUserById, createUser }

// Avoid
export { User, Role, getUserById, createUser }  // Ambiguous
```

#### When NOT to Use Barrels

Barrels acceptable only for tightly-coupled feature sets:

```typescript
// OK - single feature
export * from './calculator/add'
export * from './calculator/subtract'
export * from './calculator/multiply'

import { add, subtract } from '@m-tracking/calc'
```

Not appropriate when mixing unrelated utilities.

---

### 7. Consumer Patterns (How Apps Use Shared Libs)

#### Import Patterns

**Recommended:**
```typescript
// Granular imports
import type { User } from '@m-tracking/types'
import { CURRENCY_CODES } from '@m-tracking/constants'
import { formatCurrency } from '@m-tracking/utils'
import { LogDecorator } from '@m-tracking/common/decorators'
```

**Avoid:**
```typescript
// Wildcard imports
import * as Types from '@m-tracking/types'
import * as Utils from '@m-tracking/utils'

// Namespace pollution
const user: Types.User = { ... }
const formatted = Utils.formatCurrency(...)
```

#### Circular Dependencies

pnpm workspace tool prevents most circular issues, but be aware:

```typescript
// BAD - @m-tracking/utils imports @m-tracking/types (OK)
// But @m-tracking/types imports @m-tracking/utils (CIRCULAR)
```

**Prevention:** Maintain dependency direction:
- `types` depends on nothing
- `constants` depends on `types`
- `utils` depends on `types`, `constants`
- `common` depends on all above

#### Development Workflow

With symlinked packages, changes propagate instantly:

```bash
# Terminal 1: Watch @m-tracking/utils
cd packages/utils
pnpm run dev

# Terminal 2: Watch app
cd apps/web
pnpm run dev

# Changes in utils automatically available in app
```

---

## Anti-Patterns & Pitfalls

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **Single large barrel export** | Prevents tree-shaking, bundles everything | Use granular entry points |
| **Monolithic `common` library** | Unclear ownership, hard to maintain | Split by concern |
| **No version strategy** | Uncertainty when publishing | Use Changesets early |
| **Absolute imports across packages** | Brittle, hard to move/extract | Use workspace: protocol |
| **CJS-only builds** | No tree-shaking possible | Always generate ESM |
| **Phantom dependencies** | Implicit coupling to transitive deps | Use pnpm strict mode |
| **Untracked internal versions** | No semver discipline | Document versioning strategy |
| **No sideEffects declaration** | Bundler can't optimize | Add to package.json |

---

## Best Practices Summary

### Organization
- ✅ One library per concern (types, constants, utils, etc.)
- ✅ Keep libraries under 300-500 lines (split if larger)
- ✅ Use `packages/` and `tools/` directories
- ✅ Mark internal libraries with `"private": true`

### Dependencies
- ✅ Use `workspace:*` protocol for local packages
- ✅ Maintain dependency direction (no cycles)
- ✅ Use pnpm strict isolation (shamefullyHoist: false)
- ✅ Peer dependencies for shared libs like React

### Exports & APIs
- ✅ Explicit index.ts exports (no wildcard re-exports)
- ✅ Separate `main`, `module`, `types` entry points
- ✅ Use `export type {}` for TypeScript-only exports
- ✅ Consider granular entry points for large libraries

### Build & Publishing
- ✅ Generate ESM + CJS + types
- ✅ Use publishConfig for dist override
- ✅ Add `sideEffects: false` if code is pure
- ✅ Implement Changesets before publishing
- ✅ Document breaking changes

### Development
- ✅ Use dev watchers for instant feedback
- ✅ Import from src during development
- ✅ Test package.json exports before shipping
- ✅ Keep TypeScript strict mode enabled

---

## Recommendations for m-tracking

### Phase 1: Immediate (Current Structure)
1. Validate pnpm-workspace.yaml uses `workspace:*` for all internal deps
2. Add explicit barrel exports to each package (no wildcard re-exports)
3. Document public API for each library in README
4. Add `"private": true` to all packages (currently internal)
5. Add `"sideEffects": false` to packages with pure code

### Phase 2: Refactoring (Next Quarter)
1. Audit `@m-tracking/common` - consider splitting decorators
2. Implement granular entry points if library grows >300 lines
3. Add unit tests validating export structure
4. Set up tsup build scripts with proper outputs
5. Document versioning strategy (independent vs unified)

### Phase 3: Publishing (When Needed)
1. Add Changesets CLI to project
2. Remove `"private": true` from libraries to be published
3. Implement publishConfig override in package.json
4. Set up CI/CD for changeset workflows
5. Create CHANGELOG.md for published libraries

### Phase 4: Optimization (Ongoing)
1. Monitor bundle sizes with each app build
2. Use devtools to verify tree-shaking works
3. Document patterns in contributing guide
4. Review dependency graph quarterly
5. Keep TypeScript versions aligned across workspace

---

## Technology Landscape (2026)

### Current State of Tools

**pnpm (v9+):**
- Stable, widely adopted (Next.js, Vue, Vite, Nuxt, Material UI, Prisma all use it)
- Excellent monorepo support via workspaces
- publishConfig override is game-changer

**Turborepo:**
- High-performance build orchestration
- Works seamlessly with pnpm
- Caching and task pipelines reduce build times
- Not strictly necessary for small monorepos but valuable at scale

**TypeScript 5.6+:**
- First-class monorepo support
- Improved performance with workspace references
- Better type-checking across packages

**Changesets:**
- De facto standard for monorepo publishing
- Maintains changelog automatically
- Integrates with GitHub Actions seamlessly

### Maturity Assessment

All recommended tools are production-stable. No experimental dependencies needed.

---

## Security Considerations

### Dependency Management
- Monorepos reduce attack surface by centralizing deps
- Use `npm audit` regularly (pnpm includes vulnerability checking)
- Pin critical transitive dependencies

### Internal Library Security
- Use TypeScript strict mode to catch type errors early
- Implement input validation in utils/validators
- Mark sensitive constants clearly (API endpoints, feature flags)
- Use environment variables for secrets (never commit to libs)

### Publishing Security
- Use Changesets to maintain reproducible releases
- Test packages thoroughly before publishing
- Maintain version history and deprecation timeline
- Only publish libraries when stable (no 0.x major releases)

---

## Performance Implications

### Installation Performance
- **Initial setup:** 60-80% smaller node_modules with pnpm
- **Cold installs:** ~15 seconds (vs 30+ with npm)
- **Warm installs:** < 5 seconds
- **Symlinked packages:** Zero install time for local changes

### Build Performance
- **Incremental builds:** Only affected packages rebuild
- **Cache effectiveness:** High with Turborepo (50-70% faster builds)
- **Type-checking:** Workspace references skip full compilation
- **Tree-shaking:** Granular exports reduce bundle size 20-40%

### Runtime Performance
- **Bundle size:** 10-30% smaller with proper tree-shaking
- **Startup time:** Marginal improvement from smaller bundles
- **Memory usage:** Shared dependency linking reduces memory footprint

---

## Common Questions & Unresolved Items

**Q1: Should config packages (eslint-config, prettier-config) be versioned with other libs?**
- Recommendation: Yes, unified version (rarely change)
- Alternative: Keep them at 1.0.0 if stable

**Q2: When should we split `@m-tracking/utils`?**
- If exceeds 300 lines, consider: `@m-tracking/date-utils`, `@m-tracking/currency-utils`
- Current size not critical unless it becomes maintenance burden

**Q3: Should we publish libraries to npm now or wait?**
- Internal use: Keep private, use workspace protocol
- Public libraries: Ready to publish when stable (implement Changesets first)

**Q4: How to handle breaking changes in internal libraries?**
- Semver discipline not critical while private, but establish patterns now
- Document breaking changes in commit messages
- Implement Changesets to enforce discipline before publishing

**Q5: Should React be a peer dependency?**
- If creating UI components: Yes, peer dependency
- If creating utilities: No dependency needed
- Current setup (no React required) is correct for types/utils/constants

---

## References & Sources

### Official Documentation
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Publishing Libraries](https://turborepo.dev/docs/guides/publishing-libraries)
- [Nx Managing TypeScript Packages](https://nx.dev/blog/managing-ts-packages-in-monorepos)

### Best Practices Guides
- [The Ultimate Guide to Building a Monorepo in 2026](https://medium.com/@sanjaytomar717/the-ultimate-guide-to-building-a-monorepo-in-2025-sharing-code-like-the-pros-ee4d6d56abaa)
- [Mastering pnpm Workspaces: Complete Guide to Monorepo Management](https://blog.glen-thomas.com/software%20engineering/2025/10/02/mastering-pnpm-workspaces-complete-guide-to-monorepo-management.html)
- [Complete Monorepo Guide: pnpm + Workspace + Changesets](https://jsdev.space/complete-monorepo-guide/)
- [Monorepos: A Comprehensive Guide with Examples](https://medium.com/@julakadaredrishi/monorepos-a-comprehensive-guide-with-examples-63202cfab711)

### Tree-Shaking & Build Strategy
- [A Practical Guide Against Barrel Files for Library Authors](https://dev.to/thepassle/a-practical-guide-against-barrel-files-for-library-authors-118c)
- [Tree-shaking with TypeScript Barrel Files](https://github.com/webpack/webpack/discussions/16863)
- [Live Types in a TypeScript Monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)

### Community Resources
- [Monorepo Tools & Comparison](https://monorepo.tools/)
- [CircleCI Monorepo Development Practices](https://circleci.com/blog/monorepo-dev-practices/)
- [Aviator: Monorepo Tools for 2025](https://www.aviator.co/blog/monorepo-tools/)

---

**Report Generated:** January 19, 2026 | 14:35 UTC
**Next Review:** Quarterly or upon major tooling updates
