# TypeScript Configuration Audit Report

**Date**: January 23, 2026  
**Scope**: All `tsconfig.json` files across the M-Tracking monorepo  
**Status**: ⚠️ Review Required - Several issues identified

---

## Executive Summary

The TypeScript configuration across your monorepo has a **solid foundation** with strong strict mode settings and proper base configuration. However, there are **critical inconsistencies** in module resolution strategies and several medium-priority improvements needed for better maintainability and consistency.

**Key Findings**:

- ❌ 1 Critical Issue (Module Resolution Mismatch)
- ⚠️ 3 Medium Issues (Project References, Redundant Options, Shared Lib Config)
- ℹ️ 2 Low Issues (Missing Options, Path Mapping)

---

## Files Audited

1. `/tsconfig.base.json` - Root base configuration
2. `/tsconfig.json` - Monorepo references configuration
3. `/apps/frontend/tsconfig.json` - Next.js 16 frontend
4. `/services/backend/tsconfig.json` - NestJS backend
5. `/libs/shared/tsconfig.json` - Shared utilities library

---

## Detailed Findings

### ✅ Strengths

#### 1. Strong Base Configuration (`tsconfig.base.json`)

**Status**: Excellent

Your base configuration demonstrates best practices:

```jsonc
// Comprehensive strict mode
"strict": true,
"strictNullChecks": true,
"noImplicitAny": true,
"strictBindCallApply": true,
"strictFunctionTypes": true,
"strictPropertyInitialization": true,
"noImplicitThis": true,
"alwaysStrict": true,

// Additional quality checks
"noUnusedLocals": true,
"noUnusedParameters": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
"noUncheckedIndexedAccess": true
```

**Impact**: Catches errors at compile time, improves code quality and maintainability.

---

#### 2. Proper Monorepo Structure with Project References

**Status**: Good

Using composite builds and references enables:

- Faster incremental builds
- Better IDE support
- Clear project dependencies

---

#### 3. Environment-Specific Configurations

**Status**: Appropriate

Each project correctly overrides settings for its specific needs:

- **Frontend**: Adds `jsx: "preserve"` and DOM libraries
- **Backend**: Adds `emitDecoratorMetadata` and `experimentalDecorators` for NestJS
- **Shared**: Minimal overrides with output settings

---

### 🔴 Critical Issues

#### Issue #1: Module Resolution Mismatch

**Severity**: 🔴 Critical  
**Files Affected**:

- `/services/backend/tsconfig.json`
- `/libs/shared/tsconfig.json`

**Current State**:

```jsonc
// Root package.json declares ESM
"type": "module",

// But tsconfig.base.json specifies:
"module": "ESNext",
"moduleResolution": "bundler",

// Backend overrides to:
"module": "commonjs",
"moduleResolution": "node",

// Shared lib also uses:
"module": "CommonJS",
"moduleResolution": "node"
```

**Problem**:

- Your root `package.json` declares `"type": "module"` (ESM)
- But backend and shared lib are configured for CommonJS
- This creates inconsistency and may cause runtime issues
- Build tooling (Vite, Turbopack) may behave unexpectedly

**Impact**:

- 🚨 Potential module resolution failures
- 🚨 Inconsistent module format across packages
- 🚨 Dependency resolution issues

**Recommendation**:
Standardize to ESM across all packages to match your `package.json` declaration:

```jsonc
// services/backend/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext", // ← Change from "commonjs"
    "moduleResolution": "bundler", // ← Change from "node"
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "paths": {
      "@gateway/*": ["src/gateway/*"],
      "@auth/*": ["src/auth/*"],
      "@transactions/*": ["src/transactions/*"],
      "@banking/*": ["src/banking/*"],
      "@budgets/*": ["src/budgets/*"],
      "@notifications/*": ["src/notifications/*"],
      "@shared/*": ["src/shared/*"],
      "@integrations/*": ["src/integrations/*"],
    },
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "test",
    "**/*.spec.ts",
    "vitest.config.ts",
    "vitest.setup.ts",
  ],
  "references": [{ "path": "../../libs/shared" }],
}
```

```jsonc
// libs/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext", // ← Change from "CommonJS"
    "moduleResolution": "bundler", // ← Change from "node"
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "declaration": true,
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
}
```

---

### ⚠️ Medium Issues

#### Issue #2: Non-Existent Project References

**Severity**: ⚠️ Medium  
**File**: `/tsconfig.json`

**Current State**:

```jsonc
"references": [
  { "path": "./libs/types" },      // ❌ Does not exist
  { "path": "./libs/constants" },  // ❌ Does not exist
  { "path": "./libs/utils" },      // ❌ Does not exist
  { "path": "./libs/common" },     // ❌ Does not exist
  { "path": "./apps/frontend" },   // ✅ Exists
  { "path": "./services/backend" } // ✅ Exists
]
```

**Actual Structure**:

```
libs/
  shared/          // ← Only this exists
```

**Problem**:

- TypeScript will fail to resolve these references
- Build errors when running `tsc` or `nx build`
- Confusing for developers about actual project structure

**Impact**: 🚨 Build failures, incorrect dependency graph

**Recommendation**:

```jsonc
// /tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "files": [],
  "references": [
    { "path": "./libs/shared" }, // ← Update to actual lib
    { "path": "./apps/frontend" },
    { "path": "./services/backend" },
  ],
}
```

---

#### Issue #3: Redundant Compiler Option Declarations

**Severity**: ⚠️ Medium  
**Files Affected**: All project-level `tsconfig.json` files

