'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICardEnhanced as KPICard } from '../cards'
import { ErrorState } from '@/components/common'
import { useDashboardMetrics, useDashboardNotes } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../skeleton'
import { CheckCircle, Circle } from 'lucide-react'
import {
  HighlightBanner,
  YouTubeCard,
  InstagramCard,
  StoreCard,
} from '../channel-metrics'

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
    return <ErrorState />
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

  const channelDetails = metrics?.channelDetails
  const highlights = metrics?.highlights

  return (
    <div className="space-y-6">
      {/* Highlight Banner */}
      {highlights && highlights.length > 0 && (
        <HighlightBanner highlights={highlights} />
      )}

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

      {/* Channel Metrics Cards */}
      {channelDetails && (
        <div className="grid gap-6 lg:grid-cols-2">
          {channelDetails.YOUTUBE && (
            <YouTubeCard metrics={channelDetails.YOUTUBE} />
          )}
          {channelDetails.META_INSTAGRAM && (
            <InstagramCard metrics={channelDetails.META_INSTAGRAM} />
          )}
        </div>
      )}

      {/* Store Cards */}
      {channelDetails && (channelDetails.SMARTSTORE || channelDetails.COUPANG) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {channelDetails.SMARTSTORE && (
            <StoreCard metrics={channelDetails.SMARTSTORE} name="스마트스토어" />
          )}
          {channelDetails.COUPANG && (
            <StoreCard metrics={channelDetails.COUPANG} name="쿠팡" />
          )}
        </div>
      )}

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
                    {action.status === 'COMPLETED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
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
