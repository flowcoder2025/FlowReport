'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PeriodSelector } from '../period-selector'
import { OverviewTab } from './overview-tab'
import { SNSTab } from './sns-tab'
import { StoreTab } from './store-tab'
import { NotesTab } from './notes-tab'

interface WeeklyDashboardProps {
  workspaceId: string
}

export function WeeklyDashboard({ workspaceId }: WeeklyDashboardProps) {
  const [periodStart, setPeriodStart] = useState(() => new Date())

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">주간 리포트</h2>
        <PeriodSelector
          periodType="WEEKLY"
          periodStart={periodStart}
          onPeriodChange={setPeriodStart}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sns">SNS</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab workspaceId={workspaceId} periodStart={periodStart} />
        </TabsContent>

        <TabsContent value="sns">
          <SNSTab workspaceId={workspaceId} periodStart={periodStart} />
        </TabsContent>

        <TabsContent value="store">
          <StoreTab workspaceId={workspaceId} periodStart={periodStart} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab workspaceId={workspaceId} periodStart={periodStart} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
