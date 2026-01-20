# Research Report: TypeScript Configuration Best Practices for Monorepos (2026)

**Research Date:** January 19, 2026
**Focus:** NestJS backend, Next.js 16 frontend, shared libraries, monorepo configuration strategy

---

## Executive Summary

TypeScript monorepo configurations require strategic separation of root, project, and build configs to avoid circular dependencies while maintaining consistency. For your specific setup (NestJS CommonJS backend + Next.js ESNext frontend + 4 shared libs), recommended approach combines:

1. **Dual-config strategy**: tsconfig.base.json (shared defaults) + tsconfig.json (dev navigation) + tsconfig.build.json (build output)
2. **Path aliases via baseUrl+paths** for simpler <10 package monorepos (your case), with TypeScript project references as future scaling strategy
3. **Project-specific overrides**: Each project (backend, frontend, libs) extends base but optimizes for its target (CommonJS vs ESNext)
4. **Strict mode + incremental compilation** for development velocity and type safety
5. **Proper circular dependency prevention** through configuration layering

---

## Research Methodology

- **Sources consulted:** 15 authoritative sources
- **Date range:** 2024-2026, emphasizing latest practices
- **Key search terms:** monorepo tsconfig, path mapping, project references, CommonJS/ESNext targets, strict mode, incremental compilation

---

## Key Findings

### 1. Root Configuration Structure: Avoid Circular Dependencies

**Critical Rule:** Do NOT extend root tsconfig.json from project configs.

**Why:** Project configs extending root → root extending project = circular dependency. TypeScript compiler rejects this.

**Recommended Solution:**
```
Root directory structure:
├── tsconfig.base.json      ← Shared compiler options (extended by all projects)
├── tsconfig.json           ← List of all projects (for IDE navigation & references)
├── tsconfig.build.json     ← Build-specific overrides (if needed)
└── [packages/apps]/
    ├── tsconfig.json       ← Project config extending tsconfig.base.json
    └── tsconfig.build.json ← Optional: build-only overrides
```

**Root tsconfig.json ONLY contains:**
```json
{
  "references": [
    { "path": "./apps/backend" },
    { "path": "./apps/frontend" },
    { "path": "./libs/common" },
    { "path": "./libs/types" }
  ]
}
```

### 2. Path Mappings: Aliases vs Project References Trade-off

**For monorepos <~10 packages (your case):**
Use baseUrl + paths in tsconfig.base.json. Simpler, faster setup, sufficient boundary control.

**Recommended path alias pattern:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@m-tracking/common": ["libs/common/src/index.ts"],
      "@m-tracking/types": ["libs/types/src/index.ts"],
      "@m-tracking/constants": ["libs/constants/src/index.ts"],
      "@m-tracking/utils": ["libs/utils/src/index.ts"]
    }
  }
}
```

**For monorepos >100 packages:**
Use TypeScript project references. Enforces strict boundaries, prevents circular deps at TS level, reduces CI type-check time.

**Your decision:** Start with path aliases. Migrate to project references when package count approaches 15-20.

### 3. Backend (NestJS + CommonJS) Configuration

**Key compiler options for NestJS monorepo:**
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "lib": ["ES2021"],
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**Why these settings:**
- `module: commonjs` - Required for NestJS runtime (Node.js require system)
- `target: ES2021` - Modern Node.js versions support ES2021 natively
- `emitDecoratorMetadata` + `experimentalDecorators` - NestJS dependency injection requires decorators
- `strict: true` - Catches type errors early
- `incremental: true` - 50-80% faster rebuilds on subsequent compilations

### 4. Frontend (Next.js 16 + ESNext) Configuration

**Key compiler options for Next.js frontend:**
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "outDir": ".next",
    "rootDir": ".",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": false,
    "sourceMap": true,
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next"]
}
```

**Why these differences:**
- `module: esnext` - Next.js handles bundling (webpack), uses ES modules internally
- `target: ES2020` - Modern browser target (dropping IE11 support aligns with Next.js 16)
- `jsx: preserve` - Next.js preprocesses JSX, tsconfig shouldn't transform it
- `moduleResolution: bundler` - Next.js specific, optimized for webpack resolution
- `isolatedModules: true` - Required by Next.js, ensures file independence
- `noEmit: true` - Next.js does transpilation, TS only performs type checking
- `declaration: false` - Not needed for Next.js apps (only libs need this)

### 5. Shared Libraries Configuration

**Single tsconfig pattern for all libs** (libs/common, libs/types, libs/constants, libs/utils):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Why ESNext for libs:**
- Shared libraries use ES modules (standard npm package format)
- Consumers (backend/frontend) handle transpilation to their target
- Allows tree-shaking in Next.js builds
- NestJS can consume ESNext via CommonJS with `allowSyntheticDefaultImports`

