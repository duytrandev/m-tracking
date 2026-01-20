'use client'

import { forwardRef, useEffect, useState } from 'react'
import { m } from 'motion/react'
import { Input, type InputProps } from '@/components/ui/input'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

/**
 * AnimatedInput wraps the Input component with shake animation on error
 * and smooth focus transitions. Respects user's reduced motion preference.
 */
export const AnimatedInput = forwardRef<HTMLInputElement, InputProps>(
  ({ error, onFocus, onBlur, ...props }, ref) => {
    const [shake, setShake] = useState(false)
    const prefersReducedMotion = useReducedMotion()

    useEffect(() => {
      if (error && !prefersReducedMotion) {
        setShake(true)
        const timer = setTimeout(() => setShake(false), 400)
        return () => clearTimeout(timer)
      }
      return undefined
    }, [error, prefersReducedMotion])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e)
    }

    return (
      <m.div
        animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{
          duration: 0.4,
          ease: 'easeInOut'
        }}
      >
        <Input
          ref={ref}
          error={error}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </m.div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'
