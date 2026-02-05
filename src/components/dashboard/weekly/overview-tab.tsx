'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '../kpi-card'
import { useDashboardMetrics, useDashboardNotes } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../skeleton'

interface OverviewTabProps {
  workspaceId: string
  periodStart: Date
}

export function OverviewTab({ workspaceId, periodStart }: OverviewTabProps) {
  const { data: metrics, error: metricsError, isLoading: metricsLoading } = useDashboardMetrics(
    workspaceId,
    'WEEKLY',
    periodStart
  )

  const { data: notesData, isLoading: notesLoading } = useDashboardNotes(
    workspaceId,
    'WEEKLY',
    periodStart
  )

  if (metricsLoading || notesLoading) {
    return <OverviewSkeleton />
  }

  if (metricsError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const overview = metrics?.overview
  const previous = metrics?.previous
  const notes = notesData?.notes

  const kpis = [
    {
      title: '총 매출',
      value: overview?.totalRevenue ?? null,
      previousValue: previous?.totalRevenue ?? null,
      format: 'currency' as const,
    },
    { title: 'DAU', value: overview?.dau ?? null, previousValue: previous?.dau ?? null },
    { title: 'WAU', value: overview?.wau ?? null, previousValue: previous?.wau ?? null },
    { title: '회원가입', value: overview?.signups ?? null, previousValue: previous?.signups ?? null },
    { title: '총 도달', value: overview?.reach ?? null, previousValue: previous?.reach ?? null },
    { title: '총 상호작용', value: overview?.engagement ?? null, previousValue: previous?.engagement ?? null },
    { title: '팔로워 순증', value: overview?.followers ?? null, previousValue: previous?.followers ?? null },
    { title: '업로드 수', value: overview?.uploads ?? null, previousValue: previous?.uploads ?? null },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            format={kpi.format}
          />
        ))}
      </div>

      {/* Insights Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">원인 Top 3</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(notes?.causes?.length ?? 0) > 0 ? (
                notes!.causes.slice(0, 3).map((cause, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>{cause}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">아직 등록된 원인이 없습니다.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">개선 Top 3</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(notes?.improvements?.length ?? 0) > 0 ? (
                notes!.improvements.slice(0, 3).map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>{improvement}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">아직 등록된 개선사항이 없습니다.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">차주 반영사항</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(notesData?.actions?.length ?? 0) > 0 ? (
                notesData!.actions.slice(0, 3).map((action) => (
                  <li key={action.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={action.status === 'COMPLETED'}
                      readOnly
                    />
                    <span>{action.title}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">아직 등록된 액션 아이템이 없습니다.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    </div>
  )
}
