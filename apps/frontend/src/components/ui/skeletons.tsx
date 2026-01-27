/**
 * Reusable skeleton components for Suspense fallbacks
 * Use these with <Suspense> boundaries for granular loading states
 */

/**
 * Dashboard skeleton - for main dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-card/40" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-card/30" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-card/40" />
      </div>

      {/* Statistics cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-card/40 backdrop-blur-xl"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* Charts section skeleton */}
      <div className="rounded-lg border border-border/40 bg-card/40 backdrop-blur-xl p-4">
        <div className="h-6 w-24 animate-pulse rounded-lg bg-background/50 mb-4" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[300px] animate-pulse rounded-lg bg-background/50" />
          <div className="h-[300px] animate-pulse rounded-lg bg-background/50" />
        </div>
      </div>
    </div>
  )
}

/**
 * Statistics cards skeleton - for just the cards section
 */
export function StatisticsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg bg-card/40 backdrop-blur-xl"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}

/**
 * Chart skeleton - for individual charts
 */
export function ChartSectionSkeleton() {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 backdrop-blur-xl p-4">
      <div className="h-6 w-24 animate-pulse rounded-lg bg-background/50 mb-4" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[300px] animate-pulse rounded-lg bg-background/50" />
        <div className="h-[300px] animate-pulse rounded-lg bg-background/50" />
      </div>
    </div>
  )
}

/**
 * Transaction table skeleton
 */
export function TransactionTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg bg-card/40"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  )
}

/**
 * Settings form skeleton
 */
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/40 bg-card/40 backdrop-blur-xl p-6">
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-background/50" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-background/50" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-background/50" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-primary/20" />
        </div>
      </div>
    </div>
  )
}

/**
 * Page header skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-card/40" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-card/30" />
      </div>
    </div>
  )
}

/**
 * Generic content skeleton
 */
export function ContentSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg bg-card/40"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}
