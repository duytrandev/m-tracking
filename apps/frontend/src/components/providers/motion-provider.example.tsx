/**
 * Motion Provider Usage Examples
 *
 * This file demonstrates how to use the MotionProvider and useReducedMotion hook
 * in your components.
 */

'use client'

import { m } from 'motion/react'
import { MotionProvider } from './motion-provider'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

/**
 * Example 1: Basic Animation with Reduced Motion Support
 */
export function BasicAnimationExample() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      <h1>Animated Content</h1>
    </m.div>
  )
}

/**
 * Example 2: Hover Animation
 */
export function HoverAnimationExample() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <m.button
      whileHover={
        prefersReducedMotion
          ? undefined
          : { scale: 1.05, transition: { duration: 0.2 } }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
    >
      Click Me
    </m.button>
  )
}

/**
 * Example 3: Stagger Children Animation
 */
export function StaggerExample() {
  const prefersReducedMotion = useReducedMotion()
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4']

  return (
    <m.ul
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : 0.1,
          },
        },
      }}
    >
      {items.map((item, index) => (
        <m.li
          key={index}
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          {item}
        </m.li>
      ))}
    </m.ul>
  )
}

/**
 * Example 4: Layout Animation
 */
export function LayoutAnimationExample() {
  return (
    <m.div layout>
      <h2>This will animate smoothly when layout changes</h2>
    </m.div>
  )
}

/**
 * Example 5: App Root Setup
 *
 * Wrap your app root with MotionProvider:
 */
export function AppRootExample({ children }: { children: React.ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>
}
