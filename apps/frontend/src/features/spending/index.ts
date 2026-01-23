/**
 * Spending feature public API
 * 
 * Barrel export to prevent deep imports and establish clear feature boundaries.
 * Import from '@/features/spending' instead of deep paths
 */

// Hooks
export { useSpendingData } from './hooks/use-spending-data'
export { useTransactionsByDateRange, getDefaultDateRange } from './hooks/use-transactions-by-date'

// Components
export { TransactionTable } from './components/transaction-table/transaction-table'
export { SpendingChart } from './components/spending-chart'
export { CategoryBreakdownChart } from './components/category-breakdown'
export { DateRangePicker } from './components/date-range-picker'
export { TimeFilter } from './components/time-filter'
export { StatisticsCard } from './components/statistics-card'

// API (optional, if needed externally)
export { spendingApi } from './api/spending-api'
