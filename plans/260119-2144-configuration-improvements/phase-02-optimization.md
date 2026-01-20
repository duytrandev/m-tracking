# Phase 2: High Impact Optimization

## Context Links
- Review Report: `plans/reports/configuration-review-260119-2134.md`
- Main Plan: `./plan.md`
- Previous Phase: `./phase-01-critical-fixes.md`

## Overview

| Priority | P1 (High Impact) |
|----------|------------------|
| Status | Pending |
| Effort | 9 hours |
| Prerequisites | Phase 1 complete |
| Description | Optimize Nx caching, enforce module boundaries, improve shared library configs |

## Key Insights

From configuration review:
- `sharedGlobals` is empty - should include root configs
- Cache inputs too broad (`{projectRoot}/**/*` includes README, etc.)
- No project-specific inputs for NestJS vs Next.js vs libraries
- No module boundary enforcement via ESLint
- Shared libraries missing `sideEffects: false` for tree-shaking
- Libraries missing `exports` field for modern Node.js

## Requirements

### Functional
- Nx cache hit rate >85% for unchanged files
- Module boundaries enforced automatically
- Tree-shaking enabled for shared libraries

### Non-Functional
- Build time reduction of 30-50%
- Clear architectural boundaries between scopes
- No breaking changes to existing functionality

## Architecture

```
Module Boundary Rules:
type:app       --> type:lib (apps can only depend on libs)
scope:frontend --> scope:shared (frontend can use shared libs)
scope:backend  --> scope:shared (backend can use shared libs)
scope:shared   --> scope:shared (shared can only depend on shared)
```

## Related Code Files

### Files to Modify
- `/Users/DuyHome/dev/any/freelance/m-tracking/nx.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/.eslintrc.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/common/package.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/types/package.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/constants/package.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/utils/package.json`

### Files to Create
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/common/project.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/types/project.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/constants/project.json`
- `/Users/DuyHome/dev/any/freelance/m-tracking/libs/utils/project.json`

---

## Implementation Steps

### Step 1: Optimize nx.json Cache Configuration (1 hour)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/nx.json`

**Replace entire file with:**
```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": [
      "{projectRoot}/**/*",
      "!{projectRoot}/**/*.md",
      "!{projectRoot}/.env.example",
      "!{projectRoot}/README.md"
    ],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/**/*.md"
    ],
    "sharedGlobals": [
      "{workspaceRoot}/tsconfig.base.json",
      "{workspaceRoot}/tsconfig.json",
      "{workspaceRoot}/nx.json",
      "{workspaceRoot}/package.json",
      "{workspaceRoot}/pnpm-lock.yaml",
      "{workspaceRoot}/.prettierrc",
      "{workspaceRoot}/.eslintrc.json"
    ],
    "nestBuild": [
      "{projectRoot}/src/**/*.ts",
      "{projectRoot}/package.json",
      "{projectRoot}/tsconfig.json",
      "{projectRoot}/tsconfig.build.json",
      "{projectRoot}/nest-cli.json",
      "sharedGlobals",
      "^production"
    ],
    "nextBuild": [
      "{projectRoot}/app/**/*",
      "{projectRoot}/src/**/*",
      "{projectRoot}/public/**/*",
      "{projectRoot}/package.json",
      "{projectRoot}/tsconfig.json",
      "{projectRoot}/next.config.ts",
      "{projectRoot}/next.config.js",
      "{projectRoot}/next.config.mjs",
      "{projectRoot}/tailwind.config.js",
      "{projectRoot}/tailwind.config.ts",
      "{projectRoot}/postcss.config.js",
      "sharedGlobals",
      "^production"
    ],
    "libraryBuild": [
      "{projectRoot}/src/**/*.ts",
      "{projectRoot}/package.json",
      "{projectRoot}/tsconfig.json",
      "sharedGlobals",
      "^production"
    ]
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json", "{workspaceRoot}/eslint.config.js"],
      "cache": true
    },
    "dev": {
      "cache": false
    },
    "serve": {
      "cache": false
    }
  },
  "parallel": 3,
  "cacheDirectory": ".nx/cache",
  "defaultBase": "main"
}
```

