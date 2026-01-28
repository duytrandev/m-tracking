# Design Guidelines - M-Tracking Platform

**Version:** 1.0.0
**Last Updated:** January 20, 2026
**Status:** Active

## Overview

This document defines the design system, visual language, and UX patterns for the M-Tracking platform. All UI components and pages must adhere to these guidelines to ensure consistency, accessibility, and excellent user experience.

---

## Design Principles

### 1. Modern Minimalism

- Typography-first design with clear hierarchy
- Maximum 2 accent colors per view
- Ample white space (~60% of viewport)
- Subtle 1px borders, no heavy shadows
- Clean, uncluttered interfaces

### 2. Mobile-First Approach

- Design for mobile first, scale up for desktop
- Touch targets minimum 44x44px (WCAG 2.2)
- Container max-width: 400px for forms
- Responsive breakpoints: 320px, 768px, 1024px

### 3. Accessibility First (WCAG 2.2 AA)

- Contrast ratios: 4.5:1 text, 3:1 UI components
- Enhanced focus rings: 2px solid with 2px offset
- ARIA live regions for dynamic content
- Screen reader optimized
- Keyboard navigation support

### 4. Performance Driven

- 60fps animations (GPU-accelerated only)
- LCP < 1.5s, INP < 100ms
- Bundle size conscious
- Respect prefers-reduced-motion

---

## Color System

### Light Mode

```css
--background: 0 0% 100% --foreground: 222.2 84% 4.9% --primary: 221.2 83.2%
  53.3% --destructive: 0 84.2% 60.2% --success: 142 76% 36% --warning: 38 92%
  50% --border: 214.3 31.8% 91.4% --input: 214.3 31.8% 91.4% --ring: 221.2 83.2%
  53.3%;
```

### Dark Mode

```css
--background: 222.2 84% 4.9% --foreground: 210 40% 98% --primary: 217.2 91.2%
  59.8% --destructive: 0 62.8% 30.6% --success: 142 71% 45% --warning: 38 92%
  50% --border: 217.2 32.6% 17.5% --input: 217.2 32.6% 17.5% --ring: 224.3 76.3%
  48%;
```

### Validation States

- **Success**: Green border + checkmark icon
- **Error**: Red border + alert icon
- **Warning**: Amber border + warning icon
- **Loading**: Amber border + spinner

---

## Typography

### Font Stack

- Primary: System fonts (San Francisco, Segoe UI) or Inter
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

### Type Scale

- **Heading 1**: 2rem (32px) - semibold
- **Heading 2**: 1.5rem (24px) - semibold
- **Heading 3**: 1.25rem (20px) - semibold
- **Body**: 0.875rem (14px) - normal
- **Small**: 0.75rem (12px) - normal

### Line Height

- Headings: 1.2
- Body text: 1.5-1.6
- Small text: 1.4

---

## Animation System (Motion Library)

### Motion Library Integration

**Technology:** Motion (Framer Motion v12.27.1) with LazyMotion
**Bundle Impact:** 4.6KB gzipped (87% smaller than full Framer Motion)
**Performance:** GPU-accelerated, 60fps capable animations

### Setup

```tsx
// /src/components/providers/motion-provider.tsx
import { LazyMotion, domAnimation } from 'motion/react'

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}

// In root layout
;<MotionProvider>
  <YourApp />
</MotionProvider>
```

### useReducedMotion Hook

Respect user accessibility preferences:

```tsx
// /src/hooks/use-reduced-motion.ts
import { useMotionTemplate } from 'motion/react'

export function useReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Usage in components
const prefersReducedMotion = useReducedMotion()
const duration = prefersReducedMotion ? 0 : 400
```

### Timing

```css
--animation-fast: 150ms // Quick feedback
  --animation-normal: 250ms // Standard transitions
  --animation-slow: 400ms; // Entrance/exit effects
```

### Easing Functions

```tsx
const easeOut = 'cubic-bezier(0.4, 0, 0.2, 1)'
const easeInOut = 'cubic-bezier(0.4, 0, 0.2, 1)'
const easeSpring = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
```

### Animation Guidelines

- **Only animate:** `transform` and `opacity` (GPU-accelerated)
- **Never animate:** `width`, `height`, `left`, `top` (causes layout thrashing)
- **Duration:** 200-400ms for UI interactions
- **Always respect:** `prefers-reduced-motion` media query
- **Bundle:** Use LazyMotion to reduce initial load

---

## Form Design Patterns

### Validation Timing: "Reward Early, Punish Late"

1. **Initial entry**: Validate on blur only
2. **After error**: Validate on change (instant feedback)
3. **Success feedback**: Show checkmark when valid
4. **Error clearing**: Remove error immediately on valid input

### Field Structure

```tsx
<FormField
  label="Email"
  htmlFor="email"
  error={errors.email?.message}
  success={dirtyFields.email && !errors.email}
>
  <AnimatedInput
    id="email"
    type="email"
    error={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
    aria-invalid={!!errors.email}
  />
</FormField>
```

### Error Messages

- **Specific & Actionable**: "Enter a valid email like name@example.com"
- **Position**: Below input field
- **Icon**: AlertCircle icon
- **Color**: Red with 4.5:1 contrast
- **Layout**: Use min-height container to prevent shift

### Form Spacing

```css
--form-spacing: 1.5rem (24px);
```

---

## Component Patterns

### Buttons

- **Primary**: Filled with primary color
- **Secondary**: Outlined with border
- **Ghost**: Transparent with hover state
- **Height**: 48px default, 36px small, 56px large
- **Animation**: Scale 1.02x on hover, 0.98x on press

### Inputs

