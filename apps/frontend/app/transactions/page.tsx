'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DateRangePicker } from '@/features/spending/components/date-range-picker'
import { TransactionTable } from '@/features/spending/components/transaction-table'
import { useTransactionsByDateRange, getDefaultDateRange } from '@/features/spending/hooks/use-transactions-by-date'

/**
 * Transactions page
 * Dedicated page for viewing and managing transactions
 */
export default function TransactionsPage() {
  // Date range state for transactions table
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(() => {
    const { start, end } = getDefaultDateRange()
    return { start, end }
  })

  // Fetch transactions by date range
  const {
    transactions,
    isLoading: isTransactionsLoading,
  } = useTransactionsByDateRange({
    startDate: dateRange.start,
    endDate: dateRange.end,
  })

  // Handle date range change
  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end })
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Transactions
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTransactionsLoading
                  ? 'Loading...'
                  : `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Transactions Table Card */}
          <div className="rounded-lg border border-border/40 bg-card/40 backdrop-blur-xl">
            <div className="p-4 pb-3 border-b border-border/20">
              {/* Date Range Picker */}
              <DateRangePicker
                startDate={dateRange.start}
                endDate={dateRange.end}
                onDateChange={handleDateRangeChange}
                showPresets={true}
              />
            </div>

            {/* Transaction Table */}
            <div className="p-4 pt-3">
              <TransactionTable
                transactions={transactions}
                isLoading={isTransactionsLoading}
                emptyMessage="No transactions for selected date range"
                expandable={true}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