**Changes:**
- Added `sharedGlobals` with root config files
- Added `nestBuild` input for NestJS projects
- Added `nextBuild` input for Next.js projects
- Added `libraryBuild` input for shared libraries
- Excluded `.md` files and `.env.example` from cache inputs
- Limited parallel execution to 3

**Validation:**
```bash
pnpm nx reset  # Clear cache
pnpm nx run backend:build
pnpm nx run backend:build  # Should be instant (cache hit)
```

---

### Step 2: Create Library project.json Files (1 hour)

Libraries need `project.json` files to participate in Nx task graph.

#### 2a. libs/common/project.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/common/project.json` (NEW)

```json
{
  "name": "common",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "root": "libs/common",
  "sourceRoot": "libs/common/src",
  "tags": ["type:lib", "scope:shared"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "libs/common"
      },
      "inputs": ["libraryBuild"],
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "type-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm type-check",
        "cwd": "libs/common"
      },
      "inputs": ["libraryBuild"],
      "cache": true
    }
  }
}
```

#### 2b. libs/types/project.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/types/project.json` (NEW)

```json
{
  "name": "types",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "root": "libs/types",
  "sourceRoot": "libs/types/src",
  "tags": ["type:lib", "scope:shared"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "libs/types"
      },
      "inputs": ["libraryBuild"],
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "type-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm type-check",
        "cwd": "libs/types"
      },
      "inputs": ["libraryBuild"],
      "cache": true
    }
  }
}
```

#### 2c. libs/constants/project.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/constants/project.json` (NEW)

```json
{
  "name": "constants",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "root": "libs/constants",
  "sourceRoot": "libs/constants/src",
  "tags": ["type:lib", "scope:shared"],
  "targets": {
    "type-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm type-check",
        "cwd": "libs/constants"
      },
      "inputs": ["libraryBuild"],
      "cache": true
    }
  }
}
```

#### 2d. libs/utils/project.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/utils/project.json` (NEW)

```json
{
  "name": "utils",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "root": "libs/utils",
  "sourceRoot": "libs/utils/src",
  "tags": ["type:lib", "scope:shared"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "libs/utils"
      },
      "inputs": ["libraryBuild"],
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "type-check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm type-check",
        "cwd": "libs/utils"
      },
      "inputs": ["libraryBuild"],
      "cache": true
    }
  }
}
```

**Validation:**
```bash
pnpm nx graph  # Should show all projects including libs
```

---

### Step 3: Configure Module Boundary Enforcement (2 hours)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/.eslintrc.json`

**Replace entire file with:**
```json
{
  "root": true,
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint", "@nx"],
  "rules": {
    "no-console": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "enforceBuildableLibDependency": true,
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "type:app",
            "onlyDependOnLibsWithTags": ["type:lib"]
          },
          {
            "sourceTag": "scope:frontend",
            "onlyDependOnLibsWithTags": ["scope:frontend", "scope:shared"]
          },
          {
            "sourceTag": "scope:backend",
            "onlyDependOnLibsWithTags": ["scope:backend", "scope:shared"]
          },
          {
            "sourceTag": "scope:analytics",
            "onlyDependOnLibsWithTags": ["scope:analytics", "scope:shared"]
          },
          {
            "sourceTag": "scope:shared",
            "onlyDependOnLibsWithTags": ["scope:shared"]
          }
        ]
      }
    ]
  },
  "ignorePatterns": ["dist", "build", ".next", "node_modules"]
}
```

**Install @nx/eslint-plugin:**
```bash
pnpm add -Dw @nx/eslint-plugin
```

**Validation:**
```bash
pnpm nx run-many -t lint --all
```

**Expected:** Lint should pass. If boundary violations found, fix imports.

---

### Step 4: Optimize Shared Library package.json Files (2 hours)

#### 4a. libs/common/package.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/common/package.json`

**Replace with:**
```json
{
  "name": "@m-tracking/common",
  "version": "1.0.0",
  "description": "Shared utilities and types for M-Tracking services",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*.ts",
      "default": "./src/*.ts"
    }
  },
  "sideEffects": false,
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

#### 4b. libs/types/package.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/types/package.json`

