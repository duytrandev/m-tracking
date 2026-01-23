'use client'

import { useState, Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { TimeFilter } from '@/features/spending/components/time-filter'
import { TimePeriod } from '@/types/api/spending'
import { DashboardStats } from './_components/dashboard-stats'
import { DashboardCharts } from './_components/dashboard-charts'
import { StatisticsCardsSkeleton, ChartSectionSkeleton } from '@/components/ui/skeletons'

/**
 * Dashboard page with manual Suspense boundaries
 * Each section (stats, charts) can load independently
 */
export default function DashboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<TimePeriod>(TimePeriod.MONTH)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header - No Suspense needed, static content */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>
            <TimeFilter selected={period} onChange={setPeriod} />
          </div>

          {/* Statistics Cards - Wrapped in Suspense */}
          <Suspense fallback={<StatisticsCardsSkeleton />}>
            <DashboardStats period={period} />
          </Suspense>

          {/* Charts Section - Wrapped in Suspense */}
          <Suspense fallback={<ChartSectionSkeleton />}>
            <DashboardCharts period={period} />
          </Suspense>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
