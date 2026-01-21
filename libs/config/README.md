# Shared Configuration Packages

Reusable configurations for tooling across the monorepo.

## Packages

### eslint-config

Shared ESLint rules and configurations. Provides base ESLint flat configs that can be extended by individual packages.

**Location:** `libs/config/eslint-config`

### prettier-config

Shared Prettier configuration for consistent code formatting.

**Location:** `libs/config/prettier-config`

### typescript-config

Shared TypeScript configuration presets for different project types (apps, libraries, etc).

**Location:** `libs/config/typescript-config`

## Usage

### ESLint Config

```javascript
// eslint.config.js
import baseConfig from '@m-tracking/eslint-config'

export default [
  ...baseConfig,
  // Your custom rules
]
```

### Prettier Config

```json
{
  "extends": ["@m-tracking/prettier-config"]
}
```

### TypeScript Config

```json
{
  "extends": "@m-tracking/typescript-config/base.json",
  "compilerOptions": {
    // Your custom options
  }
}
```

## Maintenance

When updating shared configurations:

1. Update the relevant config package
2. Test with at least one app and one library
3. Document breaking changes in the package CHANGELOG
4. Consider backward compatibility

## Benefits

- **Consistency**: All packages follow the same rules
- **Maintainability**: Update rules in one place
- **Onboarding**: New developers get consistent tooling
- **CI/CD**: Shared configs ensure predictable builds
