# Phase 1: Setup Dependencies

## Context Links
- [Animation Libraries Research](../reports/researcher-260120-1505-animation-libraries.md)
- [Package.json](/apps/frontend/package.json)

## Overview
- **Priority:** P1 (blocker for subsequent phases)
- **Status:** Pending
- **Effort:** 0.5h
- **Description:** Install Motion library and configure LazyMotion for optimized bundle size

## Key Insights
- Motion (Framer Motion rebrand) is production standard: 30.6k stars, 8.1M weekly downloads
- Full bundle: 34KB gzipped; LazyMotion: 4.6KB initial load
- Use `domAnimation` features for DOM animations (covers forms)
- Hardware-accelerated transforms only (transform, opacity)

## Requirements

### Functional
- Motion library installed and configured
- LazyMotion wrapper available for auth components

### Non-Functional
- Bundle size impact < 5KB initial (LazyMotion)
- Tree-shaking enabled for production builds

## Architecture

### Component Hierarchy
```
providers/
  motion-provider.tsx (LazyMotion wrapper)
features/auth/
  components/
    login-form.tsx (uses m.* components)
```

## Related Code Files

### Modify
- `/apps/frontend/package.json` - Add motion dependency

### Create
- `/apps/frontend/src/providers/motion-provider.tsx` - LazyMotion wrapper

## Implementation Steps

1. **Install Motion package**
   ```bash
   cd apps/frontend && pnpm add motion
   ```

2. **Create Motion Provider**
   ```typescript
   // /apps/frontend/src/providers/motion-provider.tsx
   'use client'
   import { LazyMotion, domAnimation } from 'motion/react'
   import type { ReactNode } from 'react'

   interface MotionProviderProps {
     children: ReactNode
   }

   export function MotionProvider({ children }: MotionProviderProps): ReactNode {
     return (
       <LazyMotion features={domAnimation} strict>
         {children}
       </LazyMotion>
     )
   }
   ```

3. **Create reduced-motion hook**
   ```typescript
   // /apps/frontend/src/hooks/use-reduced-motion.ts
   'use client'
   import { useState, useEffect } from 'react'

   export function useReducedMotion(): boolean {
     const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

     useEffect(() => {
       const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
       setPrefersReducedMotion(mediaQuery.matches)

       const handler = (e: MediaQueryListEvent): void => {
         setPrefersReducedMotion(e.matches)
       }

       mediaQuery.addEventListener('change', handler)
       return () => mediaQuery.removeEventListener('change', handler)
     }, [])

     return prefersReducedMotion
   }
   ```

4. **Export from index files**
   - Add export in `/apps/frontend/src/providers/index.ts`
   - Add export in `/apps/frontend/src/hooks/index.ts`

## Todo List
- [ ] Install motion package
- [ ] Create MotionProvider component
- [ ] Create useReducedMotion hook
- [ ] Add exports to index files
- [ ] Verify build succeeds

## Success Criteria
- [ ] `pnpm build` succeeds in frontend app
- [ ] Motion imports work: `import { m } from 'motion/react'`
- [ ] LazyMotion configured with domAnimation features
- [ ] useReducedMotion hook returns boolean

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bundle size bloat | Medium | Use LazyMotion, verify with bundleanalyzer |
| SSR hydration mismatch | Low | Use 'use client' directive, initial state false |

## Security Considerations
- No security implications (animation library only)

## Next Steps
- Proceed to Phase 2: Design Tokens update
