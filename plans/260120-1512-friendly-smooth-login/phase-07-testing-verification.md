# Phase 7: Testing & Verification

## Context Links
- [All Research Reports](../reports/)
- [LoginForm](/apps/frontend/src/features/auth/components/login-form.tsx)
- [E2E Tests Config](/apps/frontend/playwright.config.ts)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Description:** Verify all improvements work correctly, test accessibility, performance, and cross-browser compatibility

## Key Insights
- Lighthouse target: 95+ performance, 95+ accessibility
- Core Web Vitals: LCP < 1.5s, INP < 100ms, CLS < 0.05
- axe-core for automated accessibility
- Test prefers-reduced-motion behavior
- Cross-browser: Chrome, Firefox, Safari, Edge

## Requirements

### Functional
- All login flows work (email/password, OAuth, magic link)
- Validation behaves as designed
- Animations play correctly
- Reduced-motion disables animations

### Non-Functional
- Lighthouse performance 90+
- Lighthouse accessibility 95+
- axe-core 0 critical issues
- Bundle size increase < 10KB

## Architecture

### Test Categories
```
1. Unit Tests (Vitest)
   - FormField component
   - Validation helpers
   - useReducedMotion hook

2. Integration Tests (Vitest + Testing Library)
   - LoginForm validation flow
   - Form submission states
   - Error display/clearing

3. E2E Tests (Playwright)
   - Complete login flow
   - OAuth redirect
   - Error scenarios

4. Accessibility Tests (axe-core)
   - Automated WCAG checks
   - Focus management

5. Performance Tests (Lighthouse)
   - Core Web Vitals
   - Bundle analysis
```

## Related Code Files

### Create
- `/apps/frontend/src/features/auth/components/__tests__/login-form.test.tsx`
- `/apps/frontend/e2e/auth/login-redesign.spec.ts`

### Modify
- Existing test files if any

## Implementation Steps

1. **Create LoginForm unit tests**
   ```typescript
   // /apps/frontend/src/features/auth/components/__tests__/login-form.test.tsx
   import { render, screen, waitFor } from '@testing-library/react'
   import userEvent from '@testing-library/user-event'
   import { LoginForm } from '../login-form'

   describe('LoginForm', () => {
     it('renders email and password fields', () => {
       render(<LoginForm />)
       expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
       expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
     })

     it('shows email error on blur with invalid email', async () => {
       const user = userEvent.setup()
       render(<LoginForm />)

       const emailInput = screen.getByLabelText(/email/i)
       await user.type(emailInput, 'invalid')
       await user.tab() // Trigger blur

       await waitFor(() => {
         expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
       })
     })

     it('clears error when valid email entered', async () => {
       const user = userEvent.setup()
       render(<LoginForm />)

       const emailInput = screen.getByLabelText(/email/i)
       await user.type(emailInput, 'invalid')
       await user.tab()

       await waitFor(() => {
         expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
       })

       await user.clear(emailInput)
       await user.type(emailInput, 'valid@example.com')

       await waitFor(() => {
         expect(screen.queryByText(/enter a valid email/i)).not.toBeInTheDocument()
       })
     })

     it('shows success indicator for valid email', async () => {
       const user = userEvent.setup()
       render(<LoginForm />)

       const emailInput = screen.getByLabelText(/email/i)
       await user.type(emailInput, 'valid@example.com')
       await user.tab()

       await waitFor(() => {
         expect(screen.getByText(/valid/i)).toBeInTheDocument()
       })
     })

     it('disables submit button while loading', async () => {
       // Mock useLogin to return isLoading: true
       render(<LoginForm />)
       // Assert button disabled
     })
   })
   ```

2. **Create E2E accessibility test**
   ```typescript
   // /apps/frontend/e2e/auth/login-accessibility.spec.ts
   import { test, expect } from '@playwright/test'
   import AxeBuilder from '@axe-core/playwright'

   test.describe('Login Page Accessibility', () => {
     test('should have no accessibility violations', async ({ page }) => {
       await page.goto('/auth/login')

       const accessibilityScanResults = await new AxeBuilder({ page })
         .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
         .analyze()

       expect(accessibilityScanResults.violations).toEqual([])
     })

     test('should have correct focus order', async ({ page }) => {
       await page.goto('/auth/login')

       await page.keyboard.press('Tab')
       await expect(page.getByLabel(/email/i)).toBeFocused()

       await page.keyboard.press('Tab')
       await expect(page.getByLabel(/password/i)).toBeFocused()

       await page.keyboard.press('Tab')
       await expect(page.getByLabel(/remember me/i)).toBeFocused()
     })

     test('should announce errors to screen readers', async ({ page }) => {
       await page.goto('/auth/login')

       const emailInput = page.getByLabel(/email/i)
       await emailInput.fill('invalid')
       await emailInput.blur()

       const errorAlert = page.getByRole('alert')
       await expect(errorAlert).toBeVisible()
       await expect(errorAlert).toHaveAttribute('aria-live')
     })
   })
   ```

