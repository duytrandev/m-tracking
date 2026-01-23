/**
 * Table skeleton props
 */
interface TableSkeletonProps {
  rows?: number
}

/**
 * Loading skeleton for table
 * Shows animated placeholder rows while data loads
 */
export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
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
