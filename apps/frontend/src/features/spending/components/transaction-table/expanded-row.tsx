import { motion } from 'motion/react'

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
 * Expanded row props
 */
interface ExpandedRowProps {
  categoryBreakdown: CategorySpending[]
  expandable: boolean
  formatCurrency: (amount: number) => string
}

/**
 * Expanded category breakdown row
 * Shows detailed category spending for a specific day
 */
export function ExpandedRow({
  categoryBreakdown,
  expandable,
  formatCurrency,
}: ExpandedRowProps) {
  return (
    <motion.tr
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
                    <span className="text-sm font-medium">
                      {cat.categoryName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({cat.transactionCount}{' '}
                      {cat.transactionCount === 1
                        ? 'transaction'
                        : 'transactions'}
                      )
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
  )
}
