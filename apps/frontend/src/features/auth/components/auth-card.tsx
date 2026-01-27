'use client'

import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface AuthCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function AuthCard({
  title,
  description,
  children,
  className,
}: AuthCardProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: 'easeOut',
      }}
      className={cn('w-full', className)}
    >
      {/* Title Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && (
          <p className="text-gray-600 text-base">{description}</p>
        )}
      </div>

      {/* Form Content */}
      <div>{children}</div>
    </m.div>
  )
}
