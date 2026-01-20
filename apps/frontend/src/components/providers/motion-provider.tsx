'use client'

import { LazyMotion, domAnimation } from 'motion/react'
import type { ReactNode } from 'react'

interface MotionProviderProps {
  children: ReactNode
}

/**
 * Motion Provider component that wraps the application with LazyMotion
 * for optimized bundle size by loading animation features lazily.
 *
 * This provider uses domAnimation features which includes:
 * - Basic animations (opacity, scale, etc.)
 * - Gestures (tap, pan, drag)
 * - Layout animations
 * - SVG animations
 *
 * @param children - Child components to be wrapped
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
