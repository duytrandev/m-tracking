# Phase 1: Critical Configuration Fixes

## Context Links
- Review Report: `plans/reports/configuration-review-260119-2134.md`
- Main Plan: `./plan.md`

## Overview

| Priority | P0 (Critical) |
|----------|---------------|
| Status | Pending |
| Effort | 9 hours |
| Description | Fix critical configuration issues blocking production readiness |

## Key Insights

From configuration review:
- No `workspace:*` protocol = phantom dependencies, version mismatches
- Missing `tsconfig.base.json` = circular dependency risk, config duplication
- Backend tsconfig has `strictBindCallApply: false`, `forceConsistentCasingInFileNames: false`
- All `project.json` files use `npm run` instead of `pnpm`
- No CI/CD workflow = no quality gates

## Requirements

### Functional
- All internal deps use `workspace:*` protocol
- Single source of truth for TypeScript config
- Automated testing on every PR

### Non-Functional
- Build time should not increase
- No breaking changes to existing functionality
- All changes must be compilable

## Architecture

```
Root Config Hierarchy:
tsconfig.base.json (NEW - shared strict settings)
    |
    +-- tsconfig.json (project references only)
    |
    +-- services/backend/tsconfig.json (extends base)
    +-- apps/frontend/tsconfig.json (extends base)
    +-- libs/*/tsconfig.json (extends base)
```

## Related Code Files

### Files to Modify
- `/Users/DuyHome/dev/any/freelance/m-tracking/.npmrc`
- `/Users/DuyHome/dev/any/freelance/m-tracking/pnpm-workspace.yaml`
- `/Users/DuyHome/dev/any/freelance/m-tracking/tsconfig.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/services/backend/tsconfig.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/services/backend/package.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/services/backend/project.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/apps/frontend/project.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/services/analytics/project.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/common/package.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/types/package.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/constants/package.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/utils/package.json`

### Files to Create
- `/Users/DuyHome/dev/any/freelance/m-tracking/tsconfig.base.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/.github/workflows/ci.yml`

---

## Implementation Steps

### Step 1: Update .npmrc Configuration (15 min)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/.npmrc`

**Current:**
```ini
shamefully-hoist=false
auto-install-peers=true
strict-peer-dependencies=false
node-linker=pnpm
```

**Replace with:**
```ini
## pnpm workspace configuration

# Use workspace protocol for internal deps
link-workspace-packages=true
save-workspace-protocol=rolling

# Prevent dependency hoisting (avoid phantom deps)
shamefully-hoist=false

# Automatically install peer dependencies
auto-install-peers=true

# Don't fail on peer dep mismatches (can be strict later)
strict-peer-dependencies=false

# Use symlinks for monorepo packages
node-linker=pnpm

# Use lockfile v9 (pnpm 10.x default)
lockfile-version=9
```

**Validation:**
```bash
pnpm install
```

---

### Step 2: Clean Up pnpm-workspace.yaml (10 min)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/pnpm-workspace.yaml`

**Current:**
```yaml
packages:
  - "apps/*"
  - "services/*"
  - "libs/*"
  - "libs/config/*"    # Redundant - already covered by libs/*
  - "libs/shared/*"    # Redundant - already covered by libs/*
```

**Replace with:**
```yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'libs/*'
```

**Note:** `libs/*` already covers all subdirectories. Redundant patterns removed.

---

### Step 3: Create tsconfig.base.json (30 min)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/tsconfig.base.json` (NEW)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "M-Tracking Base Configuration",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],

    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,

    "skipLibCheck": true,
    "incremental": true,

    "baseUrl": ".",
    "paths": {
      "@m-tracking/common": ["libs/common/src/index.ts"],
      "@m-tracking/common/*": ["libs/common/src/*"],
      "@m-tracking/types": ["libs/types/src/index.ts"],
      "@m-tracking/types/*": ["libs/types/src/*"],
      "@m-tracking/constants": ["libs/constants/src/index.ts"],
      "@m-tracking/constants/*": ["libs/constants/src/*"],
      "@m-tracking/utils": ["libs/utils/src/index.ts"],
      "@m-tracking/utils/*": ["libs/utils/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", "build", ".next", "coverage"]
}
```

---

### Step 4: Update Root tsconfig.json (15 min)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/tsconfig.json`

