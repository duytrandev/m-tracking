# TypeScript Module System Strategy

## Overview

This document explains the module system choices across different parts of the M-Tracking monorepo and when to use each approach.

## Configuration Summary

| Package                   | Module System | Module Resolution | Target | Reason                        |
| ------------------------- | ------------- | ----------------- | ------ | ----------------------------- |
| Root (tsconfig.base.json) | ESNext        | bundler           | ES2022 | Modern baseline               |
| Backend (NestJS)          | CommonJS      | node              | ES2022 | Node.js runtime compatibility |
| Frontend (Next.js)        | ESNext        | bundler           | ES2022 | Modern bundler optimization   |
| Libraries                 | CommonJS      | node              | ES2022 | Maximum compatibility         |

## Detailed Rationale

### Backend - CommonJS

**Module System:** `commonjs`
**Module Resolution:** `node`
**Target:** `ES2022`

**Why CommonJS?**

- **Node.js Runtime**: NestJS runs directly in Node.js, which has first-class support for CommonJS
- **Decorator Support**: TypeScript decorators work reliably with CommonJS module emit
- **Ecosystem Compatibility**: Most NestJS libraries and middleware expect CommonJS
- **No Transpilation**: Direct execution without bundling for faster development

**Trade-offs:**

- ✅ Best runtime compatibility
- ✅ Simpler debugging (no bundler required)
- ❌ Larger output files (no tree-shaking)
- ❌ Can't use top-level await

### Frontend - ESNext

**Module System:** `ESNext`
**Module Resolution:** `bundler`
**Target:** `ES2022`

**Why ESM with Bundler Resolution?**

- **Modern Bundling**: Next.js uses webpack/turbopack which expect ESM
- **Tree-Shaking**: Optimal dead code elimination
- **Code Splitting**: Better chunk optimization
- **Dynamic Imports**: Native support for lazy loading

**Trade-offs:**

- ✅ Optimal bundle size
- ✅ Modern syntax support
- ✅ Better performance
- ❌ Requires bundler for execution

### Libraries - CommonJS

**Module System:** `CommonJS`
**Module Resolution:** `node`
**Target:** `ES2022`

**Why CommonJS for Shared Libraries?**

- **Universal Compatibility**: Works in both frontend (via bundler) and backend (natively)
- **Build Simplicity**: TypeScript compiler handles compilation without bundling
- **Predictable Imports**: Standard Node.js resolution
- **Project References**: Better support for TypeScript project references

**Trade-offs:**

- ✅ Works everywhere
- ✅ Simple build process
- ❌ Frontend bundler handles conversion (minimal overhead)

## ES2022 Target Choice

All packages target **ES2022** for consistency and modern features:

- **Class Fields**: Native private fields (`#privateField`)
- **Top-Level Await**: Available where module system supports it
- **Logical Assignment**: `??=`, `&&=`, `||=` operators
- **Array.at()**: Negative indexing
- **Object.hasOwn()**: Better than `hasOwnProperty`
- **Error.cause**: Chained error handling

## Decision Guidelines

### When Adding New Code

1. **Backend Services**: Use CommonJS module syntax

   ```typescript
   // ✅ Good
   const service = require('./service')
   module.exports = { MyService }

   // ❌ Avoid
   import { service } from './service'
   export { MyService }
   ```

2. **Frontend Components**: Use ESM syntax

   ```typescript
   // ✅ Good
   import { Component } from './component'
   export default MyComponent

   // ❌ Avoid
   const Component = require('./component')
   module.exports = MyComponent
   ```

3. **Shared Libraries**: Write in ESM, compile to CommonJS

   ```typescript
   // ✅ Good (source code)
   export function utility() {}

   // TypeScript compiles to CommonJS automatically
   ```

### When to Deviate

**Use ESM in Backend:**

- When using pure ESM dependencies (rare)
- For specific microservices that need ESM features
- Update tsconfig to `"module": "ESNext"` for that service

**Use CommonJS in Frontend:**

- Never - Next.js requires ESM
- Frontend must always use ESM syntax

## Module Resolution Strategies

### Bundler Resolution (`moduleResolution: "bundler"`)

Used by: Frontend

- Understands package.json `exports` field
- Supports extensionless imports
- Optimized for webpack/rollup/vite
- Best for applications that will be bundled

### Node Resolution (`moduleResolution: "node"`)

Used by: Backend, Libraries

- Classic Node.js resolution algorithm
- Follows `node_modules` hierarchy
- Requires file extensions for relative imports in ESM
- Best for server-side code

## Migration Notes

If you need to migrate a package between module systems:

1. Update `tsconfig.json` `module` and `moduleResolution` fields
2. If moving to ESM, convert `require()` to `import`
3. If moving to CommonJS, convert `import` to `require()`
4. Update `package.json` `type` field if needed
5. Test thoroughly - module system affects runtime behavior

## References

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [NestJS and ESM](https://docs.nestjs.com/faq/esm)
- [Next.js Compiler Options](https://nextjs.org/docs/app/api-reference/config/typescript)
