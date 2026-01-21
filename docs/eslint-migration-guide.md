# ESLint 9 Flat Config Migration Guide

## Overview

This project has migrated from ESLint 8 with legacy `.eslintrc.json` configuration to ESLint 9 with the new flat config system (`eslint.config.js`).

## What Changed

### Configuration Format

**Before (ESLint 8 - `.eslintrc.json`):**

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "error"
  }
}
```

**After (ESLint 9 - `eslint.config.js`):**

```javascript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'error',
    },
  }
)
```

### Key Differences

1. **File-based Configuration**: Uses `eslint.config.js` instead of `.eslintrc.json`
2. **ES Module Format**: Configuration is now JavaScript, allowing programmatic control
3. **Flat Array Structure**: Configs are exported as an array, not nested objects
4. **Plugin Import**: Plugins are imported directly as ESM modules
5. **Explicit File Matching**: Use `files` patterns instead of implicit file matching

## Migration Steps

### 1. Remove Legacy Configs

Delete these files if they exist:

```bash
rm .eslintrc.json
rm .eslintrc.js
rm .eslintrc.yml
```

### 2. Install New Dependencies

```bash
pnpm add -D eslint@^9.39.2 @eslint/js typescript-eslint@^8.17.0
```

### 3. Create `eslint.config.js`

**Root Config:**

```javascript
// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['**/dist', '**/build', '**/.next', '**/node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  }
)
```

**Package-specific Config:**

```javascript
// @ts-check
import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Package-specific overrides
    },
  },
]
```

### 4. Update `nx.json`

Change ESLint config references:

**Before:**

```json
{
  "sharedGlobals": ["{workspaceRoot}/.eslintrc.json"]
}
```

**After:**

```json
{
  "sharedGlobals": ["{workspaceRoot}/eslint.config.js"]
}
```

### 5. Update Scripts

No changes needed! ESLint 9 uses the same CLI:

```bash
pnpm lint          # Still works
pnpm lint --fix    # Still works
```

## Common Migration Patterns

### Extending Configs

**Before:**

```json
{
  "extends": ["airbnb", "prettier"]
}
```

**After:**

```javascript
import airbnb from 'eslint-config-airbnb'
import prettier from 'eslint-config-prettier'

export default [...airbnb, prettier]
```

### Adding Plugins

**Before:**

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error"
  }
}
```

**After:**

```javascript
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
    },
  },
]
```

### File Patterns

**Before:**

```json
{
  "overrides": [
    {
      "files": ["*.test.ts"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

**After:**

```javascript
export default [
  {
    files: ['**/*.test.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]
```

### Ignoring Files

**Before (`.eslintignore`):**

```
dist
build
.next
```

**After (in `eslint.config.js`):**

```javascript
export default [
  {
    ignores: ['**/dist', '**/build', '**/.next'],
  },
]
```

## TypeScript Project References

For projects using TypeScript project references:

```javascript
export default tseslint.config({
  files: ['**/*.ts'],
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

## Nx Module Boundaries

For Nx monorepos with module boundary enforcement:

```javascript
import nx from '@nx/eslint-plugin'

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@nx': nx },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          depConstraints: [
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
]
```

## Troubleshooting

### "Cannot use import statement outside a module"

**Solution:** Ensure your `package.json` has:

```json
{
  "type": "module"
}
```

Or rename your config to `eslint.config.mjs`.

### "Unable to resolve path to module"

**Solution:** Import plugins correctly:

```javascript
import plugin from 'eslint-plugin-name' // ✅ Correct
// NOT: import plugin from 'eslint-plugin-name/configs' ❌
```

### Rules Not Working

**Solution:** Check file patterns match:

```javascript
{
  files: ['**/*.ts', '**/*.tsx'],  // Must match your files
  rules: { }
}
```

### Config Not Found

**Solution:** ESLint 9 looks for `eslint.config.js` by default. Ensure it's in your project root or specify with `--config` flag.

## Benefits of Flat Config

1. **Type Safety**: Use TypeScript with `@ts-check`
2. **Programmatic**: Build configs dynamically
3. **Composition**: Easier to compose multiple configs
4. **Performance**: Faster parsing and resolution
5. **Clarity**: Clear, explicit configuration

## Resources

- [ESLint Flat Config Documentation](https://eslint.org/docs/latest/use/configure/configuration-files)
- [typescript-eslint Flat Config Guide](https://typescript-eslint.io/getting-started/)
- [Nx ESLint Plugin](https://nx.dev/nx-api/eslint-plugin)

## Support

If you encounter issues during migration:

1. Check this guide for common patterns
2. Review the plan in `plans/260121-1810-monorepo-config-fixes/`
3. Consult the ESLint 9 official migration guide
4. Ask the team for help

---

**Migration Date:** January 21, 2026
**ESLint Version:** 9.39.2
**TypeScript-ESLint Version:** 8.17.0
