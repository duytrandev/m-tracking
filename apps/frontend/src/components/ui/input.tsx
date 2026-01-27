'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-md border px-3 py-2 text-sm',
          'bg-white text-gray-900',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-gray-400',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-[#5046E5]',
          'focus-visible:ring-offset-0',
          'focus-visible:border-[#5046E5]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200 ease-out',
          error && [
            'border-red-500',
            'focus-visible:ring-red-500',
            'focus-visible:border-red-500',
          ],
          success &&
            !error && [
              'border-green-500',
              'focus-visible:ring-green-500',
              'focus-visible:border-green-500',
            ],
          !error && !success && 'border-gray-300',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
