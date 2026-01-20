'use client'

import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { format, parseISO } from 'date-fns'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/api/spending'

/**
 * Sort configuration types
 */
type SortField = 'date' | 'spend' | 'receive'
type SortDirection = 'asc' | 'desc'

/**
 * Daily transaction group interface
 */
interface DailyTransactionGroup {
  date: string
  categories: Array<{
    id: string
    name: string
    color: string
    icon: string
  }>
  totalSpend: number
  totalReceive: number
  netAmount: number
  transactionCount: number
  transactions: Transaction[]
}

/**
 * TransactionTable component props
 */
interface TransactionTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  emptyMessage?: string
  expandable?: boolean
}

/**
 * Category spending breakdown for a specific day
 */
interface CategorySpending {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  totalSpend: number
  totalReceive: number
  transactionCount: number
}

/**
 * Unknown category constant
 */
const UNKNOWN_CATEGORY = {
  id: 'unknown',
  name: 'Unknown',
  color: '#94A3B8',
  icon: 'help-circle',
}

/**
 * Loading skeleton for table
 */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg bg-background/50"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  )
}

/**
 * Sortable header component props
 */
interface SortableHeaderProps {
  label: string
  field: SortField
  currentSort: SortField | null
  direction: SortDirection
  onSort: (field: SortField) => void
  className?: string
}

/**
 * Sortable header component
 */
function SortableHeader({
  label,
  field,
  currentSort,
  direction,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === field

  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-left font-medium text-muted-foreground cursor-pointer',
        'hover:text-foreground transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded',
        isActive && 'text-foreground',
        className
      )}
      aria-label={`Sort by ${label} ${isActive ? (direction === 'asc' ? 'descending' : 'ascending') : ''}`}
    >
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  )
}

/**
 * Category badge component
 */
function CategoryBadge({ category }: { category: { name: string; color: string } }) {
  const isUnknown = category.name === 'Unknown'

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-background/60 border"
      style={{
        borderColor: `${category.color}40`,
        color: category.color,
      }}
    >
      <div
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      <span className="truncate max-w-[80px]">{category.name}</span>
      {isUnknown && <HelpCircle className="h-2.5 w-2.5" />}
    </div>
  )
}

/**
 * TransactionTable component
 * Displays transactions grouped by date with spend/receive columns
 * Supports expandable rows to show category breakdowns
 */
