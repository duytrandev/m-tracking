# Phase 1: Dark Theme Foundations

**Status:** Pending
**Priority:** High
**Estimated Time:** 15 minutes

---

## Context

Establish dark theme color tokens and animation variables in globals.css to support Modern Tech Dark aesthetic. Foundation for all subsequent styling changes.

---

## Overview

Add comprehensive dark theme CSS custom properties including background colors, accent colors, glow effects, and animation timing to globals.css.

---

## Requirements

**Functional:**
- Dark background color (#111827 / rgb(17, 24, 39))
- Dark card color (#1f2937 / rgb(31, 41, 55))
- Dark text color (#f3f4f6 / rgb(243, 244, 246))
- Bright accent blue (#0ea5e9 / rgb(14, 165, 233))
- Bright accent green (#10b981 / rgb(16, 185, 129))
- Glow opacity levels (40%, 50% for different states)
- Animation timing variables

**Non-functional:**
- Maintain existing CSS structure
- Use HSL format for compatibility with Tailwind
- Follow code standards for CSS organization

---

## Architecture

**CSS Custom Properties Strategy:**
```css
:root {
  /* Dark Theme Colors */
  --dark-bg: 17 24 39;        /* #111827 - Main background */
  --dark-card: 31 41 55;      /* #1f2937 - Card background */
  --dark-text: 243 244 246;   /* #f3f4f6 - Text color */

  /* Accent Colors */
  --accent-blue: 14 165 233;  /* #0ea5e9 - Primary accent */
  --accent-green: 16 185 129; /* #10b981 - Success accent */

  /* Glow Effects */
  --glow-opacity: 0.4;        /* Default glow strength */
  --glow-hover: 0.5;          /* Hover glow strength */

  /* Animation Timing (already exists, verify) */
  --animation-fast: 150ms;
  --animation-normal: 250ms;
  --animation-slow: 400ms;
}
```

**Dark Mode Override:**
Update `.dark` selector to use new dark theme colors.

---

## Related Files

**File to Modify:**
- `/apps/frontend/app/globals.css` - Add dark theme tokens

**Related Documentation:**
- `/docs/code-standards.md` - CSS organization standards
- `/docs/frontend-configuration.md` - Tailwind configuration

---

## Implementation Steps

1. **Open globals.css**
   - Location: `/apps/frontend/app/globals.css`

2. **Add Dark Theme Tokens to :root**
   ```css
   :root {
     /* Existing tokens... */

     /* Dark Theme Colors - Modern Tech Dark */
     --dark-bg: 17 24 39;        /* #111827 */
     --dark-card: 31 41 55;      /* #1f2937 */
     --dark-text: 243 244 246;   /* #f3f4f6 */

     /* Accent Colors - Bright Blue/Green */
     --accent-blue: 14 165 233;  /* #0ea5e9 */
     --accent-green: 16 185 129; /* #10b981 */

     /* Glow Effects */
     --glow-opacity: 0.4;
     --glow-hover: 0.5;

     /* Verify animation timing already exists */
     /* --animation-fast: 150ms; */
     /* --animation-normal: 250ms; */
     /* --animation-slow: 400ms; */
   }
   ```

3. **Update .dark Selector**
   ```css
   .dark {
     /* Update background to use dark-bg */
     --background: var(--dark-bg);
     --foreground: var(--dark-text);

     /* Update card to use dark-card */
     --card: var(--dark-card);
     --card-foreground: var(--dark-text);

     /* Keep existing dark mode tokens */
     /* ... */
   }
   ```

4. **Add Float Animation Keyframes**
   ```css
   @layer utilities {
     /* Existing animations... */

     /* Floating animation for brand icon */
     .animate-float {
       animation: float 3s ease-in-out infinite;
     }

     @keyframes float {
       0%, 100% {
         transform: translateY(0px);
       }
       50% {
         transform: translateY(-10px);
       }
     }
   }
   ```

5. **Verify Animation Timing Variables Exist**
   - Check if `--animation-fast`, `--animation-normal`, `--animation-slow` exist
   - If not, add them with 150ms, 250ms, 400ms values

6. **Test CSS Compilation**
   ```bash
   cd /Users/DuyHome/dev/any/freelance/m-tracking
   pnpm nx run frontend:build
   ```

---

## Todo List

- [ ] Add dark theme color tokens to :root in globals.css
- [ ] Add accent color tokens (blue/green)
- [ ] Add glow effect opacity variables
- [ ] Update .dark selector with new colors
- [ ] Add float animation keyframes
- [ ] Verify animation timing variables exist
- [ ] Test CSS compilation succeeds
- [ ] Verify no console errors in browser

---

## Success Criteria

- CSS compiles without errors
- Dark theme tokens available as CSS custom properties
- Animation timing variables accessible
- Float animation keyframes defined
- No breaking changes to existing styles

---

## Security Considerations

- N/A - CSS-only changes

---

## Next Steps

- Proceed to Phase 2: Update Layout Component
- Use new CSS tokens for dark background implementation
