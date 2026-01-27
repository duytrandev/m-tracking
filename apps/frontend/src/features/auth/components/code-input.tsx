import { useRef, useEffect, useState } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface CodeInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: boolean
  disabled?: boolean
}

export function CodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
}: CodeInputProps): React.ReactElement {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [localValues, setLocalValues] = useState<string[]>(
    Array(length).fill('')
  )

  // Sync external value to local state - intentional controlled component pattern
   
  useEffect(() => {
    const values = value.padEnd(length, ' ').slice(0, length).split('')
    setLocalValues(values.map(v => (v === ' ' ? '' : v)))
  }, [value, length])

  // Check for completion
  useEffect(() => {
    const completeValue = localValues.join('')
    if (completeValue.length === length && onComplete) {
      onComplete(completeValue)
    }
  }, [localValues, length, onComplete])

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus()
    }
  }

  const handleChange = (index: number, digit: string) => {
    if (disabled) return

    // Only allow single digits
    if (digit && !/^\d$/.test(digit)) return

    const newValues = [...localValues]
    newValues[index] = digit

    setLocalValues(newValues)
    onChange(newValues.join(''))

    // Auto-advance to next input
    if (digit && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    // Backspace: clear current and move to previous
    if (e.key === 'Backspace' && !localValues[index] && index > 0) {
      focusInput(index - 1)
    }

    // Arrow keys navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length)
    const newValues = pastedData.padEnd(length, '').split('')

    setLocalValues(newValues.map(v => (v === ' ' ? '' : v)))
    onChange(pastedData)

    // Focus last filled input or first empty
    const lastIndex =
      pastedData.length < length ? pastedData.length : length - 1
    focusInput(lastIndex)
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={el => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={localValues[index] || ''}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            'h-12 w-12 text-center text-2xl font-mono rounded-md border-2 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-destructive focus:border-destructive'
              : 'border-input focus:border-primary'
          )}
        />
      ))}
    </div>
  )
}
