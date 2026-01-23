# Manual Suspense Boundaries Pattern Guide

This guide explains how to use manual `<Suspense>` boundaries instead of automatic `loading.tsx` files in Next.js App Router.

## Table of Contents
- [Why Manual Suspense?](#why-manual-suspense)
- [Pattern Overview](#pattern-overview)
- [Implementation](#implementation)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Why Manual Suspense?

### Benefits over `loading.tsx`
✅ **Granular control** - Different sections load independently  
✅ **Avoid full-page loading** - Only parts that need data show skeletons  
✅ **Better UX** - Static content (headers, navigation) appears immediately  
✅ **Flexibility** - Mix Suspense with client-side loading states  
✅ **Composition** - Reusable loading components across pages

### When to Use Each Approach

| Approach | Use When |
|----------|----------|
| **loading.tsx** | - Simple pages with single data source<br>- Want automatic behavior<br>- Entire page needs loading state |
| **Manual Suspense** | - Complex pages with multiple data sources<br>- Want partial page loading<br>- Need different loading states per section |

## Pattern Overview

### Architecture

```
app/
├── dashboard/
│   ├── page.tsx              # Main page with Suspense boundaries
│   └── _components/          # Feature components
│       ├── dashboard-stats.tsx
│       └── dashboard-charts.tsx
src/
└── components/
    └── ui/
        └── skeletons.tsx     # Reusable skeleton components
```

### Flow Diagram

```
Page Load
    ↓
Static Content Renders Immediately (header, nav)
    ↓
Suspense Boundary Shows Fallback (skeleton)
    ↓
Data Fetches
    ↓
Component Replaces Fallback
```

## Implementation

### 1. Create Reusable Skeletons

**File:** `src/components/ui/skeletons.tsx`

```tsx
export function StatisticsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg bg-card/40"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}

export function ChartSectionSkeleton() {
  return (
    <div className="h-[300px] animate-pulse rounded-lg bg-background/50" />
  )
}
```

### 2. Create Feature Components

**File:** `app/dashboard/_components/dashboard-stats.tsx`

```tsx
'use client'

import { useSpendingData } from '@/features/spending/hooks/use-spending-data'

export function DashboardStats({ period }: { period: TimePeriod }) {
  const { summary, isLoading } = useSpendingData(period)
  
  // Component handles its own loading state
  if (isLoading) {
    return <StatisticsCardsSkeleton />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Your stats cards */}
    </div>
  )
}
```

### 3. Wrap with Suspense in Page

**File:** `app/dashboard/page.tsx`

```tsx
'use client'

import { Suspense } from 'react'
import { DashboardStats } from './_components/dashboard-stats'
import { StatisticsCardsSkeleton } from '@/components/ui/skeletons'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Static content - renders immediately */}
      <header>
        <h1>Dashboard</h1>
      </header>

      {/* Dynamic content - wrapped in Suspense */}
      <Suspense fallback={<StatisticsCardsSkeleton />}>
        <DashboardStats period={period} />
      </Suspense>

      {/* Another independent section */}
      <Suspense fallback={<ChartSectionSkeleton />}>
        <DashboardCharts period={period} />
      </Suspense>
    </div>
  )
}
```

## Examples

### Example 1: Dashboard with Multiple Sections

```tsx
export default function DashboardPage() {
  const [period, setPeriod] = useState(TimePeriod.MONTH)

  return (
    <div className="space-y-6">
      {/* Header - no loading state needed */}
      <div className="flex justify-between">
        <h1>Dashboard</h1>
        <TimeFilter value={period} onChange={setPeriod} />
      </div>

      {/* Stats load independently */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats period={period} />
      </Suspense>

      {/* Charts load independently */}
      <Suspense fallback={<ChartSkeleton />}>
        <DashboardCharts period={period} />
      </Suspense>
    </div>
  )
}
```

**Result:** Header and filter appear immediately, stats and charts show skeletons until data loads.

### Example 2: Nested Suspense Boundaries

```tsx
export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <h1>Transactions</h1>

      {/* Outer Suspense for filters */}
      <Suspense fallback={<FiltersSkeleton />}>
        <TransactionFilters>
          {/* Inner Suspense for table */}
          <Suspense fallback={<TableSkeleton />}>
            <TransactionTable />
          </Suspense>
        </TransactionFilters>
      </Suspense>
    </div>
  )
}
```

### Example 3: Conditional Suspense

```tsx
export default function SettingsPage() {
  const [tab, setTab] = useState('profile')

  return (
    <div className="space-y-6">
      <Tabs value={tab} onChange={setTab} />

      {/* Only wrap dynamic content in Suspense */}
      {tab === 'profile' && (
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileSettings />
        </Suspense>
      )}

      {tab === 'security' && (
        <Suspense fallback={<SecuritySkeleton />}>
          <SecuritySettings />
        </Suspense>
      )}
    </div>
  )
}
```

## Best Practices

### ✅ Do

1. **Wrap only data-fetching components**
   ```tsx
   <Suspense fallback={<Skeleton />}>
     <DataComponent /> {/* Fetches data */}
   </Suspense>
   ```

2. **Keep static content outside Suspense**
   ```tsx
   <div>
     <h1>Title</h1> {/* Static, no Suspense */}
     <Suspense fallback={<Skeleton />}>
       <DataComponent />
     </Suspense>
   </div>
   ```

3. **Use multiple boundaries for independence**
   ```tsx
   <Suspense fallback={<StatsSkeleton />}>
     <Stats />
   </Suspense>
   <Suspense fallback={<ChartSkeleton />}>
     <Chart />
   </Suspense>
   ```

4. **Match skeleton to actual content**
   - Same height/spacing
   - Same number of elements
   - Similar visual structure

### ❌ Don't

1. **Don't wrap entire pages unnecessarily**
   ```tsx
   {/* ❌ Bad - everything waits for all data */}
   <Suspense fallback={<FullPageSkeleton />}>
     <Header />
     <Stats />
     <Charts />
   </Suspense>
   ```

2. **Don't nest too deeply**
   ```tsx
   {/* ❌ Bad - too many levels */}
   <Suspense>
     <Suspense>
       <Suspense>
         <Component />
       </Suspense>
     </Suspense>
   </Suspense>
   ```

3. **Don't use Suspense for client-only interactions**
   ```tsx
   {/* ❌ Bad - modal doesn't need Suspense */}
   <Suspense fallback={<ModalSkeleton />}>
     <Modal open={isOpen} />
   </Suspense>
   ```

## Combining with React Query

Suspense works great with React Query's suspense mode:

```tsx
// Enable suspense in query
const { data } = useQuery({
  queryKey: ['spending', period],
  queryFn: () => api.getSpending(period),
  suspense: true, // Enable Suspense mode
})

// No need for isLoading check
return <div>{data.total}</div>
```

Then in the page:
```tsx
<Suspense fallback={<Skeleton />}>
  <SpendingComponent /> {/* Uses suspense query */}
</Suspense>
```

## Migration Path

### From `loading.tsx` to Manual Suspense

1. **Identify sections** that load independently
2. **Extract components** for each section
3. **Create matching skeletons** for each component
4. **Wrap in Suspense** at the page level
5. **Remove `loading.tsx`** file

### Keeping Both Approaches

You can mix both patterns:
- Use `loading.tsx` for route-level navigation loading
- Use manual Suspense for section-level granular loading

## Performance Considerations

### Bundle Size
- Manual Suspense adds ~2KB for React imports
- Saves code by reusing skeletons across pages

### Loading Experience
```
loading.tsx:     [========= Full Page Loading =========]
Manual Suspense: [Header Ready][====Stats====][===Charts===]
```

### When Data is Fast (<100ms)
- Suspense fallback might cause "flash"
- Consider using React Query's `placeholderData` instead
- Or set a minimum delay for smooth transitions

## Troubleshooting

### Fallback Flashing
**Problem:** Skeleton flashes briefly even when data is cached.

**Solution:** Use `placeholderData` or `staleTime` in React Query:
```tsx
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 5000, // Consider fresh for 5s
})
```

### Infinite Loading
**Problem:** Suspense boundary shows fallback forever.

**Solution:** Check that component eventually resolves:
- Verify API calls complete
- Check for errors in component
- Ensure `isLoading` becomes false

### Layout Shift
**Problem:** Content jumps when skeleton is replaced.

**Solution:** Match skeleton dimensions exactly:
```tsx
// Skeleton should match final content height
<div className="h-[300px]"> {/* Exact height */}
  <Skeleton />
</div>
```

## Files Created

- `src/components/ui/skeletons.tsx` - Reusable skeleton components
- `src/components/layout/suspense-wrapper.tsx` - Helper wrapper (optional)
- `app/dashboard/_components/dashboard-stats.tsx` - Stats section
- `app/dashboard/_components/dashboard-charts.tsx` - Charts section

## Further Reading

- [Next.js Suspense Documentation](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Suspense Guide](https://react.dev/reference/react/Suspense)
- [TanStack Query Suspense](https://tanstack.com/query/latest/docs/react/guides/suspense)

---

**Summary:** Manual Suspense boundaries give you fine-grained control over loading states, allowing different parts of your page to load independently for better perceived performance.
