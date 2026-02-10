'use client'

import { ReactNode, Suspense } from 'react'
import { ChannelProvider } from '@prisma/client'
import { DashboardProvider, DashboardView, PeriodType } from '@/lib/contexts/dashboard-context'
import { DashboardShell } from './layout'

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
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </DashboardProvider>
  )
}
