interface ChartSkeletonProps {
  height?: number
}

/**
 * Loading skeleton for chart components
 * Displayed while chart libraries are being dynamically imported
 */
export function ChartSkeleton({ height = 300 }: ChartSkeletonProps) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-muted/20"
      style={{ height: `${height}px` }}
      aria-label="Loading chart..."
      role="status"
    >
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading chart...</div>
      </div>
    </div>
  )
}