export function TransactionTable({
  transactions,
  isLoading = false,
  emptyMessage = 'No transactions found',
  expandable = false,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField | null>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  /**
   * Group transactions by date
   */
  const dailyGroups = useMemo(() => {
    const groups = new Map<string, DailyTransactionGroup>()

    transactions.forEach((transaction) => {
      const date = transaction.date
      const existing = groups.get(date)

      // Get category or use unknown
      const category = transaction.category || UNKNOWN_CATEGORY

      if (existing) {
        // Add category if not already in list
        const categoryExists = existing.categories.some((c) => c.id === category.id)
        if (!categoryExists) {
          existing.categories.push({
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon || 'help-circle',
          })
        }

        // Update totals
        if (transaction.type === 'expense') {
          existing.totalSpend += transaction.amount
        } else {
          existing.totalReceive += transaction.amount
        }
        existing.netAmount = existing.totalReceive - existing.totalSpend
        existing.transactionCount += 1
        existing.transactions.push(transaction)
      } else {
        groups.set(date, {
          date,
          categories: [{
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon || 'help-circle',
          }],
          totalSpend: transaction.type === 'expense' ? transaction.amount : 0,
          totalReceive: transaction.type === 'income' ? transaction.amount : 0,
          netAmount: transaction.type === 'income' ? transaction.amount : -transaction.amount,
          transactionCount: 1,
          transactions: [transaction],
        })
      }
    })

    return Array.from(groups.values())
  }, [transactions])

  /**
   * Handle sort toggle
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  /**
   * Sort daily groups
   */
  const sortedGroups = useMemo(() => {
    if (!sortField) return dailyGroups

    return [...dailyGroups].sort((a, b) => {
      let comparison = 0

      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortField === 'spend') {
        comparison = a.totalSpend - b.totalSpend
      } else if (sortField === 'receive') {
        comparison = a.totalReceive - b.totalReceive
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [dailyGroups, sortField, sortDirection])

  /**
   * Calculate category breakdowns for a specific date
   */
  const getCategoryBreakdown = (date: string): CategorySpending[] => {
    const categoryMap = new Map<string, CategorySpending>()

    transactions
      .filter((t) => t.date === date)
      .forEach((transaction) => {
        const category = transaction.category || UNKNOWN_CATEGORY
        const existing = categoryMap.get(category.id)

        if (existing) {
          if (transaction.type === 'expense') {
            existing.totalSpend += transaction.amount
          } else {
            existing.totalReceive += transaction.amount
          }
          existing.transactionCount += 1
        } else {
          categoryMap.set(category.id, {
            categoryId: category.id,
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon || 'help-circle',
            totalSpend: transaction.type === 'expense' ? transaction.amount : 0,
            totalReceive: transaction.type === 'income' ? transaction.amount : 0,
            transactionCount: 1,
          })
        }
      })

    return Array.from(categoryMap.values()).sort((a, b) => b.totalSpend - a.totalSpend)
  }

  /**
   * Toggle row expansion
   */
  const toggleRowExpansion = (date: string) => {
    if (!expandable) return

    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd')
    } catch {
      return dateStr
    }
  }

  /**
   * Get weekday
   */
  const getWeekday = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE')
    } catch {
      return ''
    }
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  if (dailyGroups.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[500px]" role="table">
        <thead>
          <tr className="border-b border-border/40 text-xs">
            {expandable && (
              <th className="pb-2 w-8" aria-label="Expand row">
                {/* Empty header for expand icon column */}
              </th>
            )}
            <th className="pb-2 text-left w-24">
              <SortableHeader
                label="Date"
                field="date"
                currentSort={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className="pb-2 text-left font-medium text-muted-foreground">
              Categories
            </th>
            <th className="pb-2 text-right w-24">
              <SortableHeader
                label="Spend"
                field="spend"
                currentSort={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="justify-end"
              />
            </th>
            <th className="pb-2 text-right w-24">
              <SortableHeader
                label="Receive"
                field="receive"
                currentSort={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="justify-end"
              />
            </th>
            <th className="pb-2 text-right w-24 font-medium text-muted-foreground">
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedGroups.map((group, index) => {
            const isExpanded = expandedRows.has(group.date)
            const categoryBreakdown = expandable ? getCategoryBreakdown(group.date) : []

            return (
              <>
                {/* Main Row */}
                <motion.tr
                  key={group.date}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.2, delay: index * 0.02 }}
                  onClick={() => toggleRowExpansion(group.date)}
                  className={cn(
                    'border-b border-border/10 transition-all duration-200',
                    expandable && 'hover:bg-background/30 cursor-pointer',
                    isExpanded && 'bg-background/20'
                  )}
                >
                  {/* Expand Icon */}
                  {expandable && (
                    <td className="py-2.5 px-1">
                      <motion.div
                        initial={false}
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </td>
                  )}

                  {/* Date */}
                  <td className="py-2.5 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(group.date)}</span>
                      <span className="text-xs text-muted-foreground">{getWeekday(group.date)}</span>
                    </div>
                  </td>

                  {/* Categories */}
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                      {group.categories.slice(0, 3).map((category) => (
                        <CategoryBadge key={category.id} category={category} />
                      ))}
                      {group.categories.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{group.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Spend Amount */}
                  <td className="py-2.5 text-right">
                    {group.totalSpend > 0 ? (
                      <span className="text-sm font-medium text-destructive">
                        {formatCurrency(group.totalSpend)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Receive Amount */}
                  <td className="py-2.5 text-right">
                    {group.totalReceive > 0 ? (
                      <span className="text-sm font-medium text-success">
                        {formatCurrency(group.totalReceive)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Net Balance */}
                  <td className="py-2.5 text-right">
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        group.netAmount >= 0 ? 'text-success' : 'text-foreground'
                      )}
                    >
                      {formatCurrency(group.netAmount)}
                    </span>
                  </td>
                </motion.tr>

                {/* Expanded Category Breakdown */}
                {expandable && isExpanded && (
                  <motion.tr
                    key={`${group.date}-expanded`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td colSpan={expandable ? 6 : 5} className="p-0">
                      <div className="bg-background/40 backdrop-blur-sm border-t border-border/10">
                        <div className="px-6 py-3">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Category Breakdown
                          </div>
                          <div className="space-y-2">
                            {categoryBreakdown.map((cat, idx) => (
                              <motion.div
                                key={cat.categoryId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.2 }}
                                className="flex items-center justify-between rounded-md bg-background/60 backdrop-blur-sm px-3 py-2 border border-border/20 hover:border-border/40 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: cat.categoryColor }}
                                  />
                                  <span className="text-sm font-medium">{cat.categoryName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({cat.transactionCount} {cat.transactionCount === 1 ? 'transaction' : 'transactions'})
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  {cat.totalSpend > 0 && (
                                    <span className="text-sm font-medium text-destructive tabular-nums">
                                      -{formatCurrency(cat.totalSpend)}
                                    </span>
                                  )}
                                  {cat.totalReceive > 0 && (
                                    <span className="text-sm font-medium text-success tabular-nums">
                                      +{formatCurrency(cat.totalReceive)}
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