- **Height**: 48px minimum (WCAG touch target)
- **Border**: 1px solid
- **Border radius**: 0.5rem (8px)
- **Padding**: 12px horizontal
- **Focus**: 2px ring with 2px offset

### Cards

- **Max-width**: 400px for auth forms
- **Padding**: 24px
- **Border radius**: 0.5rem (8px)
- **Border**: 1px solid
- **Shadow**: None or subtle

---

## Micro-Interactions (Motion Library)

### Form Entrance Animation

```tsx
import { motion } from 'motion/react'
;<motion.form
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  {/* Form fields */}
</motion.form>
```

### Error Shake Animation

```tsx
import { motion } from 'motion/react'
;<motion.div
  animate={hasError ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
  transition={{ duration: 0.4 }}
>
  <input />
</motion.div>
```

### Button Scale Animations

```tsx
import { motion } from 'motion/react'
;<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>
  Submit
</motion.button>
```

### Success Checkmark Animation

```tsx
import { motion } from 'motion/react'
;<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
>
  <CheckIcon className="text-green-600" />
</motion.div>
```

### Input Focus Animation

```tsx
<motion.div
  initial={{ borderColor: 'var(--border)' }}
  animate={isFocused ? { borderColor: 'var(--ring)' } : {}}
  transition={{ duration: 0.2 }}
>
  <input onFocus={() => setIsFocused(true)} />
</motion.div>
```

---

## Accessibility Requirements

### Focus Management

- Enhanced focus rings (2px solid, 2px offset)
- Visible at 200% zoom
- High contrast mode compatible

### ARIA Live Regions

```tsx
<div
  role="alert"
  aria-live="polite" // success/status
  aria-live="assertive" // errors/warnings
  aria-atomic="true"
>
  {message}
</div>
```

### Keyboard Navigation

- Tab order matches visual flow
- Enter submits forms
- Escape closes modals/dialogs
- Arrow keys for selects/radios

### Screen Reader Support

```tsx
<input
  aria-describedby="field-hint field-error"
  aria-invalid={hasError}
  aria-required={isRequired}
/>
```

---

## Layout Patterns

### Auth Pages (Split-Screen Design)

**Layout Structure:**

```
┌──────────────────────┬───────────────────────┐
│  LEFT (45-50%)       │  RIGHT (50-55%)       │
│  Hidden on mobile    │  Full width on mobile │
│                      │                       │
│  • Gradient bg       │  • White/Light bg     │
│  • Blue→Purple→Pink  │  • Clean form         │
│  • Animated shapes   │  • Max-width: 28rem   │
│  • Brand logo        │  • Centered           │
│  • Headline          │                       │
│  • Features list     │  • Title & desc       │
│  • Testimonial       │  • Form fields        │
│  • Grid overlay      │  • Submit button      │
│                      │  • OAuth buttons      │
└──────────────────────┴───────────────────────┘
```

**Design Specifications:**

**Left Side (Decorative):**

- Gradient: `from-blue-600 via-purple-600 to-pink-600`
- Animated gradient overlay with 8s pulse
- Floating blur circles (decorative depth)
- Glass-effect logo card with backdrop blur
- Typography: 4xl-5xl heading, white text
- Feature icons with glass cards
- Testimonial section with border-top
- Grid overlay pattern (50px x 50px, 10% opacity)
- Responsive: `hidden lg:flex lg:w-[45%] xl:w-[50%]`

**Right Side (Form):**

- Background: `bg-white dark:bg-slate-950`
- Container: `max-w-md` (28rem = 448px)
- Padding: `p-4` responsive
- Title: 3xl font-bold
- Description: base size, muted color
- Form spacing: 1.5rem (24px) between fields
- Button: Gradient `from-blue-600 to-purple-600`, h-12
- Enhanced shadows and hover states

**Responsive Behavior:**

- Desktop (≥1024px): Split-screen 45/55 or 50/50
- Tablet & Mobile (<1024px): Left side hidden, form full-width

### Dashboard

- Sidebar: 240px fixed (desktop)
- Main content: Fluid with max-width 1440px
- Cards: Grid layout with 24px gap
- Mobile: Stack vertically

---

## Performance Targets

### Core Web Vitals

- **LCP**: < 1.5s (forms are critical)
- **INP**: < 100ms (instant input response)
- **CLS**: < 0.05 (no layout jumping)

### Bundle Size

- Forms: < 40KB gzipped
- Use LazyMotion for animations (4.6kb vs 34kb)
- Code split by route

### Optimization

- Inline critical CSS
- Preload fonts
- SVG icons as inline data URIs
- Defer non-critical JS

---

## File Organization

```
features/
├── auth/
│   ├── components/
│   │   ├── login-form.tsx
│   │   ├── animated-input.tsx
│   │   ├── animated-password-input.tsx
│   │   ├── animated-form-wrapper.tsx
│   │   ├── form-field.tsx
│   │   └── ...
│   ├── validations/
│   │   └── auth-schemas.ts
│   └── hooks/
│       └── use-login.ts
└── ...
```

---

## Quality Checklist

### Before Launch

- [ ] Lighthouse score 95+ (performance)
- [ ] axe DevTools passes WCAG 2.2 AA
- [ ] INP < 100ms during heavy load
- [ ] Focus ring visible at 200% zoom
- [ ] LCP < 2s on 4G throttle
- [ ] Dark mode works correctly
- [ ] All animations disabled with prefers-reduced-motion
- [ ] Touch targets 44x44px minimum on mobile
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings

---

## References

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Motion Library Docs](https://motion.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Maintained by:** UX/UI Design Team
**Questions?** Contact project leads
