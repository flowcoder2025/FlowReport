'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardTrendData } from '@/lib/hooks/use-dashboard-data'
import { YouTubeDetailCard, ChannelDetailCard } from '../../cards'
import { ChannelSummaryTable } from '../../tables'
import { TrendLineChart } from '../../charts'
import { InstagramCard, StoreCard } from '../../channel-metrics'
import { Skeleton } from '../../skeleton'

export function PerformanceView() {
  const { workspaceId, periodType, periodStart, selectedChannels } = useDashboardContext()

  const channelsParam = selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    channelsParam
  )

  const { data: trendData, isLoading: trendLoading } = useDashboardTrendData(
    workspaceId,
    periodType,
    8,
    channelsParam
  )

  if (isLoading || trendLoading) {
    return <PerformanceSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const channelDetails = metrics?.channelDetails
  const snsChannels = metrics?.sns?.channels || []
  const storeChannels = metrics?.store?.channels || []
  const allChannels = [...snsChannels, ...storeChannels]
  const periods = trendData?.periods || []

  return (
    <div className="space-y-6">
      {/* 채널별 요약 테이블 (전체) */}
      {allChannels.length > 0 && (
        <ChannelSummaryTable
          title="채널별 성과 요약"
          channels={allChannels}
          compact={false}
        />
      )}

      {/* 시계열 차트 */}
      {periods.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">
            {periodType === 'WEEKLY' ? '8주' : '8개월'} 추이
          </h3>
          <TrendLineChart
            data={periods}
            lines={[
              { dataKey: 'revenue', name: '매출', color: '#3b82f6' },
              { dataKey: 'reach', name: '도달', color: '#22c55e' },
              { dataKey: 'engagement', name: '참여', color: '#f59e0b' },
            ]}
            height={300}
          />
        </div>
      )}

      {/* 채널 상세 카드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* YouTube 확장형 카드 */}
        {channelDetails?.YOUTUBE && (
          <YouTubeDetailCard
            metrics={channelDetails.YOUTUBE}
            defaultExpanded={true}
          />
        )}

        {/* Instagram 카드 */}
        {channelDetails?.META_INSTAGRAM && (
          <InstagramCard metrics={channelDetails.META_INSTAGRAM} />
        )}

        {/* 스토어 카드들 */}
        {channelDetails?.SMARTSTORE && (
          <StoreCard metrics={channelDetails.SMARTSTORE} name="스마트스토어" />
        )}

        {channelDetails?.COUPANG && (
          <StoreCard metrics={channelDetails.COUPANG} name="쿠팡" />
        )}
      </div>
    </div>
  )
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[250px]" />
      <Skeleton className="h-[350px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
    </div>
  )
}
