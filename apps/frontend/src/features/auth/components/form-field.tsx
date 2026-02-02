import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, Check } from 'lucide-react'
import { Label } from '@/components/ui/label'

type HintType = 'info' | 'warning' | 'error'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  success?: boolean
  hint?: string
  /** Hint type affects styling: 'info' (default), 'warning' (amber), 'error' (red) */
  hintType?: HintType
  children: ReactNode
}

/**
 * FormField component for consistent form field layout with labels, hints, and validation feedback.
 * Supports multiple hint types for contextual feedback (info, warning, error).
 */
export function FormField({
  label,
  htmlFor,
  error,
  success,
  hint,
  hintType = 'info',
  children,
}: FormFieldProps) {
  // Show hint when there's a hint and no validation error
  const showHint = hint && !error

  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-gray-900 font-medium">
        {label}
      </Label>
      {children}
      {/* Min-height container prevents layout shift when messages appear */}
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
        {success && !error && !showHint && (
          <p
            className="text-sm text-success flex items-center gap-1.5"
            aria-live="polite"
          >
            <Check className="h-3.5 w-3.5 flex-shrink-0" />
            Valid
          </p>
        )}
        {showHint && (
          <p
            id={`${htmlFor}-hint`}
            className={`text-sm flex items-center gap-1.5 ${
              hintType === 'warning'
                ? 'text-amber-600'
                : hintType === 'error'
                  ? 'text-destructive'
                  : 'text-muted-foreground text-xs'
            }`}
            role={
              hintType === 'warning' || hintType === 'error'
                ? 'alert'
                : undefined
            }
            aria-live={
              hintType === 'warning' || hintType === 'error'
                ? 'polite'
                : undefined
            }
          >
            {hintType === 'warning' && (
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {hintType === 'error' && (
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
