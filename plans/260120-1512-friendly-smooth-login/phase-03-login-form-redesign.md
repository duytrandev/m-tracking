# Phase 3: LoginForm Component Redesign

## Context Links
- [Modern Login UX Research](../reports/researcher-260120-1505-modern-login-ux.md)
- [Current LoginForm](/apps/frontend/src/features/auth/components/login-form.tsx)
- [AuthCard](/apps/frontend/src/features/auth/components/auth-card.tsx)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 2h
- **Description:** Redesign LoginForm with modern minimalist layout, improved visual hierarchy, and cleaner structure

## Key Insights
- Container max-width: 360px (mobile-first) - current is 480px
- 60% white space principle
- Single sans-serif font (Inter recommended)
- Subtle 1px borders, no heavy shadows
- OAuth buttons at bottom (less friction for primary flow)
- Remove decorative elements, keep focus on form

## Requirements

### Functional
- Reorganize form structure (email/password first, OAuth second)
- Improve visual hierarchy with proper spacing
- Add form state management for animations
- Support loading/success/error states

### Non-Functional
- Keep file under 150 lines
- Maintain existing functionality (React Hook Form, Zod)
- Backward compatible with existing AuthCard

## Architecture

### Component Structure
```
LoginForm
  ├── Form Header (title already in AuthCard)
  ├── Global Error Banner (animated)
  ├── Email Field Group
  ├── Password Field Group
  ├── Remember Me + Forgot Password
  ├── Submit Button (animated states)
  ├── Sign Up Link
  ├── Divider
  ├── OAuth Buttons
  └── Passwordless Links
```

### State Machine
```
idle -> submitting -> success | error
         ^                      |
         |______________________|
```

## Related Code Files

### Modify
- `/apps/frontend/src/features/auth/components/login-form.tsx`
- `/apps/frontend/src/features/auth/components/auth-card.tsx` (reduce max-width)

### Create
- `/apps/frontend/src/features/auth/components/form-field.tsx` (reusable field wrapper)

## Implementation Steps

1. **Create FormField component**
   ```typescript
   // /apps/frontend/src/features/auth/components/form-field.tsx
   interface FormFieldProps {
     label: string
     htmlFor: string
     error?: string
     success?: boolean
     hint?: string
     children: ReactNode
   }

   export function FormField({
     label,
     htmlFor,
     error,
     success,
     hint,
     children,
   }: FormFieldProps): ReactElement {
     return (
       <div className="space-y-2">
         <Label htmlFor={htmlFor}>{label}</Label>
         {children}
         {error && (
           <p
             id={`${htmlFor}-error`}
             className="text-sm text-destructive flex items-center gap-1.5"
             role="alert"
             aria-live="polite"
           >
             <AlertCircle className="h-3.5 w-3.5" />
             {error}
           </p>
         )}
         {success && !error && (
           <p className="text-sm text-success flex items-center gap-1.5">
             <Check className="h-3.5 w-3.5" />
             Valid
           </p>
         )}
         {hint && !error && !success && (
           <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
             {hint}
           </p>
         )}
       </div>
     )
   }
   ```

2. **Update AuthCard max-width**
   ```typescript
   // Change from max-w-[480px] to max-w-[400px]
   <Card className={cn('w-full max-w-[400px]', className)}>
   ```

3. **Restructure LoginForm**
   - Move OAuth buttons to bottom
   - Add form state: `idle | submitting | success | error`
   - Improve spacing with `space-y-5` (was space-y-6)
   - Add success state handling

4. **Updated LoginForm structure**
   ```typescript
   export function LoginForm() {
     const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
     const { login, isLoading, error } = useLogin()

     const {
       register,
       handleSubmit,
       formState: { errors, isValid, dirtyFields },
       setValue,
       watch,
     } = useForm<LoginInput>({
       resolver: zodResolver(loginSchema),
       mode: 'onBlur', // Validate on blur
       reValidateMode: 'onChange', // Re-validate on change after error
       defaultValues: { email: '', password: '', rememberMe: true },
     })

     const onSubmit = async (data: LoginInput): Promise<void> => {
       setFormState('submitting')
       try {
         await login(data)
         setFormState('success')
       } catch {
         setFormState('error')
       }
     }

     return (
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
         {/* Global Error */}
         {error && <GlobalErrorBanner message={error} />}

         {/* Email Field */}
         <FormField
           label="Email"
           htmlFor="email"
           error={errors.email?.message}
           success={dirtyFields.email && !errors.email}
         >
           <Input
             id="email"
             type="email"
             placeholder="your.email@example.com"
             autoComplete="email"
             error={!!errors.email}
             aria-describedby={errors.email ? 'email-error' : undefined}
             aria-invalid={!!errors.email}
             {...register('email')}
           />
         </FormField>

         {/* Password Field */}
         <FormField
           label="Password"
           htmlFor="password"
           error={errors.password?.message}
         >
           <PasswordInput
             id="password"
             placeholder="Enter your password"
             autoComplete="current-password"
             error={!!errors.password}
             aria-describedby={errors.password ? 'password-error' : undefined}
             aria-invalid={!!errors.password}
             {...register('password')}
           />
         </FormField>

         {/* Remember Me & Forgot Password */}
         <div className="flex items-center justify-between">
           <RememberMeCheckbox value={rememberMe} onChange={(v) => setValue('rememberMe', v)} />
           <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
             Forgot password?
           </Link>
         </div>

         {/* Submit Button */}
         <Button type="submit" className="w-full" isLoading={isLoading}>
           {isLoading ? 'Signing in...' : 'Sign In'}
         </Button>

         {/* Sign Up Link */}
         <p className="text-center text-sm text-muted-foreground">
           Don't have an account?{' '}
           <Link href="/auth/register" className="font-medium text-primary hover:underline">
             Sign up
           </Link>
         </p>

         {/* Divider */}
         <Divider text="or continue with" />

         {/* OAuth Buttons */}
         <OAuthButtons />

         {/* Passwordless Options */}
         <PasswordlessLinks />
       </form>
     )
   }
   ```

5. **Extract reusable components**
   - `Divider` component
   - `PasswordlessLinks` component
   - `RememberMeCheckbox` component

## Todo List
- [ ] Create FormField component
- [ ] Update AuthCard max-width to 400px
- [ ] Add form state management
- [ ] Restructure form layout (OAuth at bottom)
- [ ] Update validation mode to onBlur + onChange
- [ ] Extract Divider, PasswordlessLinks components
- [ ] Verify all existing functionality works
- [ ] Run lint and type check

## Success Criteria
- [ ] Form renders with new layout
- [ ] OAuth buttons appear below sign up link
- [ ] Form validates on blur (not on every keystroke)
- [ ] Success indicator shows for valid email
- [ ] All existing login functionality preserved
- [ ] File under 150 lines

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking login flow | High | Preserve exact useLogin hook integration |
| Missing form fields | High | Test all form states manually |
| Accessibility regression | Medium | Keep aria attributes, test with axe |

## Security Considerations
- Maintain existing CSRF protection
- Keep password field type handling
- Preserve secure form submission

## Next Steps
- Proceed to Phase 4: Animations & Transitions
