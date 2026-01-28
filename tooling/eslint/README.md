# Shared ESLint Configurations

This directory contains modular, reusable ESLint configuration pieces that can be imported by leaf configs without inheriting broken path patterns from a monolithic root config.

## Problem with Monolithic Root Config

When using a single root `eslint.config.js` that defines rules for all projects:

```js
// Root config with path-specific rules
{
  files: ['apps/frontend/**/*.ts'],  // ❌ These paths break when linting from backend
  rules: { ... }
}
```

Leaf configs that extend the root inherit all path patterns, even ones that don't apply:

```js
// services/backend/eslint.config.js
import rootConfig from '../../eslint.config.js'  // Inherits frontend paths!
```

## Solution: Modular Shared Configs

Instead of one monolithic config, we export individual rule sets:

```
tooling/eslint/
├── index.js      # Main barrel export
├── base.js       # Core JS/TS rules, ignores, prettier
├── nx.js         # Nx module boundary rules
├── react.js      # React Hooks, JSX A11y rules
├── nestjs.js     # NestJS-specific rules
└── testing.js    # Test & mock file rules
```

## Usage

### Frontend Config

```js
import { defineConfig } from 'eslint/config'
import {
  ignores,
  baseRules,
  typescriptRules,
  disableTypeCheckedForTests,
  nxPlugin,
  moduleBoundaryRules,
  reactPlugins,
  reactRecommendedRules,
  reactRules,
  consoleAllowList,
  testFilePatterns,
  mockFilePatterns,
  testRules,
  mockRules,
} from '../../tooling/eslint/index.js'

export default defineConfig(
  ignores,
  ...baseRules,
  disableTypeCheckedForTests,

  // Main TypeScript rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      ...nxPlugin,
      ...reactPlugins,
    },
    rules: {
      ...typescriptRules,
      ...moduleBoundaryRules,
      ...reactRecommendedRules,
      ...reactRules,
    },
  },

  // Test files
  {
    files: testFilePatterns,
    rules: testRules,
  },

  // Mock files
  {
    files: mockFilePatterns,
    rules: mockRules,
  },

  // Console allow list
  {
    files: consoleAllowList,
    rules: { 'no-console': 'off' },
  }
)
```

### Backend Config

```js
import { defineConfig } from 'eslint/config'
import {
  ignores,
  baseRules,
  typescriptRules,
  disableTypeCheckedForTests,
  nxPlugin,
  moduleBoundaryRules,
  nestjsRules,
  migrationRules,
  testFilePatterns,
  testRules,
} from '../../tooling/eslint/index.js'

export default defineConfig(
  ignores,
  ...baseRules,
  disableTypeCheckedForTests,

  // Main TypeScript rules
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: nxPlugin,
    rules: {
      ...typescriptRules,
      ...moduleBoundaryRules,
      ...nestjsRules,
    },
  },

  // Migrations
  {
    files: ['**/migrations/**/*.ts'],
    rules: migrationRules,
  },

  // Test files
  {
    files: testFilePatterns,
    rules: testRules,
  }
)
```

## Available Exports

### From `base.js`

| Export | Description |
|--------|-------------|
| `ignores` | Global ignore patterns (dist, node_modules, etc.) |
| `baseRules` | JS recommended + TS strict + Prettier |
| `typescriptRules` | Common TS rules (no-console, no-explicit-any, etc.) |
| `disableTypeCheckedForTests` | Disables type-aware linting for spec files |
| `tseslint` | Re-exported typescript-eslint for advanced use |

### From `nx.js`

| Export | Description |
|--------|-------------|
| `nxPlugin` | The Nx ESLint plugin object |
| `moduleBoundaryRules` | Module boundary enforcement config |

### From `react.js`

| Export | Description |
|--------|-------------|
| `reactPlugins` | React Hooks + JSX A11y plugin objects |
| `reactRecommendedRules` | Recommended rules from both plugins |
| `reactRules` | React-specific overrides (promise handling, etc.) |
| `consoleAllowList` | Files that need console access |

### From `nestjs.js`

| Export | Description |
|--------|-------------|
| `nestjsRules` | NestJS-specific rules (decorators, interfaces) |
| `migrationRules` | Relaxed rules for DB migrations |
| `sharedUtilityRules` | Warning-level rules for dynamic code |

### From `testing.js`

| Export | Description |
|--------|-------------|
| `testFilePatterns` | Glob patterns for test files |
| `mockFilePatterns` | Glob patterns for mock files |
| `testRules` | Relaxed rules for test files |
| `mockRules` | Relaxed rules for mock files |

## Migration Path

1. **Keep the current setup working** - The existing root config works
2. **Gradually adopt** - Update leaf configs one at a time to import from shared configs
3. **Eventually remove** - Once all leaf configs use shared configs, simplify the root config

## Benefits

- ✅ **No broken path patterns** - Each config only has paths relative to itself
- ✅ **Explicit dependencies** - Configs import only what they need
- ✅ **Easier maintenance** - Change rules in one place
- ✅ **Better discoverability** - Clear documentation of available rules
- ✅ **Type safety** - Can add JSDoc or convert to TypeScript
