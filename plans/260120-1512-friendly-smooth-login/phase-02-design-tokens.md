# Phase 2: Design Tokens Update

## Context Links
- [Modern Login UX Research](../reports/researcher-260120-1505-modern-login-ux.md)
- [globals.css](/apps/frontend/app/globals.css)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1h
- **Description:** Update CSS variables and add animation tokens for modern minimalist design

## Key Insights
- Typography-first design, max 2 accent colors
- Subtle borders (1px), no heavy shadows
- 60% white space for single-column forms
- Input height: 44px minimum (WCAG touch target), current: 48px (good)
- Transition timing: 200-300ms with cubic-bezier(0.4, 0, 0.2, 1)

## Requirements

### Functional
- New CSS variables for animation timing
- Success/error state colors
- Enhanced focus states

### Non-Functional
- Maintain backward compatibility with existing components
- WCAG 2.2 AA contrast ratios (4.5:1 text, 3:1 UI)

## Architecture

### Token Categories
```
--animation-*    : Timing and easing
--success-*      : Success state colors
--warning-*      : Warning/loading state colors
--focus-ring-*   : Enhanced focus indicators
```

## Related Code Files

### Modify
- `/apps/frontend/app/globals.css` - Add new CSS variables

## Implementation Steps

1. **Add animation timing tokens**
   ```css
   :root {
     /* Animation Timing */
     --animation-fast: 150ms;
     --animation-normal: 250ms;
     --animation-slow: 400ms;

     /* Easing Functions */
     --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
     --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
     --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   ```

2. **Add validation state colors**
   ```css
   :root {
     /* Success States */
     --success: 142 76% 36%;
     --success-foreground: 0 0% 100%;

     /* Warning States */
     --warning: 38 92% 50%;
     --warning-foreground: 0 0% 0%;
   }

   .dark {
     --success: 142 71% 45%;
     --success-foreground: 0 0% 0%;

     --warning: 38 92% 50%;
     --warning-foreground: 0 0% 0%;
   }
   ```

3. **Add form-specific tokens**
   ```css
   :root {
     /* Form Design Tokens */
     --form-spacing: 1.5rem;
     --input-focus-ring-width: 2px;
     --input-focus-ring-offset: 2px;
   }
   ```

4. **Add focus-visible enhancements**
   ```css
   @layer base {
     /* Enhanced focus states */
     *:focus-visible {
       outline: var(--input-focus-ring-width) solid hsl(var(--ring));
       outline-offset: var(--input-focus-ring-offset);
     }
   }
   ```

5. **Add utility classes for animations**
   ```css
   @layer utilities {
     .transition-form {
       transition-property: border-color, box-shadow, transform, opacity;
       transition-duration: var(--animation-normal);
       transition-timing-function: var(--ease-out);
     }

     .animate-shake {
       animation: shake 0.4s ease-in-out;
     }

     @keyframes shake {
       0%, 100% { transform: translateX(0); }
       25% { transform: translateX(-4px); }
       75% { transform: translateX(4px); }
     }

     .animate-success-check {
       animation: success-check 0.3s ease-out forwards;
     }

     @keyframes success-check {
       0% { transform: scale(0); opacity: 0; }
       50% { transform: scale(1.2); }
       100% { transform: scale(1); opacity: 1; }
     }
   }
   ```

6. **Update Tailwind config** (if needed)
   ```javascript
   // tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           success: 'hsl(var(--success))',
           warning: 'hsl(var(--warning))',
         },
         transitionTimingFunction: {
           'out': 'cubic-bezier(0.4, 0, 0.2, 1)',
           'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
         },
       },
     },
   }
   ```

## Todo List
- [ ] Add animation timing tokens to globals.css
- [ ] Add success/warning color tokens
- [ ] Add form-specific tokens
- [ ] Add utility animation classes
- [ ] Update Tailwind config for new colors
- [ ] Verify dark mode contrast ratios

## Success Criteria
- [ ] New CSS variables available in DevTools
- [ ] Success color: 4.5:1 contrast ratio
- [ ] Warning color: 4.5:1 contrast ratio
- [ ] Animation utilities work: `.transition-form`, `.animate-shake`
- [ ] Dark mode colors render correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing styles | Medium | Only add new tokens, don't modify existing |
| Contrast ratio failures | High | Test with WebAIM checker before merge |

## Security Considerations
- No security implications (styling only)

## Next Steps
- Proceed to Phase 3: LoginForm Redesign
