'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardNotes } from '@/lib/hooks/use-dashboard-data'
import { InsightCard } from '../../cards'
import { Skeleton } from '../../skeleton'
import { SalesKPISection } from './sales-kpi-section'
import { StoreComparison } from './store-comparison'
import { ProductRankingPlaceholder } from './product-ranking-placeholder'

/**
 * Commerce Dashboard View
 *
 * 커머스/판매팀용 대시보드 메인 뷰
 *
 * 구성:
 * 1. 매출 KPI 섹션 (첫 화면에 바로 표시)
 * 2. 스토어 비교 (전환 퍼널 + 채널별 매출 + 테이블)
 * 3. 상품 순위 (placeholder)
 * 4. 인사이트 카드 (목표/액션)
 */
export function CommerceDashboardView() {
  const { workspaceId, periodType, periodStart, selectedChannels } =
    useDashboardContext()

  const channelsParam =
    selectedChannels.length > 0 ? selectedChannels : undefined

  const {
    data: metrics,
    error,
    isLoading: metricsLoading,
  } = useDashboardMetrics(workspaceId, periodType, periodStart, channelsParam)

  const { data: notesData, isLoading: notesLoading } = useDashboardNotes(
    workspaceId,
    periodType,
    periodStart
  )

  // 로딩 상태
  if (metricsLoading || notesLoading) {
    return <CommerceDashboardSkeleton />
  }

  // 에러 상태
  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  // 데이터 추출
  const overview = metrics?.overview
  const previous = metrics?.previous
  const channelDetails = metrics?.channelDetails
  const traffic = metrics?.store?.traffic

  // KPI 계산
  const totalRevenue = overview?.totalRevenue || 0
  const smartstoreOrders = channelDetails?.SMARTSTORE?.orders || 0
  const coupangOrders = channelDetails?.COUPANG?.orders || 0
  const totalOrders = smartstoreOrders + coupangOrders

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const conversionRate = traffic?.conversionRate || 0

  // 이전 기간 KPI 계산
  const previousSmartOrders = channelDetails?.SMARTSTORE?.change?.orders
    ? smartstoreOrders / (1 + channelDetails.SMARTSTORE.change.orders / 100)
    : null
  const previousCoupangOrders = channelDetails?.COUPANG?.change?.orders
    ? coupangOrders / (1 + channelDetails.COUPANG.change.orders / 100)
    : null
  const previousOrders =
    previousSmartOrders !== null || previousCoupangOrders !== null
      ? (previousSmartOrders || 0) + (previousCoupangOrders || 0)
      : null

  const previousAov =
    previousOrders && previous?.totalRevenue
      ? previous.totalRevenue / previousOrders
      : null

  return (
    <div className="space-y-6">
      {/* 1. 매출 KPI 섹션 - 가장 먼저 표시 */}
      <SalesKPISection
        totalRevenue={totalRevenue}
        previousRevenue={previous?.totalRevenue ?? null}
        totalOrders={totalOrders}
        previousOrders={previousOrders}
        avgOrderValue={avgOrderValue}
        previousAov={previousAov}
        conversionRate={conversionRate}
        previousConversionRate={traffic?.previousConversionRate ?? null}
      />

      {/* 2. 스토어 비교 섹션 */}
      <StoreComparison
        smartstoreMetrics={channelDetails?.SMARTSTORE}
        coupangMetrics={channelDetails?.COUPANG}
        trafficData={traffic}
      />

      {/* 3. 상품 순위 & 인사이트 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProductRankingPlaceholder title="상품 판매 순위 (TOP 5)" />

        <div className="space-y-4">
          <InsightCard
            title="익월 목표"
            items={
              notesData?.notes?.bestPractices?.slice(0, 3) || [
                '목표를 설정해주세요',
              ]
            }
          />
          <InsightCard
            title="차주 액션 아이템"
            items={notesData?.actions?.map((a) => a.title).slice(0, 3) || []}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Commerce Dashboard Skeleton
 *
 * 로딩 중 표시되는 스켈레톤 UI
 */
function CommerceDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>

      {/* Table Skeleton */}
      <Skeleton className="h-[200px]" />

      {/* Bottom Section Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[250px]" />
        <div className="space-y-4">
          <Skeleton className="h-[115px]" />
          <Skeleton className="h-[115px]" />
        </div>
      </div>
    </div>
  )
}