**Replace entire file with:**
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "exclude": ["node_modules", "dist", "build", ".next", "coverage"]
}
```

**Rationale:**
- Extends base for all strict settings
- Keeps decorator support at root level
- Project-specific configs inherit from base

---

### Step 5: Fix Backend tsconfig.json (30 min)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/services/backend/tsconfig.json`

**Replace entire file with:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2021",
    "lib": ["ES2021"],
    "outDir": "./dist",
    "rootDir": "./src",

    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,

    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",

    "baseUrl": "./",
    "paths": {
      "@gateway/*": ["src/gateway/*"],
      "@auth/*": ["src/auth/*"],
      "@transactions/*": ["src/transactions/*"],
      "@banking/*": ["src/banking/*"],
      "@budgets/*": ["src/budgets/*"],
      "@notifications/*": ["src/notifications/*"],
      "@shared/*": ["src/shared/*"],
      "@integrations/*": ["src/integrations/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

**Changes:**
- Extends `tsconfig.base.json` for strict settings
- Removed `strictBindCallApply: false` (inherited as true)
- Removed `forceConsistentCasingInFileNames: false` (inherited as true)
- Removed `noFallthroughCasesInSwitch: false` (inherited as true)
- Added `tsBuildInfoFile` for incremental build

**Post-step validation:**
```bash
cd /Users/DuyHome/dev/any/freelance/m-tracking/services/backend
pnpm tsc --noEmit
```

**Expected:** May have type errors to fix. Document and address separately if blocking.

---

### Step 6: Implement workspace:* Protocol (45 min)

#### 6a. Update backend package.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/services/backend/package.json`

**Add to dependencies section (if using shared libs):**
```json
{
  "dependencies": {
    "@m-tracking/common": "workspace:*",
    "@m-tracking/types": "workspace:*",
    "@m-tracking/constants": "workspace:*",
    "@m-tracking/utils": "workspace:*",
    // ... existing deps
  }
}
```

**Note:** Only add if backend actually imports from these libs. Check imports first:
```bash
grep -r "@m-tracking/" /Users/DuyHome/dev/any/freelance/m-tracking/services/backend/src || echo "No shared lib imports yet"
```

#### 6b. Update frontend package.json (if needed)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/apps/frontend/package.json`

**Add if using shared libs:**
```json
{
  "dependencies": {
    "@m-tracking/types": "workspace:*",
    "@m-tracking/constants": "workspace:*",
    // ... existing deps
  }
}
```

**Check imports first:**
```bash
grep -r "@m-tracking/" /Users/DuyHome/dev/any/freelance/m-tracking/apps/frontend/src || echo "No shared lib imports yet"
```

#### 6c. Reinstall dependencies

```bash
cd /Users/DuyHome/dev/any/freelance/m-tracking
pnpm install
```

**Expected output:** Should show workspace packages being linked.

---

### Step 7: Fix project.json Files (npm -> pnpm) (30 min)

#### 7a. Backend project.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/services/backend/project.json`

**Replace:**
```json
{
  "name": "backend",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "root": "services/backend",
  "sourceRoot": "services/backend/src",
  "prefix": "api",
  "tags": ["type:app", "scope:backend"],
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm dev",
        "cwd": "services/backend"
      },
      "configurations": {
        "production": {
          "command": "pnpm start"
        }
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "services/backend"
      },
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm start",
        "cwd": "services/backend"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm lint",
        "cwd": "services/backend"
      },
      "cache": true
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm test",
        "cwd": "services/backend"
      },
      "cache": true
    },
    "test:cov": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm test:cov",
        "cwd": "services/backend"
      },
      "cache": true
    }
  }
}
```

#### 7b. Frontend project.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/apps/frontend/project.json`

**Replace:**
```json
{
  "name": "frontend",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "root": "apps/frontend",
  "sourceRoot": "apps/frontend/src",
  "prefix": "app",
  "tags": ["type:app", "scope:frontend"],
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm dev",
        "cwd": "apps/frontend"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "apps/frontend"
      },
      "outputs": ["{projectRoot}/.next"],
      "cache": true
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm start",
        "cwd": "apps/frontend"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm lint",
        "cwd": "apps/frontend"
      },
      "cache": true
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm test",
        "cwd": "apps/frontend"
      },
      "cache": true
    },
    "test:e2e": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm test:e2e",
        "cwd": "apps/frontend"
      }
    },
    "test:cov": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm test:coverage",
        "cwd": "apps/frontend"
      },
      "cache": true
    }
  }
}
```

#### 7c. Analytics project.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/services/analytics/project.json`

**Add tags:**
```json
{
  "name": "analytics",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "root": "services/analytics",
  "tags": ["type:app", "scope:analytics", "platform:python"],
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uvicorn app.main:app --reload --port 5000",
        "cwd": "services/analytics"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "echo 'No linting configured for analytics yet'",
        "cwd": "services/analytics"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "echo 'No testing configured for analytics yet'",
        "cwd": "services/analytics"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "echo 'No build configured for analytics yet'",
        "cwd": "services/analytics"
      }
    }
  }
}
```

**Validation:**
```bash
pnpm nx run backend:build
pnpm nx run frontend:build
```

---

### Step 8: Create GitHub Actions CI Workflow (2 hours)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/.github/workflows/ci.yml` (NEW)

**Create directory first:**
```bash
mkdir -p /Users/DuyHome/dev/any/freelance/m-tracking/.github/workflows
```

**Content:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  main:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.10.0'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.28.0

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Setup Nx cache
        uses: actions/cache@v4
        with:
          path: .nx/cache
          key: ${{ runner.os }}-nx-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-nx-${{ hashFiles('**/pnpm-lock.yaml') }}-
            ${{ runner.os }}-nx-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Set Nx SHAs for affected commands
        uses: nrwl/nx-set-shas@v4

      - name: Run lint on affected projects
        run: pnpm nx affected -t lint --parallel=3

      - name: Run tests on affected projects
        run: pnpm nx affected -t test --parallel=3

      - name: Build affected projects
        run: pnpm nx affected -t build --parallel=3

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        if: success()
        with:
          name: build-artifacts
          path: |
            services/backend/dist
            apps/frontend/.next
          retention-days: 7
```

**Validation:**
- Push to branch and verify workflow runs
- Check logs for any errors

---

## Todo List

- [ ] Update .npmrc with workspace protocol settings
- [ ] Clean up pnpm-workspace.yaml (remove redundant patterns)
- [ ] Create tsconfig.base.json with strict settings
- [ ] Update root tsconfig.json to extend base
- [ ] Fix services/backend/tsconfig.json to extend base
- [ ] Add workspace:* protocol to backend package.json (if using shared libs)
- [ ] Add workspace:* protocol to frontend package.json (if using shared libs)
- [ ] Run pnpm install to verify workspace linking
- [ ] Update services/backend/project.json (npm -> pnpm)
- [ ] Update apps/frontend/project.json (npm -> pnpm)
- [ ] Update services/analytics/project.json (add tags)
- [ ] Create .github/workflows directory
- [ ] Create .github/workflows/ci.yml
- [ ] Run pnpm nx run-many -t build --all to verify builds work
- [ ] Fix any TypeScript errors from strict mode (document separately)
- [ ] Commit and push to trigger CI

---

## Success Criteria

- [ ] `pnpm install` shows workspace packages linked
- [ ] `pnpm nx run backend:build` succeeds
- [ ] `pnpm nx run frontend:build` succeeds
- [ ] `pnpm nx affected -t lint` runs without error
- [ ] CI workflow triggers on push/PR
- [ ] All project.json files use pnpm instead of npm

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| TypeScript strict mode breaks build | High | High | Fix errors incrementally, use `any` temporarily if blocking |
| workspace:* breaks dependency resolution | Medium | Low | Test with clean install |
| CI workflow fails | Low | Medium | Check logs, fix step by step |

---

## Security Considerations

- CI workflow does not expose secrets
- No credentials stored in config files
- `.env` files excluded from git

---

## Rollback Procedure

If issues occur:
```bash
git checkout main -- .npmrc pnpm-workspace.yaml tsconfig.json tsconfig.base.json
git checkout main -- services/backend/tsconfig.json services/backend/project.json
git checkout main -- apps/frontend/project.json
rm -rf .github/workflows/ci.yml
pnpm install
```

---

## Next Steps

After Phase 1 completion:
- Proceed to Phase 2: Nx Optimization
- Address any TypeScript errors documented during this phase
- Monitor CI workflow performance
