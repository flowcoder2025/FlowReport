import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { WeeklyDashboard } from '@/components/dashboard/weekly'
import { MonthlyDashboard } from '@/components/dashboard/monthly'
import { Settings } from 'lucide-react'

interface WorkspaceDashboardProps {
  params: { workspaceId: string }
  searchParams: { tab?: string }
}

export default async function WorkspaceDashboard({
  params,
  searchParams,
}: WorkspaceDashboardProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Check membership
  const membership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: params.workspaceId,
      },
    },
    include: {
      workspace: true,
    },
  })

  if (!membership) {
    notFound()
  }

  const tab = searchParams.tab || 'weekly'

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{membership.workspace.name}</h1>
          <p className="text-muted-foreground">
            {membership.workspace.description || '대시보드'}
          </p>
        </div>
        <Link href={`/workspaces/${params.workspaceId}/settings`}>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">주간</TabsTrigger>
          <TabsTrigger value="monthly">월간</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <WeeklyDashboard workspaceId={params.workspaceId} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyDashboard workspaceId={params.workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