### 6. Root tsconfig.base.json: Shared Defaults

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@m-tracking/common": ["libs/common/src/index.ts"],
      "@m-tracking/types": ["libs/types/src/index.ts"],
      "@m-tracking/constants": ["libs/constants/src/index.ts"],
      "@m-tracking/utils": ["libs/utils/src/index.ts"]
    },
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "declaration": false,
    "sourceMap": true
  }
}
```

**Never include in base config:**
- `module`, `target` - These vary per project
- `outDir`, `rootDir` - Project-specific
- `jsx` - Only relevant for React projects
- Exclude patterns - Let projects define their own

### 7. Type Checking: Strict Mode Implementation

**Recommended for your setup:**
- Enable `"strict": true` in all configs (base + all projects)
- This enables all strict flags: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.

**Strict mode benefits:**
- Catches implicit any types → prevents "any" escape hatches
- Enforces null/undefined checking → prevents null reference errors
- Forces explicit null assertions → makes null handling intentional
- Reduces runtime bugs significantly in Node.js/browser code

**Migration path if adding strict to existing code:**
Use `skipLibCheck: true` temporarily to suppress external library errors while fixing internal code.

### 8. Incremental Compilation: Build Performance

**Enable in all project configs:**
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

**Performance improvement:**
- First build: baseline
- Subsequent builds: 50-80% faster due to saved project graph information
- Critical for CI/CD pipelines with frequent builds

**Mechanism:**
- `.tsbuildinfo` file caches program state
- TS compiler loads cache before recompilation
- Only recomputes changed files + dependents

### 9. Declaration Files & Source Maps

**For shared libraries:**
```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- `declaration: true` - Generate .d.ts files for npm consumers
- `declarationMap: true` - Maps .d.ts back to source (.ts) for IDE navigation in consumers
- `sourceMap: true` - Debug transpiled JS in dev tools

**For applications (backend/frontend):**
- `declaration: false` - Apps don't export types
- `sourceMap: true` - Still needed for debugging
- `declarationMap` not needed

### 10. Circular Dependency Prevention: Practical Strategies

**Problem:** Shared lib imports from app code (or app imports from lib imports from app).

**Detection strategy:**
```bash
# After builds, check .tsbuildinfo for impossible references
# Use Nx/Turborepo dependency graphs to visualize
# Enable TSLint monorepo plugin to detect at lint time
```

**Prevention checklist:**
1. Shared libs (common, types, utils, constants) should NEVER import from apps/
2. Apps CAN import from shared libs
3. Backend and Frontend can import from each other only through shared libs
4. No cyclic imports even within shared libs

**Architectural layers (dependency direction →):**
```
apps/backend → libs/ ← apps/frontend
  (cannot import from each other directly)
```

### 11. Common Configuration Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Module resolution fails in monorepo | Path aliases not in tsconfig | Verify baseUrl + paths extend to all projects |
| Circular dependency errors | Config inheritance loops | Never extend root tsconfig.json from projects |
| Type errors in shared libs not caught | skipLibCheck hiding real errors | Use skipLibCheck: false in CI, true locally |
| Build slow on CI | No incremental compilation | Add incremental + tsBuildInfoFile to projects |
| Next.js path aliases not working | Aliases only in root, not frontend tsconfig | Frontend tsconfig must also have paths config |
| NestJS decorators not working | Missing emitDecoratorMetadata | Always enable for NestJS backend |
| IDE can't find types for imports | Source not in tsconfig include | Check include patterns match actual file locations |

---

## Comparative Analysis: Path Aliases vs Project References

### Path Aliases (Recommended NOW)
**Pros:**
- Simple setup (5 minutes)
- Works with all existing tooling (webpack, Next.js, ts-node, etc.)
- Lower maintenance overhead
- Fine for <10 packages

**Cons:**
- No type-level boundary enforcement
- All packages treated as single unit by TS compiler
- Can develop circular imports unknowingly (caught at runtime)

### TypeScript Project References (Recommend LATER)
**Pros:**
- Enforces architectural boundaries at TS level
- Circular deps detected at compile time
- Faster CI type-checking (parallel builds)
- Better for 100+ package monorepos

**Cons:**
- More complex setup (~30 minutes)
- Requires `composite: true` (changes build strategy)
- Not all tools support refs equally (ts-node needs setup)
- Migration complexity from path aliases

**Migration path for your project:**
```
Phase 1 (now): Path aliases in tsconfig.base.json
Phase 2 (when 15+ packages): Add project references alongside aliases
Phase 3 (when 50+ packages): Full project references, deprecate aliases
```

---

