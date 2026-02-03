'use client'

import Link from 'next/link'
import { m } from 'motion/react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

/**
 * FloatingBrandIcon component
 * Displays animated brand logo above authentication card
 * Features gentle floating animation (3s cycle)
 * Respects prefers-reduced-motion preference
 * Clicking the logo redirects to the main page
 */
export function FloatingBrandIcon() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="flex justify-center mb-8">
      <Link href="/" className="transition-transform hover:scale-105">
        <m.div
          animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-white text-2xl font-bold shadow-lg cursor-pointer"
          aria-label="M-Tracking logo - Click to go to home"
        >
          M
        </m.div>
      </Link>
    </div>
  )
}
