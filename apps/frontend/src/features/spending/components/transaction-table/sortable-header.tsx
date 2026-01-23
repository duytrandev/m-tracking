import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Sort configuration types
 */
export type SortField = 'date' | 'spend' | 'receive'
export type SortDirection = 'asc' | 'desc'

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
 * Displays a clickable header with sort indicators
 */
export function SortableHeader({
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