## Implementation Recommendations

### Quick Start Guide: Root tsconfig.json Files

**Step 1: Create tsconfig.base.json**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@m-tracking/common": ["libs/common/src/index.ts"],
      "@m-tracking/types": ["libs/types/src/index.ts"],
      "@m-tracking/constants": ["libs/constants/src/index.ts"],
      "@m-tracking/utils": ["libs/utils/src/index.ts"]
    },
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "sourceMap": true
  }
}
```

**Step 2: Create/Update root tsconfig.json**
```json
{
  "references": [
    { "path": "./apps/backend" },
    { "path": "./apps/frontend" },
    { "path": "./libs/common" },
    { "path": "./libs/types" },
    { "path": "./libs/constants" },
    { "path": "./libs/utils" }
  ]
}
```

**Step 3: Backend tsconfig.json (apps/backend/tsconfig.json)**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "declaration": true,
    "declarationMap": true,
    "lib": ["ES2021"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**Step 4: Frontend tsconfig.json (apps/frontend/tsconfig.json)**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "target": "ES2020",
    "jsx": "preserve",
    "outDir": ".next",
    "rootDir": ".",
    "incremental": true,
    "tsBuildInfoFile": ".next/.tsbuildinfo",
    "noEmit": true,
    "isolatedModules": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next"]
}
```

