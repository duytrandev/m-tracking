# Phase 6: Accessibility Enhancements

## Context Links
- [Modern Login UX Research](../reports/researcher-260120-1505-modern-login-ux.md)
- [Form Validation UX Research](../reports/researcher-260120-1505-form-validation-ux.md)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Description:** Ensure WCAG 2.2 AA compliance with proper ARIA attributes, focus management, and reduced-motion support

## Key Insights
- WCAG 2.2 AA legally required (EU EAA + ADA)
- Focus ring: 2px solid, 2px offset (enhanced visibility)
- Minimum tap target: 24x24px (WCAG 2.2 NEW), prefer 44x44px
- Contrast: 4.5:1 (text), 3:1 (UI components)
- Use aria-describedby for error associations
- aria-live="polite" for success, "assertive" for errors

## Requirements

### Functional
- All form inputs have associated labels
- Error messages linked via aria-describedby
- Focus moves to first error on submit failure
- Keyboard navigation matches visual flow
- Reduced-motion support for all animations

### Non-Functional
- Pass axe-core automated testing
- Pass Lighthouse accessibility audit (95+)
- Support screen readers (VoiceOver, NVDA)

## Architecture

### ARIA Attribute Mapping
```
Input Element:
  - id="email"
  - aria-invalid="true|false"
  - aria-describedby="email-error email-hint"
  - aria-required="true"

Error Element:
  - id="email-error"
  - role="alert"
  - aria-live="assertive"

Success Element:
  - aria-live="polite"
```

## Related Code Files

### Modify
- `/apps/frontend/src/features/auth/components/login-form.tsx`
- `/apps/frontend/src/features/auth/components/form-field.tsx`
- `/apps/frontend/src/components/ui/input.tsx`
- `/apps/frontend/src/components/ui/button.tsx`
- `/apps/frontend/app/globals.css` (focus styles)

## Implementation Steps

1. **Enhance focus styles in globals.css**
   ```css
   @layer base {
     /* Enhanced focus ring for WCAG 2.2 */
     *:focus-visible {
       outline: 2px solid hsl(var(--ring));
       outline-offset: 2px;
     }

     /* Remove default outline when custom applied */
     input:focus-visible,
     button:focus-visible,
     a:focus-visible {
       outline: 2px solid hsl(var(--ring));
       outline-offset: 2px;
     }

     /* High contrast mode support */
     @media (forced-colors: active) {
       *:focus-visible {
         outline: 2px solid CanvasText;
       }
     }
   }
   ```

2. **Update Input component with ARIA**
   ```typescript
   // /apps/frontend/src/components/ui/input.tsx
   export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
     error?: boolean
     errorId?: string
     hintId?: string
   }

   const Input = forwardRef<HTMLInputElement, InputProps>(
     ({ className, type, error, errorId, hintId, ...props }, ref) => {
       const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

       return (
         <input
           type={type}
           aria-invalid={error || undefined}
           aria-describedby={describedBy}
           className={cn(
             'flex h-12 w-full rounded-md border ...',
             error && 'border-destructive ...',
             className
           )}
           ref={ref}
           {...props}
         />
       )
     }
   )
   ```

3. **Add focus management on error**
   ```typescript
   // In LoginForm, focus first error field on submit failure
   const onSubmit = async (data: LoginInput): Promise<void> => {
     const result = await login(data)
     if (!result.success) {
       // Focus first error field
       const firstErrorField = Object.keys(errors)[0]
       if (firstErrorField) {
         const element = document.getElementById(firstErrorField)
         element?.focus()
       }
     }
   }

   // Alternative: Use RHF setFocus
   const { setFocus } = useForm()

   useEffect(() => {
     const firstError = Object.keys(errors)[0] as keyof LoginInput
     if (firstError) {
       setFocus(firstError)
     }
   }, [errors, setFocus])
   ```

4. **Add skip link for keyboard users**
   ```typescript
   // In AuthCard or layout
   <a
     href="#login-form"
     className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md"
   >
     Skip to login form
   </a>

   // On form
   <form id="login-form" ...>
   ```

5. **Update button for screen readers**
   ```typescript
   // Button loading state with aria
   <Button
     type="submit"
     aria-busy={isLoading}
     aria-disabled={isLoading}
   >
     {isLoading ? (
       <>
         <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
         <span>Signing in...</span>
       </>
     ) : (
       'Sign In'
     )}
   </Button>
   ```

6. **Add visually hidden announcements**
   ```typescript
   // Screen reader only status announcements
   <div className="sr-only" role="status" aria-live="polite">
     {isLoading && 'Signing in, please wait...'}
     {formState === 'success' && 'Login successful! Redirecting to dashboard.'}
   </div>

   <div className="sr-only" role="alert" aria-live="assertive">
     {error && `Login failed: ${error}`}
   </div>
   ```

7. **Ensure tap target sizes**
   ```typescript
   // Verify all interactive elements are 44x44px minimum
   // Current button height: h-12 (48px) - Good
   // Current input height: h-12 (48px) - Good
   // Checkbox: ensure 24x24px minimum

   // Update Checkbox if needed
   <Checkbox className="h-6 w-6" /> // 24px minimum
   ```

8. **Add reduced-motion media query fallbacks**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

## Todo List
- [ ] Enhance focus ring styles (2px, 2px offset)
- [ ] Add aria-invalid to Input component
- [ ] Add aria-describedby linking
- [ ] Implement focus management on error
- [ ] Add skip link to form
- [ ] Update Button with aria-busy
- [ ] Add visually hidden status announcements
- [ ] Verify tap target sizes (44x44px)
- [ ] Add reduced-motion CSS fallback
- [ ] Run axe-core audit

## Success Criteria
- [ ] axe-core reports 0 critical/serious issues
- [ ] Lighthouse accessibility score 95+
- [ ] Tab order matches visual order
- [ ] Focus moves to first error field on submit failure
- [ ] Screen reader announces errors and status changes
- [ ] All animations disabled with prefers-reduced-motion
- [ ] Works with VoiceOver (Mac) and NVDA (Windows)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing ARIA breaks assistive tech | High | Test with actual screen readers |
| Focus trap issues | Medium | Test keyboard navigation |
| Color contrast failures | High | Verify with WebAIM checker |

## Security Considerations
- No security implications (accessibility improvements only)

## Next Steps
- Proceed to Phase 7: Testing & Verification
