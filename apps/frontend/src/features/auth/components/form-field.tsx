import type { ReactNode } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  success?: boolean
  hint?: string
  children: ReactNode
}

/**
 * FormField component for consistent form field layout with labels, hints, and validation feedback
 */
export function FormField({
  label,
  htmlFor,
  error,
  success,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-gray-900 font-medium">
        {label}
      </Label>
      {children}
      {/* Min-height container prevents layout shift when error/success messages appear */}
      <div className="min-h-[20px]">
        {error && (
          <p
            id={`${htmlFor}-error`}
            className="text-sm text-destructive flex items-center gap-1.5"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        {success && !error && (
          <p
            className="text-sm text-success flex items-center gap-1.5"
            aria-live="polite"
          >
            <Check className="h-3.5 w-3.5 flex-shrink-0" />
            Valid
          </p>
        )}
        {hint && !error && !success && (
          <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
