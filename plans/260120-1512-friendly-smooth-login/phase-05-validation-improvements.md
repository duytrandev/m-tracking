# Phase 5: Validation Improvements

## Context Links
- [Form Validation UX Research](../reports/researcher-260120-1505-form-validation-ux.md)
- [Modern Login UX Research](../reports/researcher-260120-1505-modern-login-ux.md)
- [LoginForm](/apps/frontend/src/features/auth/components/login-form.tsx)
- [Auth Schemas](/apps/frontend/src/features/auth/validations/auth-schemas.ts)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1.5h
- **Description:** Implement "reward early, punish late" validation pattern with actionable error messages

## Key Insights
- Validate on blur (first interaction), re-validate on change after error
- Remove error message instantly when fixed
- Show success checkmark for valid fields
- Actionable error messages: "Enter valid email like name@example.com"
- 31% of sites lack inline validation (opportunity)
- Multi-step forms increase conversion 35-214%

## Requirements

### Functional
- Email: Validate format on blur, show success checkmark when valid
- Password: Validate only on submit (avoid premature requirements)
- Error messages disappear instantly on valid input
- Success indicators for validated fields
- Specific, actionable error messages

### Non-Functional
- Real-time validation < 50ms response
- No layout shift on error message appearance
- ARIA live regions for screen reader announcements

## Architecture

### Validation Timing Strategy
```
Field     | When to Validate      | When to Clear Error
----------|----------------------|---------------------
Email     | onBlur (first touch) | onChange (instant)
          | onChange (after err) |
Password  | onSubmit only        | onSubmit
```

### Error Message Format
```
Generic: "Invalid email"           -> Actionable: "Enter a valid email like name@example.com"
Generic: "Password required"       -> Actionable: "Enter your password to continue"
Generic: "Password too short"      -> Actionable: "Password must be at least 8 characters"
```

## Related Code Files

### Modify
- `/apps/frontend/src/features/auth/validations/auth-schemas.ts` (update error messages)
- `/apps/frontend/src/features/auth/components/login-form.tsx` (validation mode)
- `/apps/frontend/src/features/auth/components/form-field.tsx` (success state)

## Implementation Steps

1. **Update Zod schema with actionable messages**
   ```typescript
   // /apps/frontend/src/features/auth/validations/auth-schemas.ts
   import { z } from 'zod'

   export const loginSchema = z.object({
     email: z
       .string()
       .min(1, 'Enter your email address')
       .email('Enter a valid email like name@example.com'),
     password: z
       .string()
       .min(1, 'Enter your password to continue')
       .min(8, 'Password must be at least 8 characters'),
     rememberMe: z.boolean().optional(),
   })

   export type LoginInput = z.infer<typeof loginSchema>
   ```

2. **Configure React Hook Form validation mode**
   ```typescript
   // In LoginForm
   const {
     register,
     handleSubmit,
     formState: { errors, dirtyFields, touchedFields },
     trigger,
   } = useForm<LoginInput>({
     resolver: zodResolver(loginSchema),
     mode: 'onBlur',           // Validate on blur
     reValidateMode: 'onChange', // Re-validate on change after error
     criteriaMode: 'firstError', // Show first error only
     defaultValues: {
       email: '',
       password: '',
       rememberMe: true,
     },
   })
   ```

3. **Create field validation state helper**
   ```typescript
   // Helper to determine field state
   type FieldState = 'idle' | 'valid' | 'invalid'

   function getFieldState(
     name: keyof LoginInput,
     errors: FieldErrors<LoginInput>,
     dirtyFields: Partial<Record<keyof LoginInput, boolean>>,
     touchedFields: Partial<Record<keyof LoginInput, boolean>>
   ): FieldState {
     const hasError = !!errors[name]
     const isDirty = dirtyFields[name]
     const isTouched = touchedFields[name]

     if (hasError) return 'invalid'
     if (isDirty && isTouched && !hasError) return 'valid'
     return 'idle'
   }
   ```

4. **Update FormField with validation states**
   ```typescript
   // /apps/frontend/src/features/auth/components/form-field.tsx
   import { Check, AlertCircle } from 'lucide-react'

   interface FormFieldProps {
     label: string
     htmlFor: string
     error?: string
     state: 'idle' | 'valid' | 'invalid'
     children: ReactNode
   }

   export function FormField({
     label,
     htmlFor,
     error,
     state,
     children,
   }: FormFieldProps): ReactElement {
     return (
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <Label htmlFor={htmlFor}>{label}</Label>
           {state === 'valid' && (
             <span className="text-success text-xs flex items-center gap-1">
               <Check className="h-3 w-3" />
               Valid
             </span>
           )}
         </div>
         {children}
         <div
           className="min-h-[20px]" // Prevent layout shift
           aria-live="polite"
           aria-atomic="true"
         >
           {error && (
             <p
               id={`${htmlFor}-error`}
               className="text-sm text-destructive flex items-center gap-1.5"
               role="alert"
             >
               <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
               {error}
             </p>
           )}
         </div>
       </div>
     )
   }
   ```

5. **Add instant error clearing**
   ```typescript
   // In LoginForm, use clearErrors on valid input
   const email = watch('email')
   const password = watch('password')

   useEffect(() => {
     // Clear email error when valid format entered
     if (email && loginSchema.shape.email.safeParse(email).success) {
       clearErrors('email')
     }
   }, [email, clearErrors])
   ```

6. **Add ARIA live region for announcements**
   ```typescript
   // Screen reader announcements for validation
   <div
     className="sr-only"
     role="status"
     aria-live="polite"
     aria-atomic="true"
   >
     {errors.email && `Email error: ${errors.email.message}`}
     {errors.password && `Password error: ${errors.password.message}`}
   </div>
   ```

7. **Update Input styling for states**
   ```typescript
   // Dynamic border colors based on state
   const inputStateClasses = {
     idle: 'border-input',
     valid: 'border-success focus-visible:ring-success',
     invalid: 'border-destructive focus-visible:ring-destructive',
   }

   <Input
     className={cn(inputStateClasses[fieldState])}
     aria-invalid={fieldState === 'invalid'}
     ...
   />
   ```

## Todo List
- [ ] Update Zod schema with actionable error messages
- [ ] Configure RHF mode: onBlur + reValidateMode: onChange
- [ ] Create getFieldState helper function
- [ ] Update FormField with state prop and success indicator
- [ ] Add min-height to error container (prevent layout shift)
- [ ] Implement instant error clearing on valid input
- [ ] Add ARIA live region for screen readers
- [ ] Update Input with state-based border colors
- [ ] Test validation flow: blur -> error -> fix -> clear

## Success Criteria
- [ ] Email validates on blur only (not on type)
- [ ] Error disappears < 100ms after valid input
- [ ] Green checkmark shows for valid email
- [ ] No layout shift when error appears/disappears
- [ ] Screen reader announces errors via aria-live
- [ ] Error messages are actionable ("like name@example.com")

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Validation timing confusion | Medium | Clear documentation in code |
| Race conditions | Low | Use RHF built-in debouncing |
| Accessibility regression | High | Test with NVDA/VoiceOver |

## Security Considerations
- Keep server-side validation as source of truth
- Don't expose validation logic details in errors
- Maintain rate limiting on API

## Next Steps
- Proceed to Phase 6: Accessibility Enhancements
