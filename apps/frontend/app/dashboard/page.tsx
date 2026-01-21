'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useSpendingData } from '@/features/spending/hooks/use-spending-data'
import { StatisticsCard } from '@/features/spending/components/statistics-card'
import { TimeFilter } from '@/features/spending/components/time-filter'
import { ChartSkeleton } from '@/components/ui/chart-skeleton'
import { TimePeriod } from '@/types/api/spending'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// Dynamic imports - only load when needed (defers ~150KB Recharts library)
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

/**
 * Dashboard page
 * Comprehensive spending tracking dashboard with charts and analytics
 */
export default function DashboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<TimePeriod>(TimePeriod.MONTH)
  const { summary, isLoading } = useSpendingData(period)
  const [showCharts, setShowCharts] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Compact Header */}
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

          {/* Statistics Cards - Compact */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-card/40 backdrop-blur-xl"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatisticsCard
                title="Total Expense"
                value={formatCurrency(summary?.totalExpense || 0)}
                subtitle={`${summary?.transactionCount || 0} transactions`}
                icon={TrendingDown}
                iconColor="text-primary"
                delay={0}
              />
              <StatisticsCard
                title="Total Income"
                value={formatCurrency(summary?.totalIncome || 0)}
                subtitle="This period"
                icon={TrendingUp}
                iconColor="text-success"
                delay={0.1}
              />
              <StatisticsCard
                title="Net Balance"
                value={formatCurrency(summary?.netBalance || 0)}
                subtitle={
                  (summary?.netBalance || 0) >= 0 ? 'Positive' : 'Negative'
                }
                icon={Wallet}
                iconColor={
                  (summary?.netBalance || 0) >= 0
                    ? 'text-success'
                    : 'text-destructive'
                }
                delay={0.2}
              />
              <StatisticsCard
                title="Avg Expense"
                value={formatCurrency(summary?.averageExpense || 0)}
                subtitle="Per transaction"
                icon={DollarSign}
                iconColor="text-accent"
                delay={0.3}
              />
            </div>
          )}

          {/* Charts Section - Collapsible */}
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
                  <h3 className="mb-3 text-sm font-medium">
                    Category Breakdown
                  </h3>
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