**Step 5: Shared Libs tsconfig.json (libs/*/tsconfig.json)**
Same pattern for all: common, types, constants, utils
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "target": "ES2020",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "lib": ["ES2020"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### Code Examples: Common Patterns

**Example 1: Using type aliases across monorepo**
```typescript
// In libs/types/src/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

// In apps/backend/src/user.service.ts
import { User } from '@m-tracking/types';

export class UserService {
  getUser(id: string): User {
    // implementation
  }
}

// In apps/frontend/src/pages/profile.tsx
import { User } from '@m-tracking/types';
import { useUser } from '@/hooks/useUser';

export default function ProfilePage() {
  const user: User = useUser();
  return <div>{user.name}</div>;
}
```

**Example 2: Using utility functions**
```typescript
// libs/utils/src/string.ts
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// apps/backend/src/app.service.ts
import { capitalize } from '@m-tracking/utils';

// apps/frontend/src/components/Header.tsx
import { capitalize } from '@m-tracking/utils';
```

**Example 3: Using constants**
```typescript
// libs/constants/src/index.ts
export const API_TIMEOUT = 5000;
export const MAX_RETRIES = 3;

// apps/backend/src/main.ts
import { API_TIMEOUT, MAX_RETRIES } from '@m-tracking/constants';

// apps/frontend/src/lib/client.ts
import { API_TIMEOUT } from '@m-tracking/constants';
```

### Common Pitfalls & Solutions

**Pitfall 1: "Cannot find module '@m-tracking/common'"**
- **Cause:** Path aliases not in consuming project's tsconfig
- **Fix:** Verify tsconfig extends tsconfig.base.json OR has paths config
- **Verify:** `tsc --listFiles` shows correct path resolution

**Pitfall 2: IDE shows errors but tsc builds successfully**
- **Cause:** IDE caching stale tsconfig
- **Fix:** Restart IDE/editor, delete .tsbuildinfo files, clear cache
- **Verify:** `npx tsc --version` matches editor's TS version

**Pitfall 3: Next.js shows "Module not found" at runtime**
- **Cause:** Aliases in root tsconfig but frontend tsconfig doesn't extend properly
- **Fix:** Ensure `apps/frontend/tsconfig.json` extends root tsconfig.base.json
- **Verify:** Next.js build logs mention correct path resolution

**Pitfall 4: Build success but circular dependency at runtime**
- **Cause:** Shared lib imports from backend/frontend code
- **Fix:** Audit imports in libs/, move problematic code to proper layer
- **Verify:** Dependency graph shows libs only as leaves (no incoming imports)

**Pitfall 5: Type mismatch between backend and frontend for same type**
- **Cause:** Types defined in two places instead of shared lib
- **Fix:** Consolidate types in libs/types, import from there everywhere
- **Verify:** Search for duplicate type names across codebase

**Pitfall 6: CommonJS backend can't consume ESNext shared libs**
- **Cause:** Misconfiguration of module settings
- **Fix:** Set lib module to ESNext, backend's `allowSyntheticDefaultImports` handles import
- **Verify:** Backend build works: `npm run build --workspace=backend`

---

## Security Considerations

**TypeScript-specific security angles:**

1. **Type Safety & Data Validation**
   - Strict mode prevents `any` type escapes (security risk for untrusted data)
   - Type guards enforce runtime validation for external inputs
   - Recommendation: Never disable strict mode for security-critical paths

2. **Dependency Type Safety**
   - `skipLibCheck: true` in dev OK, but use `false` in CI for full checking
   - Reduces ability of dependency confusion attacks to hide in types

3. **Source Maps in Production**
   - Source maps expose source code in browser/logs
   - Recommendation: Generate source maps for debugging, upload to error tracking (Sentry), don't ship with builds

4. **Path Aliases Won't Hide Secrets**
   - Aliases are compile-time only, don't provide obfuscation
   - Store secrets in .env files, NEVER in shared libs
   - Use environment-based config (process.env, ConfigModule in NestJS)

---

## Next Steps

### Immediate Actions (Week 1)
1. Create root `tsconfig.base.json` with path aliases
2. Update root `tsconfig.json` with references list
3. Update backend `tsconfig.json` - CommonJS, emitDecoratorMetadata
4. Update frontend `tsconfig.json` - ESNext, isolatedModules, noEmit
5. Update shared libs `tsconfig.json` - ESNext, declaration files
6. Test: `npm run build` each package independently
7. Verify IDE resolves imports correctly (@m-tracking/*)

### Short-term (Week 2-3)
1. Enable strict type checking in all configs
2. Fix any strict mode violations in existing code
3. Run full type check: `tsc --noEmit` from root
4. Configure CI/CD to run type checks on PR
5. Document path alias usage in CONTRIBUTING.md

### Medium-term (Month 2-3)
1. Add ESLint monorepo plugin for circular dependency detection
2. Automate .tsbuildinfo cleanup in CI
3. Monitor build times, consider caching tsbuildinfo in CI
4. Plan project references migration when package count >15

### Monitoring & Maintenance
- Weekly: Run `tsc --listFiles` to spot resolution issues
- Monthly: Review build times, incremental compilation effectiveness
- Per-release: Verify type safety improvements, run full strict checking

---

## Resources & References

### Official Documentation
- [TypeScript Handbook: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [NestJS CLI: Monorepo](https://docs.nestjs.com/cli/monorepo)
- [Next.js: Absolute Imports and Module Aliases](https://nextjs.org/docs/app/building-your-application/configuring/absolute-imports-and-module-aliases)

### Recommended Guides
- [Nx Blog: Managing TypeScript Packages in Monorepos](https://nx.dev/blog/managing-ts-packages-in-monorepos)
- [TypeScript Project References (Nx Blog)](https://nx.dev/blog/typescript-project-references)
- [Chaine Handbook: TSConfig in Monorepo](https://handbook.chaineapp.com/handbook/learning/coding/typescript/typescript-monorepo-config/)
- [Earthly: How to Set Up TypeScript Monorepo](https://earthly.dev/blog/setup-typescript-monorepo/)
- [DEV Community: Ultimate Guide to TypeScript Monorepos](https://dev.to/mxro/the-ultimate-guide-to-typescript-monorepos-5ap7)

### Community Resources
- [GitHub: belgattitude/nextjs-monorepo-example](https://github.com/belgattitude/nextjs-monorepo-example)
- [TypeScript Project References (Moonrepo)](https://moonrepo.dev/docs/guides/javascript/typescript-project-refs)
- [typescript-eslint: Monorepo Configuration](https://typescript-eslint.io/troubleshooting/typed-linting/monorepos/)

### Performance & Debugging
- [TypeScript: Incremental Compilation](https://www.typescriptlang.org/tsconfig/incremental.html)
- [Krython: TSC Build Modes - Incremental Compilation](https://krython.com/tutorial/typescript/tsc-build-modes-incremental-compilation/)
- [The Strict Compiler Option - Marius Schulz](https://mariusschulz.com/blog/the-strict-compiler-option-in-typescript)
- [Better Stack: TypeScript Strict Mode Guide](https://betterstack.com/community/guides/scaling-nodejs/typescript-strict-option/)

---

## Unresolved Questions & Future Investigations

1. **TypeScript 5.10+ Features**: Check release notes for monorepo-specific improvements (not yet available at cutoff)
2. **Workspace Protocol Performance**: How does pnpm workspace: protocol impact TS resolution vs path aliases?
3. **Turborepo TypeScript Integration**: Does Turborepo's remote caching work with incremental .tsbuildinfo files? Needs testing
4. **Declaration Map Debuggability**: Verify IDE support for declarationMap in shared lib scenario (may vary by editor)
5. **CommonJS + ESNext Interop Edge Cases**: Undocumented edge cases with allowSyntheticDefaultImports in monorepo scenario - recommend practical testing

---

**Report Generated:** 2026-01-19 21:35 UTC
**Next Review Date:** 2026-04-19 (3 months, when new TS versions likely released)
