# @m-tracking/eslint-config

Shared ESLint configuration for M-Tracking monorepo.

## Usage

### Base Configuration

```js
// .eslintrc.js or eslint.config.js
module.exports = {
  extends: ['@m-tracking/eslint-config/base'],
}
```

### React Projects

```js
module.exports = {
  extends: ['@m-tracking/eslint-config/react'],
}
```

### Next.js Projects

```js
module.exports = {
  extends: ['@m-tracking/eslint-config/next'],
}
```

### NestJS Projects

```js
module.exports = {
  extends: ['@m-tracking/eslint-config/nest'],
}
```

## Configurations

- **base** - Base TypeScript + ESLint recommended rules
- **react** - React + React Hooks rules
- **next** - Next.js specific rules (extends react)
- **nest** - NestJS backend rules (extends base)

## Rules

All configurations include:
- TypeScript support
- Import ordering
- Unused variable warnings
- Consistent code style

See individual config files for specific rules.
