'use client'

import { useState, useMemo } from 'react'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardNotes, useDashboardTrendData, useWorkspaceTargets } from '@/lib/hooks/use-dashboard-data'
import { KPICardEnhanced, InsightCard, YouTubeDetailCard, HeadlineSummary } from '../../cards'
import { ChannelSummaryTable } from '../../tables'
import { HorizontalBarChart } from '../../charts'
import { HighlightBanner, InstagramCard, FacebookCard, StoreCard } from '../../channel-metrics'
import { ErrorState } from '@/components/common'
import { Skeleton } from '../../skeleton'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CHANNEL_COLORS, CHANNEL_LABELS } from '@/constants'

export function OverviewView() {
  const [isKpiExpanded, setIsKpiExpanded] = useState(false)
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

  // 목표값 데이터 가져오기
  const { data: targetsData } = useWorkspaceTargets(workspaceId)

  // 트렌드 데이터 (스파크라인용)
  const { data: trendData } = useDashboardTrendData(
    workspaceId,
    periodType,
    8,
    channelsParam
  )

  // 데이터 추출 (useMemo 의존성용)
  const overview = metrics?.overview
  const previous = metrics?.previous
  const channelDetails = metrics?.channelDetails

  // store traffic 데이터 추출
  const storeTraffic = metrics?.store?.traffic

  // 목표값 추출
  const targets = targetsData?.targetConfig

  // 스파크라인 데이터 구성
  const sparklines = useMemo(() => {
    const periods = trendData?.periods
    if (!periods || periods.length < 2) return {}
    return {
      revenue: periods.map((p) => ({ value: (p.revenue as number) ?? 0 })),
      reach: periods.map((p) => ({ value: (p.reach as number) ?? 0 })),
      engagement: periods.map((p) => ({ value: (p.engagement as number) ?? 0 })),
    }
  }, [trendData])

  // Primary KPIs (핵심 5개 - 항상 표시)
  // Note: 모든 useMemo는 early return 전에 호출되어야 함 (React Hooks 규칙)
  const primaryKpis = useMemo(() => [
    {
      title: '총 매출',
      value: overview?.totalRevenue ?? null,
      previousValue: previous?.totalRevenue ?? null,
      format: 'currency' as const,
      target: targets?.revenueTarget ?? null,
      trendData: sparklines.revenue,
    },
    {
      title: periodType === 'WEEKLY' ? 'WAU' : 'MAU',
      value: periodType === 'WEEKLY' ? overview?.wau : overview?.mau,
      previousValue: periodType === 'WEEKLY' ? previous?.wau : previous?.mau,
      target: periodType === 'WEEKLY' ? targets?.wauTarget : targets?.mauTarget,
    },
    {
      title: '총 도달',
      value: overview?.reach ?? null,
      previousValue: previous?.reach ?? null,
      target: targets?.reachTarget ?? null,
      trendData: sparklines.reach,
    },
    {
      title: '총 참여',
      value: overview?.engagement ?? null,
      previousValue: previous?.engagement ?? null,
      target: null, // engagementTarget은 비율(%)이므로 직접 비교 불가
      trendData: sparklines.engagement,
    },
    {
      title: '전환율',
      value: storeTraffic?.conversionRate ?? null,
      previousValue: storeTraffic?.previousConversionRate ?? null,
      format: 'percent' as const,
      target: targets?.conversionTarget ?? null,
    },
  ], [overview, previous, periodType, storeTraffic, targets, sparklines])

  // Secondary KPIs (확장 시 표시되는 4개)
  const secondaryKpis = useMemo(() => [
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
      title: '팔로워 순증',
      value: overview?.followers ?? null,
      previousValue: previous?.followers ?? null,
    },
    {
      title: '업로드 수',
      value: overview?.uploads ?? null,
      previousValue: previous?.uploads ?? null,
    },
  ], [overview, previous])

  // HeadlineSummary용 전체 KPI 배열
  const allKpis = useMemo(() => [...primaryKpis, ...secondaryKpis], [primaryKpis, secondaryKpis])

  // 채널별 매출 데이터
  const channelRevenueData = useMemo(() => {
    const data: Array<{ name: string; value: number; color: string }> = []
    if (channelDetails?.SMARTSTORE?.revenue) {
      data.push({ name: CHANNEL_LABELS.SMARTSTORE, value: channelDetails.SMARTSTORE.revenue, color: CHANNEL_COLORS.SMARTSTORE })
    }
    if (channelDetails?.COUPANG?.revenue) {
      data.push({ name: CHANNEL_LABELS.COUPANG, value: channelDetails.COUPANG.revenue, color: CHANNEL_COLORS.COUPANG })
    }
    return data
  }, [channelDetails])

  // Early returns - 모든 hooks 호출 이후에 배치
  if (metricsLoading || notesLoading) {
    return <OverviewSkeleton />
  }

  if (error) {
    return <ErrorState />
  }

  // 나머지 데이터 추출 (hooks 아님)
  const notes = notesData?.notes
  const highlights = metrics?.highlights
  const snsChannels = metrics?.sns?.channels || []

  // 데이터 없음 상태 확인
  const hasNoData =
    !overview?.totalRevenue &&
    !overview?.reach &&
    !overview?.engagement &&
    !channelDetails?.YOUTUBE &&
    !channelDetails?.META_INSTAGRAM &&
    !channelDetails?.SMARTSTORE &&
    !channelDetails?.COUPANG &&
    snsChannels.length === 0

  if (hasNoData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">데이터가 없습니다</h3>
          <p className="text-sm">
            채널을 연동하거나 CSV 데이터를 업로드하여 대시보드를 시작하세요.
          </p>
        </div>
        <a
          href="/settings/channels"
          className="text-sm text-primary hover:underline"
        >
          채널 연동하기 →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 하이라이트 배너 */}
      {highlights && highlights.length > 0 && (
        <HighlightBanner highlights={highlights} />
      )}

      {/* 헤드라인 요약 */}
      <HeadlineSummary
        metrics={allKpis.map(kpi => ({
          title: kpi.title,
          value: kpi.value ?? null,
          previousValue: kpi.previousValue ?? null,
          ...('format' in kpi && kpi.format ? { format: kpi.format } : {}),
        }))}
        periodType={periodType}
      />

      {/* KPI 카드 섹션 */}
      <div className="space-y-4">
        {/* Primary KPIs - 항상 표시 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {primaryKpis.map((kpi, index) => (
            <KPICardEnhanced
              key={`primary-${index}`}
              title={kpi.title}
              value={kpi.value ?? null}
              previousValue={kpi.previousValue ?? null}
              format={kpi.format}
              target={kpi.target}
              trendData={kpi.trendData}
            />
          ))}
        </div>

        {/* Secondary KPIs - 확장 시 표시 (애니메이션 적용) */}
        <div
          className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 overflow-hidden transition-all duration-300 ease-in-out ${
            isKpiExpanded
              ? 'max-h-[500px] opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          {secondaryKpis.map((kpi, index) => (
            <KPICardEnhanced
              key={`secondary-${index}`}
              title={kpi.title}
              value={kpi.value ?? null}
              previousValue={kpi.previousValue ?? null}
            />
          ))}
        </div>

        {/* 확장/축소 버튼 */}
        <button
          onClick={() => setIsKpiExpanded(!isKpiExpanded)}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 transition-colors duration-200"
        >
          {isKpiExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              더보기 (+4)
            </>
          )}
        </button>
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
        {channelDetails?.META_FACEBOOK && (
          <FacebookCard metrics={channelDetails.META_FACEBOOK} />
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
      {/* 헤드라인 요약 스켈레톤 */}
      <Skeleton className="h-[80px]" />
      {/* KPI 카드 스켈레톤 (기본 4개만 표시) */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
        {/* 확장 버튼 스켈레톤 */}
        <Skeleton className="h-[40px] w-full" />
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
