'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from './overview-tab'
import { SNSTab } from './sns-tab'
import { StoreTab } from './store-tab'
import { NotesTab } from './notes-tab'

interface WeeklyDashboardProps {
  workspaceId: string
}

export function WeeklyDashboard({ workspaceId }: WeeklyDashboardProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sns">SNS</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="sns">
          <SNSTab workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="store">
          <StoreTab workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
