'use client'

import { Suspense, type ReactNode } from 'react'

/**
 * Props for SuspenseWrapper component
 */
interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  /** Optional error boundary can be added here in the future */
}

/**
 * SuspenseWrapper component
 * Wraps content with Suspense boundary for granular loading states
 * 
 * Usage:
 * ```tsx
 * <SuspenseWrapper fallback={<DashboardSkeleton />}>
 *   <DashboardContent />
 * </SuspenseWrapper>
 * ```
 */
export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

/**
 * Multiple suspense sections for complex pages
 * Allows different parts of the page to load independently
 */
interface SuspenseSectionsProps {
  sections: Array<{
    key: string
    content: ReactNode
    fallback: ReactNode
  }>
}

/**
 * SuspenseSections component
 * Creates multiple independent Suspense boundaries
 * 
 * Usage:
 * ```tsx
 * <SuspenseSections
 *   sections={[
 *     { key: 'stats', content: <StatsCards />, fallback: <StatsSkeleton /> },
 *     { key: 'chart', content: <Chart />, fallback: <ChartSkeleton /> }
 *   ]}
 * />
 * ```
 */
export function SuspenseSections({ sections }: SuspenseSectionsProps) {
  return (
    <>
      {sections.map((section) => (
        <Suspense key={section.key} fallback={section.fallback}>
          {section.content}
        </Suspense>
      ))}
    </>
  )
}