**Replace with:**
```json
{
  "name": "@m-tracking/types",
  "version": "1.0.0",
  "description": "Shared TypeScript type definitions",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*.ts",
      "default": "./src/*.ts"
    }
  },
  "sideEffects": false,
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

#### 4c. libs/constants/package.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/constants/package.json`

**Replace with:**
```json
{
  "name": "@m-tracking/constants",
  "version": "1.0.0",
  "description": "Shared constants",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*.ts",
      "default": "./src/*.ts"
    }
  },
  "sideEffects": false,
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

#### 4d. libs/utils/package.json

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/libs/utils/package.json`

**Replace with:**
```json
{
  "name": "@m-tracking/utils",
  "version": "1.0.0",
  "description": "Shared utility functions",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*.ts",
      "default": "./src/*.ts"
    }
  },
  "sideEffects": false,
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

**Changes Applied:**
- Added `exports` field for modern Node.js module resolution
- Added `sideEffects: false` for tree-shaking
- Standardized script names

---

### Step 5: Update Backend project.json with Specific Inputs (30 min)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/services/backend/project.json`

**Update build target to use nestBuild input:**
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
      "inputs": ["nestBuild"],
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

---

### Step 6: Update Frontend project.json with Specific Inputs (30 min)

**File:** `/Users/DuyHome/dev/any/freelance/m-tracking/apps/frontend/project.json`

**Update build target to use nextBuild input:**
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
      "inputs": ["nextBuild"],
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

---

### Step 7: Verify Nx Graph and Cache (1 hour)

**Commands to run:**

```bash
# View dependency graph
pnpm nx graph

# Clear cache and test cache effectiveness
pnpm nx reset

# First build (cold)
time pnpm nx run backend:build

# Second build (should be cached)
time pnpm nx run backend:build

# Build all and verify
pnpm nx run-many -t build --all

# View affected projects
pnpm nx affected:graph --base=main
```

**Expected Results:**
- Nx graph shows all projects (apps, services, libs)
- Second build is instant (cache hit)
- Affected commands only run on changed projects

---

## Todo List

- [ ] Update nx.json with optimized cache inputs
- [ ] Create libs/common/project.json
- [ ] Create libs/types/project.json
- [ ] Create libs/constants/project.json
- [ ] Create libs/utils/project.json
- [ ] Install @nx/eslint-plugin
- [ ] Update .eslintrc.json with module boundary rules
- [ ] Update libs/common/package.json with exports and sideEffects
- [ ] Update libs/types/package.json with exports and sideEffects
- [ ] Update libs/constants/package.json with exports and sideEffects
- [ ] Update libs/utils/package.json with exports and sideEffects
- [ ] Update services/backend/project.json with nestBuild input
- [ ] Update apps/frontend/project.json with nextBuild input
- [ ] Run pnpm nx graph to verify project detection
- [ ] Test cache effectiveness (build twice, second should be instant)
- [ ] Run lint to verify module boundaries
- [ ] Commit changes

---

## Success Criteria

- [ ] All libraries visible in `pnpm nx graph`
- [ ] Cache hit rate for unchanged files is 100%
- [ ] `pnpm nx affected -t build` only builds changed projects
- [ ] Module boundary violations caught by ESLint
- [ ] All builds complete successfully

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| ESLint @nx/enforce-module-boundaries not working | Medium | Low | Ensure @nx/eslint-plugin installed |
| Cache inputs too restrictive | Medium | Medium | Add missing files if cache miss |
| Library project.json syntax errors | Low | Low | Validate with `pnpm nx graph` |

---

## Security Considerations

- Module boundaries prevent accidental coupling
- No secrets in configuration files
- ESLint rules enforced in CI

---

## Rollback Procedure

If issues occur:
```bash
git checkout main -- nx.json .eslintrc.json
git checkout main -- libs/*/package.json
rm -f libs/*/project.json
pnpm install
pnpm nx reset
```

---

## Next Steps

After Phase 2 completion:
- Consider Nx Cloud for remote caching (optional, 30-70% CI time savings)
- Monitor cache hit rates in CI
- Add more granular module boundaries as app grows
