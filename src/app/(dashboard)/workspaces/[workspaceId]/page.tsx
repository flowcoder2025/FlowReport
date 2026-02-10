import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { startOfWeek, startOfMonth, parseISO } from 'date-fns'
import { ChannelProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardView, PeriodType } from '@/lib/contexts/dashboard-context'
import { DashboardViewRenderer } from '@/components/dashboard/dashboard-view-renderer'
import { Settings } from 'lucide-react'

interface WorkspaceDashboardProps {
  params: { workspaceId: string }
  searchParams: {
    view?: string
    period?: string
    date?: string
    channels?: string
  }
}

export default async function WorkspaceDashboard({
  params,
  searchParams,
}: WorkspaceDashboardProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

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

  const view = (searchParams.view as DashboardView) || 'overview'
  const period = (searchParams.period?.toUpperCase() as PeriodType) || 'WEEKLY'
  const date = searchParams.date
    ? parseISO(searchParams.date)
    : period === 'WEEKLY'
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date())
  const channels = searchParams.channels
    ? (searchParams.channels.split(',') as ChannelProvider[])
    : []

  return (
    <DashboardLayout
      workspaceId={params.workspaceId}
      initialView={view}
      initialPeriodType={period}
      initialPeriodStart={date}
      initialChannels={channels}
    >
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

      <DashboardViewRenderer />
    </DashboardLayout>
  )
}
