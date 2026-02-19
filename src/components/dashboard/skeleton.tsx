import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  )
}

/**
 * Dashboard layout skeleton for use as a Suspense fallback.
 * Renders placeholder shapes matching the typical dashboard layout:
 * top nav bar, filter bar, KPI cards grid, and content cards.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Top nav skeleton */}
      <Skeleton className="h-10 w-full" />
      {/* Filter bar skeleton */}
      <Skeleton className="h-9 w-full" />
      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`kpi-${i}`} className="h-[100px]" />
        ))}
      </div>
      {/* Content cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[250px]" />
        <Skeleton className="h-[250px]" />
      </div>
      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`bottom-${i}`} className="h-[180px]" />
        ))}
      </div>
    </div>
  )
}
