'use client'

import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface AnimatedFormWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * AnimatedFormWrapper provides smooth entrance animation for forms
 * Respects user's reduced motion preference for accessibility
 */
export function AnimatedFormWrapper({
  children,
  className,
}: AnimatedFormWrapperProps) {
  const prefersReducedMotion = useReducedMotion()

  const variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
    >
      {children}
    </m.div>
  )
}
