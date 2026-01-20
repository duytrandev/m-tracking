# Phase 4: Animations & Transitions

## Context Links
- [Animation Libraries Research](../reports/researcher-260120-1505-animation-libraries.md)
- [Modern Login UX Research](../reports/researcher-260120-1505-modern-login-ux.md)
- [LoginForm](/apps/frontend/src/features/auth/components/login-form.tsx)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 2h
- **Description:** Add smooth micro-interactions using Motion library for form states, field focus, and feedback

## Key Insights
- Animation timing: 200-300ms for UI, 400ms for content transitions
- Use only transform & opacity (GPU-accelerated)
- Form states: idle -> submitting -> success | error
- Respect prefers-reduced-motion
- AnimatePresence required for exit animations

## Requirements

### Functional
- Form entrance animation (fade + slide up)
- Field focus state animations
- Button hover/press animations
- Loading spinner animation
- Success checkmark animation
- Error shake animation
- Form state transitions with AnimatePresence

### Non-Functional
- 60fps animations (GPU-accelerated only)
- Respect prefers-reduced-motion
- No layout thrashing (avoid animating width/height)

## Architecture

### Animation Variants
```typescript
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

const fieldVariants = {
  idle: { scale: 1 },
  focus: { scale: 1.01 },
  error: { x: [-2, 2, -2, 2, 0] }
}

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}
```

## Related Code Files

### Modify
- `/apps/frontend/src/features/auth/components/login-form.tsx`
- `/apps/frontend/src/components/ui/input.tsx` (add animation variants)
- `/apps/frontend/src/components/ui/button.tsx` (add motion support)

### Create
- `/apps/frontend/src/features/auth/components/animated-form-wrapper.tsx`
- `/apps/frontend/src/features/auth/components/animated-input.tsx`
- `/apps/frontend/src/features/auth/components/animated-button.tsx`

## Implementation Steps

1. **Create AnimatedFormWrapper**
   ```typescript
   // /apps/frontend/src/features/auth/components/animated-form-wrapper.tsx
   'use client'
   import { m, AnimatePresence } from 'motion/react'
   import { useReducedMotion } from '@/hooks/use-reduced-motion'
   import type { ReactNode } from 'react'

   interface AnimatedFormWrapperProps {
     children: ReactNode
     className?: string
   }

   export function AnimatedFormWrapper({
     children,
     className,
   }: AnimatedFormWrapperProps): ReactNode {
     const prefersReducedMotion = useReducedMotion()

     const variants = {
       hidden: {
         opacity: 0,
         y: prefersReducedMotion ? 0 : 20,
       },
       visible: {
         opacity: 1,
         y: 0,
         transition: {
           duration: 0.4,
           ease: [0.4, 0, 0.2, 1],
           staggerChildren: 0.1,
         },
       },
     }

     return (
       <m.div
         initial="hidden"
         animate="visible"
         variants={variants}
         className={className}
       >
         {children}
       </m.div>
     )
   }
   ```

2. **Create AnimatedInput wrapper**
   ```typescript
   // /apps/frontend/src/features/auth/components/animated-input.tsx
   'use client'
   import { m } from 'motion/react'
   import { forwardRef, useState } from 'react'
   import { Input, type InputProps } from '@/components/ui/input'
   import { useReducedMotion } from '@/hooks/use-reduced-motion'

   export const AnimatedInput = forwardRef<HTMLInputElement, InputProps>(
     ({ onFocus, onBlur, error, ...props }, ref) => {
       const [isFocused, setIsFocused] = useState(false)
       const prefersReducedMotion = useReducedMotion()

       const handleFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
         setIsFocused(true)
         onFocus?.(e)
       }

       const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
         setIsFocused(false)
         onBlur?.(e)
       }

       return (
         <m.div
           animate={
             error && !prefersReducedMotion
               ? { x: [-2, 2, -2, 2, 0] }
               : { x: 0 }
           }
           transition={{ duration: 0.3 }}
         >
           <Input
             ref={ref}
             error={error}
             onFocus={handleFocus}
             onBlur={handleBlur}
             className={isFocused ? 'ring-2 ring-ring' : ''}
             {...props}
           />
         </m.div>
       )
     }
   )
   AnimatedInput.displayName = 'AnimatedInput'
   ```

3. **Add button animation variants**
   ```typescript
   // Update Button component to support motion
   // Option 1: Wrap Button with motion
   // Option 2: Use CSS transitions (simpler, already has transition-colors)

   // Recommended: CSS approach for button (simpler)
   // Update button className to include:
   'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
   ```

4. **Add form state transitions**
   ```typescript
   // In LoginForm, wrap content with AnimatePresence
   <AnimatePresence mode="wait">
     {formState === 'success' ? (
       <m.div
         key="success"
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0 }}
         className="text-center py-8"
       >
         <m.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: 'spring', stiffness: 200 }}
         >
           <Check className="h-12 w-12 text-success mx-auto" />
         </m.div>
         <p className="mt-4 text-lg font-medium">Welcome back!</p>
         <p className="text-sm text-muted-foreground">Redirecting...</p>
       </m.div>
     ) : (
       <m.form key="form" ...>
         {/* Form content */}
       </m.form>
     )}
   </AnimatePresence>
   ```

5. **Add loading spinner animation**
   ```typescript
   // Already using Loader2 with animate-spin
   // Enhance with motion for smoother control:
   <m.div
     animate={{ rotate: 360 }}
     transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
   >
     <Loader2 className="h-4 w-4" />
   </m.div>
   ```

6. **Add error banner animation**
   ```typescript
   // Global error banner entrance
   <AnimatePresence>
     {error && (
       <m.div
         initial={{ opacity: 0, height: 0 }}
         animate={{ opacity: 1, height: 'auto' }}
         exit={{ opacity: 0, height: 0 }}
         className="overflow-hidden"
       >
         <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
           <AlertCircle className="h-4 w-4 flex-shrink-0" />
           {error}
         </div>
       </m.div>
     )}
   </AnimatePresence>
   ```

7. **Wrap LoginForm with MotionProvider in page**
   ```typescript
   // /apps/frontend/app/auth/login/page.tsx
   import { MotionProvider } from '@/providers/motion-provider'

   export default function LoginPage() {
     return (
       <MotionProvider>
         <AuthCard title={t('title')} description={t('subtitle')}>
           <LoginForm />
         </AuthCard>
       </MotionProvider>
     )
   }
   ```

## Todo List
- [ ] Create AnimatedFormWrapper component
- [ ] Create AnimatedInput component with shake
- [ ] Add button hover/press animations (CSS)
- [ ] Add form state transitions with AnimatePresence
- [ ] Add success state UI with checkmark animation
- [ ] Add error banner entrance animation
- [ ] Add loading spinner enhancement
- [ ] Integrate MotionProvider in login page
- [ ] Test with prefers-reduced-motion enabled

## Success Criteria
- [ ] Form fades in on page load
- [ ] Input shakes on validation error
- [ ] Button scales on hover (1.02x) and press (0.98x)
- [ ] Success state shows animated checkmark
- [ ] Error banner slides in/out
- [ ] All animations disabled when prefers-reduced-motion
- [ ] 60fps on mid-tier devices

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Animation jank | Medium | Only animate transform/opacity |
| Hydration mismatch | Medium | Use 'use client', initial state false |
| Motion not loaded | High | Verify LazyMotion wrapping |

## Security Considerations
- No security implications (animation only)

## Next Steps
- Proceed to Phase 5: Validation Improvements
