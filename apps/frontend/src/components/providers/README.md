# Motion Provider

This directory contains the Motion (Framer Motion) provider setup for the M-Tracking frontend application.

## Overview

Motion is a production-ready animation library for React that provides:

- Declarative animations
- Gesture support (drag, tap, hover)
- Layout animations
- SVG animations
- Optimized bundle size with LazyMotion

## Installation

Motion is already installed in this project:

```bash
pnpm add motion --filter @m-tracking/frontend
```

Current version: `12.27.1`

## Components

### MotionProvider

The `MotionProvider` component wraps the application with LazyMotion for optimized bundle size.

**Features:**

- Uses `domAnimation` features (basic animations, gestures, layout animations, SVG animations)
- Lazy loads animation features to reduce initial bundle size
- Strict mode enabled for better error reporting

**Usage:**

```tsx
import { MotionProvider } from '@/components/providers'

export default function App({ children }) {
  return <MotionProvider>{children}</MotionProvider>
}
```

## Hooks

### useReducedMotion

Detects user's reduced motion preference for accessibility compliance.

**Returns:** `boolean` - `true` if user prefers reduced motion

**Usage:**

```tsx
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { m } from 'motion/react'

function MyComponent() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <m.div
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      Content
    </m.div>
  )
}
```

## Examples

See `motion-provider.example.tsx` for comprehensive usage examples including:

- Basic animations
- Hover/tap interactions
- Stagger animations
- Layout animations

## Best Practices

1. **Always respect reduced motion preference:**

   ```tsx
   const prefersReducedMotion = useReducedMotion()
   transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
   ```

2. **Use LazyMotion features:**
   Motion is configured with `domAnimation` features for optimal bundle size.

3. **Import from motion/react:**

   ```tsx
   import { m } from 'motion/react' // Optimized import
   ```

4. **Keep animations subtle:**
   - Duration: 0.2-0.3s for most interactions
   - Avoid excessive motion that can cause discomfort

5. **Use layout animations for smooth transitions:**
   ```tsx
   <m.div layout>Content</m.div>
   ```

## Accessibility

The `useReducedMotion` hook respects the `prefers-reduced-motion` CSS media query, ensuring animations are disabled for users who prefer reduced motion. This is critical for accessibility and should be used in all animated components.

## Documentation

- [Motion Documentation](https://motion.dev/)
- [Migration from Framer Motion](https://motion.dev/docs/migrate-from-framer-motion)
- [LazyMotion Guide](https://motion.dev/docs/react-lazy-motion)

## File Structure

```
providers/
├── motion-provider.tsx           # Main provider component
├── motion-provider.example.tsx   # Usage examples
├── index.ts                      # Barrel export
└── README.md                     # This file
```
