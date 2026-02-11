'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardTrendData } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../../skeleton'
import { BlogKPICards } from './blog-kpi-cards'
import { TrafficSourceChart } from './traffic-source-chart'
import { BlogTrendChart } from './blog-trend-chart'
import type { BlogMetricsData, TrafficSourceData, TrendDataPoint } from './types'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function BlogView() {
  const { workspaceId, periodType, periodStart } = useDashboardContext()

  // NAVER_BLOG 채널만 필터링하여 데이터 조회
  const { data: metrics, error, isLoading } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    ['NAVER_BLOG']
  )

  // 트렌드 데이터 (8개 기간)
  const { data: trendData } = useDashboardTrendData(
    workspaceId,
    periodType,
    8,
    ['NAVER_BLOG']
  )

  if (isLoading) {
    return <BlogViewSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  // 블로그 메트릭 추출
  const blogMetrics = extractBlogMetrics(metrics)
  const prevBlogMetrics = extractPrevBlogMetrics(metrics)
  const trafficSourceData = extractTrafficSourceData(blogMetrics)
  const trendChartData = buildTrendChartData(trendData)

  return (
    <div className="space-y-6">
      {/* 대시보드 헤더 */}
      <div className="flex items-center gap-3 pb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Blog Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            블로그 트래픽 및 성장 분석
          </p>
        </div>
      </div>

      {/* KPI 카드 섹션 */}
      <BlogKPICards current={blogMetrics} previous={prevBlogMetrics} />

      {/* 차트 섹션 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 유입 경로 분석 (Pie Chart) */}
        <TrafficSourceChart data={trafficSourceData} />

        {/* 트렌드 차트 (Line Chart) */}
        <BlogTrendChart
          data={trendChartData}
          title={periodType === 'WEEKLY' ? '최근 8주 트렌드' : '최근 8개월 트렌드'}
        />
      </div>

      {/* 추가 정보 카드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 참여 상세 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">참여 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MetricRow label="댓글" value={blogMetrics?.comments} />
              <MetricRow label="좋아요" value={blogMetrics?.likes} />
              <MetricRow label="공유" value={blogMetrics?.shares} />
              <MetricRow label="페이지뷰" value={blogMetrics?.pageviews} />
            </div>
          </CardContent>
        </Card>

        {/* 콘텐츠 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">콘텐츠 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MetricRow
                label="신규 구독자"
                value={blogMetrics?.newSubscribers}
                suffix="명"
              />
              <MetricRow
                label="검색 유입"
                value={blogMetrics?.searchVisitors}
                suffix="명"
              />
              <MetricRow
                label="직접 유입"
                value={blogMetrics?.directVisitors}
                suffix="명"
              />
              <MetricRow
                label="소셜 유입"
                value={blogMetrics?.socialVisitors}
                suffix="명"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 메트릭 행 컴포넌트
function MetricRow({
  label,
  value,
  suffix = '',
}: {
  label: string
  value: number | null | undefined
  suffix?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {value !== null && value !== undefined
          ? `${value.toLocaleString()}${suffix}`
          : 'N/A'}
      </span>
    </div>
  )
}

// 블로그 메트릭 추출 함수
function extractBlogMetrics(
  metrics: { sns?: { channels?: Array<{ channel: string; data: Record<string, number | null> }> } } | undefined
): BlogMetricsData | null {
  if (!metrics?.sns?.channels) return null

  const blogChannel = metrics.sns.channels.find(
    (ch) => ch.channel === 'NAVER_BLOG'
  )

  if (!blogChannel) return null

  const data = blogChannel.data

  return {
    visitors: data.visitors ?? null,
    pageviews: data.pageviews ?? null,
    subscribers: data.subscribers ?? null,
    newSubscribers: data.newSubscribers ?? null,
    comments: data.comments ?? null,
    likes: data.likes ?? null,
    shares: data.shares ?? null,
    searchVisitors: data.searchVisitors ?? null,
    directVisitors: data.directVisitors ?? null,
    socialVisitors: data.socialVisitors ?? null,
    referralVisitors: data.referralVisitors ?? null,
  }
}

function extractPrevBlogMetrics(
  metrics: { sns?: { channels?: Array<{ channel: string; change: Record<string, number | null>; data: Record<string, number | null> }> } } | undefined
): BlogMetricsData | null {
  if (!metrics?.sns?.channels) return null

  const blogChannel = metrics.sns.channels.find(
    (ch) => ch.channel === 'NAVER_BLOG'
  )

  if (!blogChannel) return null

  // 현재 데이터와 변화율로 이전 데이터 역산
  const data = blogChannel.data
  const change = blogChannel.change

  const calculatePrevValue = (
    current: number | null | undefined,
    changePercent: number | null | undefined
  ): number | null => {
    if (current === null || current === undefined) return null
    if (changePercent === null || changePercent === undefined) return null
    if (changePercent === 0) return current
    // current = prev * (1 + change/100)
    // prev = current / (1 + change/100)
    return Math.round(current / (1 + changePercent / 100))
  }

  return {
    visitors: calculatePrevValue(data.visitors, change.visitors),
    pageviews: calculatePrevValue(data.pageviews, change.pageviews),
    subscribers: calculatePrevValue(data.subscribers, change.subscribers),
    newSubscribers: calculatePrevValue(data.newSubscribers, change.newSubscribers),
    comments: calculatePrevValue(data.comments, change.comments),
    likes: calculatePrevValue(data.likes, change.likes),
    shares: calculatePrevValue(data.shares, change.shares),
    searchVisitors: calculatePrevValue(data.searchVisitors, change.searchVisitors),
    directVisitors: calculatePrevValue(data.directVisitors, change.directVisitors),
    socialVisitors: calculatePrevValue(data.socialVisitors, change.socialVisitors),
    referralVisitors: calculatePrevValue(data.referralVisitors, change.referralVisitors),
  }
}

function extractTrafficSourceData(
  blogMetrics: BlogMetricsData | null
): TrafficSourceData | null {
  if (!blogMetrics) return null

  return {
    searchVisitors: blogMetrics.searchVisitors,
    directVisitors: blogMetrics.directVisitors,
    socialVisitors: blogMetrics.socialVisitors,
    referralVisitors: blogMetrics.referralVisitors,
  }
}

interface TrendDataResponse {
  periods?: Array<{
    period: string
    [key: string]: string | number
  }>
}

function buildTrendChartData(
  trendData: TrendDataResponse | undefined
): TrendDataPoint[] {
  if (!trendData?.periods) return []

  return trendData.periods.map((period) => ({
    period: period.period,
    visitors: (period.visitors as number) ?? 0,
    pageviews: (period.pageviews as number) ?? 0,
  }))
}

function BlogViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 pb-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
      </div>

      {/* Additional cards skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    </div>
  )
}
