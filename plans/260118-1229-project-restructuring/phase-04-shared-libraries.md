# Phase 4: Shared Configuration Packages

## Context Links
- [Project Structure Review](/docs/project-structure-review.md#priority-4-shared-configuration-packages)
- [pnpm Workspace Config](/pnpm-workspace.yaml)
- [Root Package.json](/package.json)

## Overview

| Item | Value |
|------|-------|
| Priority | P2 - High |
| Status | Pending |
| Effort | 4 hours |
| Dependencies | Phase 3 (backend config patterns) |

Create shared configuration packages for ESLint, TypeScript, and Prettier. Restructure libs/ with proper scoping and package separation. Add workspace protocol to dependencies.

## Key Insights

1. **Current libs/** has flat structure, no scope organization
2. **Package naming inconsistent**: `@mtracking/common` vs `@m-tracking/types`
3. **No shared configs**: Each app/service duplicates ESLint/TS config
4. **workspace:* protocol** not used for internal dependencies

## Requirements

### Functional
- F1: Create `libs/config/eslint-config` package
- F2: Create `libs/config/typescript-config` package
- F3: Create `libs/config/prettier-config` package
- F4: Restructure libs/ with `shared/` scope
- F5: Update all internal deps to use `workspace:*`

### Non-Functional
- NF1: Consistent package naming (`@m-tracking/*`)
- NF2: Proper exports configuration
- NF3: No breaking changes to existing consumers

## Architecture

### Libs Structure After Enhancement
```
libs/
├── config/                          # Configuration packages
│   ├── eslint-config/
│   │   ├── package.json            # @m-tracking/eslint-config
│   │   ├── base.js                 # Base rules
│   │   ├── react.js                # React rules
│   │   ├── next.js                 # Next.js rules
│   │   └── nest.js                 # NestJS rules
│   ├── typescript-config/
│   │   ├── package.json            # @m-tracking/typescript-config
│   │   ├── base.json               # Base TS config
│   │   ├── react.json              # React TS config
│   │   ├── next.json               # Next.js TS config
│   │   └── nest.json               # NestJS TS config
│   └── prettier-config/
│       ├── package.json            # @m-tracking/prettier-config
│       └── prettier.config.js      # Shared prettier config
├── shared/                          # Shared code packages
│   ├── types/                      # (move from libs/types)
│   │   ├── package.json            # @m-tracking/types
│   │   └── src/
│   ├── utils/                      # (move from libs/utils)
│   │   ├── package.json            # @m-tracking/utils
│   │   └── src/
│   └── constants/                  # (move from libs/constants)
│       ├── package.json            # @m-tracking/constants
│       └── src/
└── common/                          # (keep for now, deprecate later)
    └── ...
```

## Related Code Files

### Files to Create
- `libs/config/eslint-config/package.json`
- `libs/config/eslint-config/base.js`
- `libs/config/eslint-config/react.js`
- `libs/config/eslint-config/next.js`
- `libs/config/eslint-config/nest.js`
- `libs/config/typescript-config/package.json`
- `libs/config/typescript-config/base.json`
- `libs/config/typescript-config/react.json`
- `libs/config/typescript-config/next.json`
- `libs/config/typescript-config/nest.json`
- `libs/config/prettier-config/package.json`
- `libs/config/prettier-config/prettier.config.js`

### Files to Modify
- `pnpm-workspace.yaml` - Add config packages path
- `apps/frontend/package.json` - Use workspace:* and shared configs
- `apps/frontend/eslint.config.js` - Extend shared config
- `apps/frontend/tsconfig.json` - Extend shared config
- `services/backend/package.json` - Use workspace:* and shared configs
- `services/backend/.eslintrc.js` - Extend shared config
- `services/backend/tsconfig.json` - Extend shared config

### Directories to Create
- `libs/config/`
- `libs/shared/` (for future migration)

## Implementation Steps

### Step 1: Update pnpm-workspace.yaml (5 min)

```yaml
packages:
  - "apps/*"
  - "services/*"
  - "libs/*"
  - "libs/config/*"
  - "libs/shared/*"
```

### Step 2: Create ESLint config package (45 min)

2.1 Create directory:
```bash
mkdir -p libs/config/eslint-config
```

2.2 Create `libs/config/eslint-config/package.json`:
```json
{
  "name": "@m-tracking/eslint-config",
  "version": "1.0.0",
  "description": "Shared ESLint configuration for M-Tracking",
  "private": true,
  "main": "base.js",
  "exports": {
    ".": "./base.js",
    "./base": "./base.js",
    "./react": "./react.js",
    "./next": "./next.js",
    "./nest": "./nest.js"
  },
  "peerDependencies": {
    "eslint": "^8.0.0 || ^9.0.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint-plugin-import": "^2.29.0"
  }
}
```

2.3 Create `libs/config/eslint-config/base.js`:
```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // Import
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.next/', 'coverage/'],
}
```

2.4 Create `libs/config/eslint-config/react.js`:
```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
}
```

2.5 Create `libs/config/eslint-config/next.js`:
```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './react.js',
    'next/core-web-vitals',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
}
```

2.6 Create `libs/config/eslint-config/nest.js`:
```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

### Step 3: Create TypeScript config package (30 min)

3.1 Create directory:
```bash
mkdir -p libs/config/typescript-config
```

3.2 Create `libs/config/typescript-config/package.json`:
```json
{
  "name": "@m-tracking/typescript-config",
  "version": "1.0.0",
  "description": "Shared TypeScript configuration for M-Tracking",
  "private": true,
  "exports": {
    "./base.json": "./base.json",
    "./react.json": "./react.json",
    "./next.json": "./next.json",
    "./nest.json": "./nest.json"
  }
}
```

3.3 Create `libs/config/typescript-config/base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

3.4 Create `libs/config/typescript-config/react.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "isolatedModules": true,
    "allowJs": true,
    "resolveJsonModule": true
  }
}
```

3.5 Create `libs/config/typescript-config/next.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./react.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "incremental": true
  }
}
```

3.6 Create `libs/config/typescript-config/nest.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true
  }
}
```

### Step 4: Create Prettier config package (15 min)

4.1 Create directory:
```bash
mkdir -p libs/config/prettier-config
```

4.2 Create `libs/config/prettier-config/package.json`:
```json
{
  "name": "@m-tracking/prettier-config",
  "version": "1.0.0",
  "description": "Shared Prettier configuration for M-Tracking",
  "private": true,
  "main": "prettier.config.js",
  "exports": {
    ".": "./prettier.config.js"
  },
  "peerDependencies": {
    "prettier": "^3.0.0"
  }
}
```

4.3 Create `libs/config/prettier-config/prettier.config.js`:
```javascript
/** @type {import('prettier').Config} */
module.exports = {
  semi: false,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: [],
}
```

### Step 5: Update workspace dependencies (30 min)

5.1 Update `apps/frontend/package.json`:
```json
{
  "devDependencies": {
    "@m-tracking/eslint-config": "workspace:*",
    "@m-tracking/typescript-config": "workspace:*",
    "@m-tracking/prettier-config": "workspace:*"
  }
}
```

5.2 Update `services/backend/package.json`:
```json
{
  "devDependencies": {
    "@m-tracking/eslint-config": "workspace:*",
    "@m-tracking/typescript-config": "workspace:*",
    "@m-tracking/prettier-config": "workspace:*"
  }
}
```

5.3 Update root `package.json`:
```json
{
  "prettier": "@m-tracking/prettier-config"
}
```

### Step 6: Update consumer configs (30 min)

6.1 Update `apps/frontend/tsconfig.json`:
```json
{
  "extends": "@m-tracking/typescript-config/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

6.2 Create `apps/frontend/eslint.config.mjs` (ESLint 9 flat config):
```javascript
import baseConfig from '@m-tracking/eslint-config/next'

export default [
  ...baseConfig,
  {
    ignores: ['.next/*', 'node_modules/*'],
  },
]
```

6.3 Update `services/backend/tsconfig.json`:
```json
{
  "extends": "@m-tracking/typescript-config/nest.json",
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

6.4 Create `services/backend/.eslintrc.js`:
```javascript
module.exports = {
  extends: ['@m-tracking/eslint-config/nest'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  root: true,
}
```

### Step 7: Install dependencies (10 min)

```bash
# From root
pnpm install
```

### Step 8: Verify configuration (15 min)

```bash
# Lint frontend
cd apps/frontend && pnpm run lint

# Lint backend
cd services/backend && pnpm run lint

# Build all
pnpm run build
```

## Todo List

- [ ] Update pnpm-workspace.yaml
- [ ] Create `libs/config/eslint-config/` package
- [ ] Create `libs/config/typescript-config/` package
- [ ] Create `libs/config/prettier-config/` package
- [ ] Update apps/frontend/package.json with workspace:*
- [ ] Update services/backend/package.json with workspace:*
- [ ] Update root package.json prettier config
- [ ] Update apps/frontend/tsconfig.json
- [ ] Update apps/frontend/eslint config
- [ ] Update services/backend/tsconfig.json
- [ ] Update services/backend/.eslintrc.js
- [ ] Run pnpm install
- [ ] Run lint on frontend
- [ ] Run lint on backend
- [ ] Run full build

## Success Criteria

1. Shared config packages created and working
2. Frontend and backend extend shared configs
3. All `workspace:*` dependencies resolve
4. Lint passes on all packages
5. Build succeeds

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Config resolution issues | Test each config individually |
| ESLint flat config migration | Provide both formats initially |
| pnpm workspace linking | Verify with `pnpm ls` |

## Security Considerations

- No sensitive data in config packages
- Configs are for development tooling only
- No runtime impact

## Next Steps

After completion:
1. Proceed to Phase 5: Documentation
2. Migrate libs/types to libs/shared/types
3. Add more shared packages as needed
