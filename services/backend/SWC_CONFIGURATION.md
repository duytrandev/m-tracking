# SWC Configuration for NestJS Backend

This document describes the SWC (Speedy Web Compiler) setup for the NestJS backend service.

## Overview

SWC is a super-fast TypeScript/JavaScript compiler written in Rust that provides significantly faster build times compared to the default TypeScript compiler (`tsc`). It's approximately **20x faster** than TypeScript for compilation.

## What Was Configured

### 1. Package Dependencies

Added the following packages to `services/backend/package.json`:

- `@swc/core`: Core SWC compiler
- `@swc/cli`: Command-line interface for SWC
- `@swc/helpers`: Runtime helpers for SWC-compiled code

### 2. NestJS CLI Configuration

Updated `services/backend/nest-cli.json` to use SWC:

```json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

- `builder: "swc"`: Tells NestJS CLI to use SWC instead of TypeScript compiler
- `typeCheck: true`: Enables type checking during build (SWC compiles fast but doesn't type-check by default)

### 3. SWC Configuration

Created `services/backend/.swcrc` with the following key settings:

- **Parser**: TypeScript syntax with decorators support (required for NestJS)
- **Transform**: 
  - `legacyDecorator: true` - Required for NestJS decorators
  - `decoratorMetadata: true` - Emits decorator metadata (required for dependency injection)
- **Target**: ES2022 (modern Node.js)
- **Module**: CommonJS (required for NestJS)
- **Source Maps**: Enabled for debugging
- **Path Mappings**: Configured to match TypeScript path aliases

### 4. Nx Build Configuration

Updated `services/backend/project.json` to use the Nx SWC executor:

```json
{
  "build": {
    "executor": "@nx/js:swc",
    "options": {
      "swcrc": "services/backend/.swcrc"
    }
  }
}
```

## Build Commands

### Development Build (with watch mode)

```bash
# Using npm scripts
pnpm --filter @m-tracking/backend dev

# Using Nx
pnpm nx serve @m-tracking/backend
```

### Production Build

```bash
# Using npm scripts
pnpm --filter @m-tracking/backend build

# Using Nx
pnpm nx build @m-tracking/backend
```

### Type Checking (separate)

Since SWC focuses on speed and doesn't type-check by default, you can run type checking separately:

```bash
# Using npm scripts
pnpm --filter @m-tracking/backend type-check

# Using Nx
pnpm nx type-check @m-tracking/backend
```

## Build Output

The compiled output is located in `dist/services/backend/`:

- `.js` files: Compiled JavaScript
- `.js.map` files: Source maps for debugging
- `.d.ts` files: TypeScript declaration files
- `.d.ts.map` files: Declaration map files

## Performance Comparison

Typical build times (approximate):

| Compiler | Cold Build | Incremental Build |
|----------|-----------|-------------------|
| TypeScript (tsc) | ~15-20s | ~5-8s |
| SWC | ~2-3s | <1s |

## Important Notes

### Decorators

SWC requires specific decorator configuration for NestJS:

- `legacyDecorator: true` - Uses the legacy decorator proposal
- `decoratorMetadata: true` - Emits decorator metadata for reflection

### Path Aliases

Path aliases from `tsconfig.json` must be duplicated in `.swcrc` under `jsc.baseUrl` and `jsc.paths` because SWC doesn't read TypeScript configuration.

### Type Checking

SWC is primarily a transpiler, not a type checker. The `typeCheck: true` option in `nest-cli.json` ensures TypeScript's type checker runs alongside SWC compilation during builds.

### Compatibility

SWC is fully compatible with:
- All NestJS decorators and features
- TypeORM decorators
- Dependency injection
- Metadata reflection
- All existing NestJS modules

## Troubleshooting

### Build fails with "Cannot find module"

- Ensure path aliases in `.swcrc` match those in `tsconfig.json`
- Check that `@swc/helpers` is installed in dependencies

### Decorators not working

- Verify `legacyDecorator: true` and `decoratorMetadata: true` are set in `.swcrc`
- Ensure `reflect-metadata` is imported in `main.ts`

### Type errors not showing during development

- Run `pnpm nx type-check @m-tracking/backend` separately
- Consider setting up a watch mode for type checking in your IDE

## References

- [SWC Documentation](https://swc.rs/)
- [NestJS CLI Documentation](https://docs.nestjs.com/cli/overview)
- [Nx SWC Plugin](https://nx.dev/nx-api/js)
