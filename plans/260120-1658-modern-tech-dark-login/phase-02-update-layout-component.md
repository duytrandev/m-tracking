# Phase 2: Update Layout Component

**Status:** Pending
**Priority:** High
**Estimated Time:** 20 minutes

---

## Context

Transform auth-layout.tsx from split-screen design to centered dark background layout. Remove decorative split-screen component, implement full dark background (#111827).

---

## Overview

Complete redesign of AuthLayout component:
- Remove split-screen left/right structure
- Remove AuthDecorative component import and usage
- Implement full dark background
- Center content with proper spacing

---

## Requirements

**Functional:**
- Full viewport dark background (#111827)
- Centered content (horizontally and vertically)
- Max-width constraint (420px for card content)
- Responsive padding for mobile
- Remove all split-screen code

**Non-functional:**
- Maintain existing children prop structure
- Follow React best practices
- Use Tailwind utility classes
- Respect motion library standards

---

## Architecture

**Before (Split-Screen):**
```tsx
<div className="min-h-screen flex">
  <AuthDecorative />  {/* LEFT SIDE - REMOVE */}
  <div className="flex-1 ...">  {/* RIGHT SIDE */}
    {children}
  </div>
</div>
```

**After (Centered Dark):**
```tsx
<div className="min-h-screen flex items-center justify-center bg-[#111827]">
  <div className="w-full max-w-md p-4">
    {children}
  </div>
</div>
```

---

## Related Files

**Files to Modify:**
- `/apps/frontend/src/components/layout/auth-layout.tsx` - Main layout component

**Files to Remove (Reference Only, DO NOT Delete):**
- `/apps/frontend/src/features/auth/components/auth-decorative.tsx` - May be used elsewhere

**Related Components:**
- `/apps/frontend/src/features/auth/components/auth-card.tsx` - Will receive layout in Phase 3

---

## Implementation Steps

1. **Open auth-layout.tsx**
   - Location: `/apps/frontend/src/components/layout/auth-layout.tsx`

2. **Remove AuthDecorative Import**
   ```tsx
   // REMOVE THIS LINE:
   import { AuthDecorative } from '@/features/auth/components/auth-decorative'
   ```

3. **Update Component Structure**
   ```tsx
   export function AuthLayout({ children }: AuthLayoutProps) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
         <div className="w-full max-w-md">
           {children}
         </div>
       </div>
     )
   }
   ```

4. **Update JSDoc Comments**
   ```tsx
   /**
    * AuthLayout component
    * Provides centered dark background layout for authentication pages
    * Modern Tech Dark aesthetic with professional developer platform styling
    */
   ```

5. **Remove Dark Mode Toggle Classes**
   - Remove: `dark:bg-slate-950` (no longer needed)
   - Remove: `bg-white` (no longer needed)
   - Use direct hex color for consistency: `bg-[#111827]`

6. **Test Compilation**
   ```bash
   cd /Users/DuyHome/dev/any/freelance/m-tracking
   pnpm nx run frontend:build
   ```

7. **Verify Component Renders**
   - Start dev server: `pnpm nx run frontend:dev`
   - Navigate to: `http://localhost:3000/auth/login`
   - Verify dark background appears
   - Verify content is centered

---

## Todo List

- [ ] Remove AuthDecorative import from auth-layout.tsx
- [ ] Replace split-screen structure with centered layout
- [ ] Add dark background color (#111827)
- [ ] Update max-width to 420px (md = 448px, use custom)
- [ ] Update JSDoc comments
- [ ] Remove unused dark mode classes
- [ ] Test TypeScript compilation
- [ ] Verify component renders in browser
- [ ] Check mobile responsiveness (320px+)

---

## Success Criteria

- No TypeScript errors
- AuthDecorative component removed from layout
- Dark background (#111827) visible across full viewport
- Content centered horizontally and vertically
- Max-width constraint applied (420px)
- Responsive padding works on mobile
- No console errors or warnings

---

## Risk Assessment

**Risk:** Removing split-screen may affect other auth pages
**Mitigation:** Verify register, forgot-password pages use same layout

**Risk:** Hard-coded hex color vs Tailwind token
**Mitigation:** Using hex is acceptable for this specific dark theme design

---

## Security Considerations

- N/A - UI-only changes

---

## Next Steps

- Proceed to Phase 3: Enhance Card Component
- Update auth-card.tsx with dark theme styling
