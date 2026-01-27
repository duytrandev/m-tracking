import { cn } from '@/lib/utils'
import {
  calculatePasswordStrength,
  type PasswordStrength,
} from '../validations/auth-schemas'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

const strengthConfig: Record<
  PasswordStrength,
  { label: string; color: string; width: string }
> = {
  weak: { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' },
  medium: { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' },
  strong: { label: 'Strong', color: 'bg-green-500', width: 'w-full' },
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const strength = calculatePasswordStrength(password)
  const config = strengthConfig[strength]

  return (
    <div className={cn('space-y-1', className)} aria-live="polite">
      <div className="h-1 w-full rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            config.color,
            config.width
          )}
          role="progressbar"
          aria-valuenow={
            strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${config.label}`}
        />
      </div>
      <p
        className={cn('text-xs font-medium', {
          'text-red-500': strength === 'weak',
          'text-amber-500': strength === 'medium',
          'text-green-500': strength === 'strong',
        })}
      >
        {config.label} password
      </p>
    </div>
  )
}
