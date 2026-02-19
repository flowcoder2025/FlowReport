'use client'

import { ReactNode, Suspense } from 'react'
import { ChannelProvider } from '@prisma/client'
import { DashboardProvider, DashboardView, PeriodType } from '@/lib/contexts/dashboard-context'
import { DashboardShell } from './layout'
import { Skeleton } from './skeleton'

interface DashboardLayoutProps {
  workspaceId: string
  children: ReactNode
  initialView?: DashboardView
  initialPeriodType?: PeriodType
  initialPeriodStart?: Date
  initialChannels?: ChannelProvider[]
}

export function DashboardLayout({
  workspaceId,
  children,
  initialView,
  initialPeriodType,
  initialPeriodStart,
  initialChannels,
}: DashboardLayoutProps) {
  return (
    <DashboardProvider
      workspaceId={workspaceId}
      initialView={initialView}
      initialPeriodType={initialPeriodType}
      initialPeriodStart={initialPeriodStart}
      initialChannels={initialChannels}
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </DashboardProvider>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Nav skeleton */}
      <Skeleton className="h-10 w-full" />
      {/* KPI row skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      {/* Chart area skeleton */}
      <Skeleton className="h-[300px]" />
      {/* Table skeleton */}
      <Skeleton className="h-[200px]" />
    </div>
  )
}
