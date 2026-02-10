'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardNotes } from '@/lib/hooks/use-dashboard-data'
import { KPICardEnhanced, InsightCard, YouTubeDetailCard } from '../../cards'
import { ChannelSummaryTable } from '../../tables'
import { HorizontalBarChart } from '../../charts'
import { HighlightBanner, InstagramCard, StoreCard } from '../../channel-metrics'
import { Skeleton } from '../../skeleton'

export function OverviewView() {
  const { workspaceId, periodType, periodStart, selectedChannels } = useDashboardContext()

  const channelsParam = selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading: metricsLoading } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    channelsParam
  )

  const { data: notesData, isLoading: notesLoading } = useDashboardNotes(
    workspaceId,
    periodType,
    periodStart
  )

  if (metricsLoading || notesLoading) {
    return <OverviewSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const overview = metrics?.overview
  const previous = metrics?.previous
  const notes = notesData?.notes
  const channelDetails = metrics?.channelDetails
  const highlights = metrics?.highlights
  const snsChannels = metrics?.sns?.channels || []

  // 8개 KPI
  const kpis = [
    {
      title: '총 매출',
      value: overview?.totalRevenue ?? null,
      previousValue: previous?.totalRevenue ?? null,
      format: 'currency' as const,
    },
    {
      title: periodType === 'WEEKLY' ? 'WAU' : 'MAU',
      value: periodType === 'WEEKLY' ? overview?.wau : overview?.mau,
      previousValue: periodType === 'WEEKLY' ? previous?.wau : previous?.mau,
    },
    {
      title: 'DAU',
      value: overview?.dau ?? null,
      previousValue: previous?.dau ?? null,
    },
    {
      title: '회원가입',
      value: overview?.signups ?? null,
      previousValue: previous?.signups ?? null,
    },
    {
      title: '총 도달',
      value: overview?.reach ?? null,
      previousValue: previous?.reach ?? null,
    },
    {
      title: '총 참여',
      value: overview?.engagement ?? null,
      previousValue: previous?.engagement ?? null,
    },
    {
      title: '팔로워 순증',
      value: overview?.followers ?? null,
      previousValue: previous?.followers ?? null,
    },
    {
      title: '업로드 수',
      value: overview?.uploads ?? null,
      previousValue: previous?.uploads ?? null,
    },
  ]

  // 채널별 매출 데이터
  const channelRevenueData = []
  if (channelDetails?.SMARTSTORE?.revenue) {
    channelRevenueData.push({ name: '스마트스토어', value: channelDetails.SMARTSTORE.revenue, color: '#22c55e' })
  }
  if (channelDetails?.COUPANG?.revenue) {
    channelRevenueData.push({ name: '쿠팡', value: channelDetails.COUPANG.revenue, color: '#3b82f6' })
  }

  return (
    <div className="space-y-6">
      {/* 하이라이트 배너 */}
      {highlights && highlights.length > 0 && (
        <HighlightBanner highlights={highlights} />
      )}

      {/* KPI 카드 8개 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICardEnhanced
            key={index}
            title={kpi.title}
            value={kpi.value ?? null}
            previousValue={kpi.previousValue ?? null}
            format={kpi.format}
          />
        ))}
      </div>

      {/* 채널 상세 카드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {channelDetails?.YOUTUBE && (
          <YouTubeDetailCard
            metrics={channelDetails.YOUTUBE}
            defaultExpanded={false}
          />
        )}
        {channelDetails?.META_INSTAGRAM && (
          <InstagramCard metrics={channelDetails.META_INSTAGRAM} />
        )}
        {channelDetails?.SMARTSTORE && (
          <StoreCard metrics={channelDetails.SMARTSTORE} name="스마트스토어" />
        )}
        {channelDetails?.COUPANG && (
          <StoreCard metrics={channelDetails.COUPANG} name="쿠팡" />
        )}
      </div>

      {/* 채널별 요약 테이블 (축약) */}
      {snsChannels.length > 0 && (
        <ChannelSummaryTable
          title="채널별 요약"
          channels={snsChannels}
          compact={true}
        />
      )}

      {/* 채널별 매출 차트 */}
      {channelRevenueData.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">채널별 매출</h3>
          <HorizontalBarChart data={channelRevenueData} height={120} />
        </div>
      )}

      {/* 인사이트 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard
          title="원인 Top 3"
          items={notes?.causes?.slice(0, 3) || []}
        />
        <InsightCard
          title="개선 Top 3"
          items={notes?.improvements?.slice(0, 3) || []}
        />
        <InsightCard
          title="차주 반영사항"
          items={notesData?.actions?.slice(0, 3).map(a => a.title) || []}
        />
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
      <Skeleton className="h-[200px]" />
      <Skeleton className="h-[150px]" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[150px]" />
        ))}
      </div>
    </div>
  )
}