**Current State**:

Frontend redeclares options already in base:

```jsonc
// tsconfig.base.json already has:
"target": "ES2022",
"lib": ["ES2022"],
"module": "ESNext",
"moduleResolution": "bundler",

// frontend/tsconfig.json re-declares:
{
  "compilerOptions": {
    "target": "ES2022",           // ← Redundant
    "lib": ["ES2022", "DOM", "DOM.Iterable"], // ← Only DOM additions needed
    "module": "ESNext",           // ← Redundant
    "moduleResolution": "bundler" // ← Redundant
  }
}
```

Backend similarly redeclares several options.

**Problem**:

- Maintenance burden - changes needed in multiple places
- Harder to track effective configuration
- Risk of configuration drift

**Impact**: 📋 Maintainability concern

**Recommendation**:

```jsonc
// apps/frontend/tsconfig.json - Simplified
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"], // ← Only add DOM, don't repeat ES2022
    "jsx": "preserve",
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "composite": true,
    "tsBuildInfoFile": "./.next/.tsbuildinfo",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
    },
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
  ],
  "exclude": ["node_modules"],
}
```

```jsonc
// services/backend/tsconfig.json - Simplified
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "paths": {
      "@gateway/*": ["src/gateway/*"],
      "@auth/*": ["src/auth/*"],
      "@transactions/*": ["src/transactions/*"],
      "@banking/*": ["src/banking/*"],
      "@budgets/*": ["src/budgets/*"],
      "@notifications/*": ["src/notifications/*"],
      "@shared/*": ["src/shared/*"],
      "@integrations/*": ["src/integrations/*"],
    },
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "test",
    "**/*.spec.ts",
    "vitest.config.ts",
    "vitest.setup.ts",
  ],
  "references": [{ "path": "../../libs/shared" }],
}
```

---

#### Issue #4: Shared Library Configuration Too Minimal

**Severity**: ⚠️ Medium  
**File**: `/libs/shared/tsconfig.json`

**Current State**:

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "declaration": true,
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
}
```

**Problem**:

- Uses CommonJS which conflicts with ESM setup (see Issue #1)
- No `lib` or `target` override (uses base defaults - acceptable)
- Missing explicit declaration settings that match package.json exports

**Impact**: ⚠️ Module compatibility issues

**Recommendation**: Update to match ESM standard (see Issue #1 fix above)

---

### ℹ️ Low Priority Issues

#### Issue #5: Missing `noImplicitOverride` Compiler Option

**Severity**: ℹ️ Low (Nice-to-have)  
**File**: `tsconfig.base.json`

**Recommendation**:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    // ... existing options ...
    "strict": true,
    "noImplicitOverride": true, // ← Add this (TS 4.3+)
  },
}
```

**Benefit**: Prevents accidental method overrides in classes, reduces bugs.

---

#### Issue #6: Path Mapping Organization

**Severity**: ℹ️ Low (Optional improvement)  
**Status**: Currently handled well

**Current Approach** (Good):

- Base has shared lib paths: `@m-tracking/shared`
- Each project adds its own module paths: `@gateway/*`, `@/*`, etc.

**Suggestion**: Consider if you want to document which paths are available at each level in your [README.md](README.md) or [docs/system-architecture.md](../docs/system-architecture.md).

---

## Implementation Priority

### 🔴 High Priority (Do First)

| #   | Issue                          | Effort | Impact   |
| --- | ------------------------------ | ------ | -------- |
| 1   | Fix module resolution mismatch | 10 min | Critical |
| 2   | Fix non-existent references    | 5 min  | Critical |

### ⚠️ Medium Priority (Do Soon)

| #   | Issue                      | Effort | Impact          |
| --- | -------------------------- | ------ | --------------- |
| 3   | Simplify redundant options | 15 min | Maintainability |
| 4   | Update shared lib config   | 5 min  | Consistency     |

### ℹ️ Low Priority (Nice-to-have)

| #   | Issue                    | Effort | Impact       |
| --- | ------------------------ | ------ | ------------ |
| 5   | Add `noImplicitOverride` | 2 min  | Code quality |

---

## Recommended Action Plan

```bash
# Step 1: Update base configuration
# - Add noImplicitOverride: true

# Step 2: Update root reference file
# - Fix non-existent project references
# - Only reference libs/shared, apps/frontend, services/backend

# Step 3: Update backend tsconfig
# - Change to ESNext module and bundler resolution
# - Remove redundant compiler options

# Step 4: Update shared lib tsconfig
# - Change to ESNext module and bundler resolution
# - Align with backend pattern

# Step 5: Update frontend tsconfig
# - Remove redundant compiler options
# - Keep only DOM lib additions

# Step 6: Verify and test
npm run build
nx build --all
```

---

## Verification Commands

After applying fixes:

```bash
# Type check all projects
tsc --noEmit

# Build all projects with Nx
nx build --all

# Check compilation time
time tsc --noEmit

# Verify module resolution
npm ls @m-tracking/shared
```

---

## References

- [TypeScript Handbook - Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [TypeScript - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [ES Modules in Node.js](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

---

## Notes

- ESM is the standard moving forward; CommonJS is legacy
- Your frontend already uses ESM correctly
- Aligning backend and shared lib will ensure consistency across the entire monorepo
- These changes should be non-breaking if dependencies are properly configured

---

**Report Generated**: January 23, 2026  
**Next Review**: After implementing fixes, or when adding new projects to monorepo
