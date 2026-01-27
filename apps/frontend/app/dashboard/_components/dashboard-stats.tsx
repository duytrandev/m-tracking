'use client'

import { StatisticsCard } from '@/features/spending/components/statistics-card'
import { useSpendingData } from '@/features/spending/hooks/use-spending-data'
import { TimePeriod } from '@/types/api/spending'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface DashboardStatsProps {
  period: TimePeriod
}

/**
 * Dashboard statistics cards
 * Separated component for easier Suspense wrapping
 */
export function DashboardStats({ period }: DashboardStatsProps) {
  const { summary, isLoading } = useSpendingData(period)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-card/40 backdrop-blur-xl"
          />
        ))}
      </div>
    )
  }

  return (
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
        subtitle={(summary?.netBalance || 0) >= 0 ? 'Positive' : 'Negative'}
        icon={Wallet}
        iconColor={
          (summary?.netBalance || 0) >= 0 ? 'text-success' : 'text-destructive'
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
  )
}
