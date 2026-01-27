'use client'

import { forwardRef, useEffect, useState } from 'react'
import { m } from 'motion/react'
import { PasswordInput, type PasswordInputProps } from './password-input'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

/**
 * AnimatedPasswordInput wraps the PasswordInput component with shake animation on error
 * Respects user's reduced motion preference
 */
export const AnimatedPasswordInput = forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ error, ...props }, ref) => {
  const [shake, setShake] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // Trigger shake animation on error - intentional setState in effect for animation
   
  useEffect(() => {
    if (error && !prefersReducedMotion) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 400)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [error, prefersReducedMotion])

  return (
    <m.div
      animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <PasswordInput ref={ref} error={error} {...props} />
    </m.div>
  )
})

AnimatedPasswordInput.displayName = 'AnimatedPasswordInput'
