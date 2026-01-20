# @m-tracking/typescript-config

Shared TypeScript configuration for M-Tracking monorepo.

## Usage

### Base Configuration

```json
{
  "extends": "@m-tracking/typescript-config/base.json"
}
```

### React Projects

```json
{
  "extends": "@m-tracking/typescript-config/react.json"
}
```

### Next.js Projects

```json
{
  "extends": "@m-tracking/typescript-config/next.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### NestJS Projects

```json
{
  "extends": "@m-tracking/typescript-config/nest.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./"
  }
}
```

## Configurations

- **base** - Base TypeScript configuration with strict mode
- **react** - React-specific configuration (JSX, DOM libs)
- **next** - Next.js configuration (preserves JSX, incremental)
- **nest** - NestJS configuration (decorators, commonjs)

## Features

All configurations include:
- Strict type checking
- Source maps
- Declaration files
- Module resolution
- Optimized for monorepo structure
