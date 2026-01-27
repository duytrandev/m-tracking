'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useSpendingData } from '@/features/spending/hooks/use-spending-data'
import { ChartSkeleton } from '@/components/ui/chart-skeleton'
import { TimePeriod } from '@/types/api/spending'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Dynamic imports for heavy chart libraries
const SpendingChart = dynamic(
  () => import('@/features/spending/components/spending-chart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={300} />,
  }
)

const CategoryBreakdownChart = dynamic(
  () => import('@/features/spending/components/category-breakdown'),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={250} />,
  }
)

interface DashboardChartsProps {
  period: TimePeriod
}

/**
 * Dashboard charts section
 * Separated component for easier Suspense wrapping
 */
export function DashboardCharts({ period }: DashboardChartsProps) {
  const { summary, isLoading } = useSpendingData(period)
  const [showCharts, setShowCharts] = useState(false)

  return (
    <div className="rounded-lg border border-border/40 bg-card/40 backdrop-blur-xl">
      <button
        onClick={() => setShowCharts(!showCharts)}
        className="w-full flex items-center justify-between p-4 hover:bg-background/20 transition-colors rounded-lg"
      >
        <h2 className="font-heading text-lg font-semibold">Analytics</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {showCharts ? 'Hide' : 'Show'} charts
          </span>
          {showCharts ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {showCharts && (
        <div className="p-4 pt-0 grid gap-6 lg:grid-cols-2">
          {/* Spending Trend Chart */}
          <div className="rounded-lg border border-border/20 bg-background/20 p-4">
            <h3 className="mb-3 text-sm font-medium">Spending Trend</h3>
            {isLoading ? (
              <div className="h-[250px] animate-pulse rounded-lg bg-background/50" />
            ) : summary && summary.dailyTrend.length > 0 ? (
              <SpendingChart data={summary.dailyTrend} type="area" />
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="rounded-lg border border-border/20 bg-background/20 p-4">
            <h3 className="mb-3 text-sm font-medium">Category Breakdown</h3>
            {isLoading ? (
              <div className="h-[250px] animate-pulse rounded-lg bg-background/50" />
            ) : summary && summary.categoryBreakdown.length > 0 ? (
              <CategoryBreakdownChart data={summary.categoryBreakdown} />
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