3. **Create E2E animation test**
   ```typescript
   // /apps/frontend/e2e/auth/login-animations.spec.ts
   import { test, expect } from '@playwright/test'

   test.describe('Login Page Animations', () => {
     test('should disable animations with prefers-reduced-motion', async ({ page }) => {
       // Emulate reduced motion preference
       await page.emulateMedia({ reducedMotion: 'reduce' })
       await page.goto('/auth/login')

       // Verify no transform animations
       const form = page.locator('form')
       const transform = await form.evaluate((el) =>
         window.getComputedStyle(el).transform
       )
       expect(transform).toBe('none')
     })

     test('should show success animation on login', async ({ page }) => {
       await page.goto('/auth/login')

       // Fill form with valid credentials (mocked API)
       await page.getByLabel(/email/i).fill('test@example.com')
       await page.getByLabel(/password/i).fill('password123')
       await page.getByRole('button', { name: /sign in/i }).click()

       // Verify success state appears
       await expect(page.getByText(/welcome back/i)).toBeVisible()
     })
   })
   ```

4. **Performance testing checklist**
   ```bash
   # Run Lighthouse audit
   npx lighthouse http://localhost:3000/auth/login \
     --only-categories=performance,accessibility \
     --output=html \
     --output-path=./lighthouse-report.html

   # Check bundle size
   pnpm build
   # Verify .next/analyze output or use @next/bundle-analyzer

   # Check Core Web Vitals
   npx web-vitals http://localhost:3000/auth/login
   ```

5. **Manual testing checklist**
   ```markdown
   ## Visual Testing
   - [ ] Form renders correctly on mobile (375px)
   - [ ] Form renders correctly on tablet (768px)
   - [ ] Form renders correctly on desktop (1440px)
   - [ ] Dark mode colors are correct
   - [ ] Focus rings are visible (2px)

   ## Interaction Testing
   - [ ] Email field validates on blur
   - [ ] Error clears immediately on valid input
   - [ ] Success checkmark appears for valid email
   - [ ] Button shows loading state
   - [ ] Success state shows checkmark animation
   - [ ] Error banner slides in/out

   ## Keyboard Testing
   - [ ] Tab order: email -> password -> remember -> forgot -> submit
   - [ ] Enter submits form from any field
   - [ ] Focus visible on all interactive elements

   ## Screen Reader Testing (VoiceOver)
   - [ ] Form label announced
   - [ ] Input labels announced
   - [ ] Errors announced via aria-live
   - [ ] Button state changes announced

   ## Reduced Motion Testing
   - [ ] Enable "Reduce motion" in system settings
   - [ ] Verify no animations play
   - [ ] All functionality still works
   ```

## Todo List
- [ ] Create LoginForm unit tests
- [ ] Create E2E accessibility tests with axe-core
- [ ] Create E2E animation tests
- [ ] Run Lighthouse audit (target: 95+)
- [ ] Verify bundle size increase < 10KB
- [ ] Manual test on mobile/tablet/desktop
- [ ] Test with VoiceOver/NVDA
- [ ] Test with prefers-reduced-motion

## Success Criteria
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] axe-core reports 0 violations
- [ ] Lighthouse accessibility 95+
- [ ] Lighthouse performance 90+
- [ ] LCP < 1.5s, INP < 100ms, CLS < 0.05
- [ ] Bundle size increase < 10KB
- [ ] Manual QA checklist complete

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flaky animation tests | Low | Use Playwright's wait helpers |
| Performance regression | Medium | Compare before/after metrics |
| Missed edge cases | Medium | Thorough manual testing |

## Security Considerations
- Ensure test credentials not committed
- Use mock API for E2E tests

## Next Steps
- Mark plan as complete
- Document any remaining issues for follow-up
- Update project changelog
