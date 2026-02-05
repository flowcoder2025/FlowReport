import { ChannelProvider } from '@prisma/client'
import { MetricData } from '@/lib/connectors/base'
import {
  StoreMetric,
  SnsMetric,
  BlogMetric,
  TrafficMetric,
} from '@/lib/csv/schemas'

/**
 * CSV 데이터를 MetricData 배열로 변환
 * - 채널별로 다른 매핑 로직 적용
 */
export function csvToMetrics(
  channel: ChannelProvider,
  records: Record<string, unknown>[]
): MetricData[] {
  switch (channel) {
    case 'SMARTSTORE':
    case 'COUPANG':
      return convertStoreMetrics(records as StoreMetric[])

    case 'META_INSTAGRAM':
    case 'META_FACEBOOK':
    case 'YOUTUBE':
      return convertSnsMetrics(records as SnsMetric[])

    case 'NAVER_BLOG':
      return convertBlogMetrics(records as BlogMetric[])

    case 'GA4':
      return convertTrafficMetrics(records as TrafficMetric[])

    default:
      return []
  }
}

/**
 * 스토어 (스마트스토어, 쿠팡) 메트릭 변환
 */
function convertStoreMetrics(records: StoreMetric[]): MetricData[] {
  return records.map((record) => ({
    date: new Date(record.date),
    periodType: 'DAILY' as const,
    metrics: {
      revenue: record.sales_net ?? record.sales_gmv ?? null,
      gmv: record.sales_gmv ?? null,
      netSales: record.sales_net ?? null,
      orders: record.orders_count ?? null,
      unitsSold: record.units_sold ?? null,
      aov: record.aov ?? null,
      cancels: record.cancels_count ?? null,
      refunds: record.refunds_count ?? null,
      refundAmount: record.refunds_amount ?? null,
      returns: record.returns_count ?? null,
      delivered: record.delivered_count ?? null,
      settlementExpected: record.settlement_expected ?? null,
      feesTotal: record.fees_total ?? null,
    },
  }))
}

/**
 * SNS (Instagram, Facebook, YouTube) 메트릭 변환
 */
function convertSnsMetrics(records: SnsMetric[]): MetricData[] {
  return records.map((record) => ({
    date: new Date(record.date),
    periodType: 'DAILY' as const,
    metrics: {
      uploads: record.uploads_count ?? null,
      views: record.views ?? null,
      reach: record.reach ?? null,
      engagements: record.engagement ?? null,
      followers: record.followers ?? null,
      likes: record.likes ?? null,
      comments: record.comments ?? null,
      shares: record.shares ?? null,
      // 참여율 계산 (reach가 있는 경우)
      engagementRate: calculateEngagementRate(
        record.engagement ?? 0,
        record.reach ?? 0
      ),
    },
  }))
}

/**
 * 블로그 (네이버 블로그) 메트릭 변환
 */
function convertBlogMetrics(records: BlogMetric[]): MetricData[] {
  return records.map((record) => ({
    date: new Date(record.date),
    periodType: 'DAILY' as const,
    metrics: {
      posts: record.posts_count ?? null,
      visitors: record.visitors ?? null,
      pageviews: record.pageviews ?? null,
      avgDuration: record.avg_duration ?? null,
    },
  }))
}

/**
 * 트래픽 (GA4) 메트릭 변환
 */
function convertTrafficMetrics(records: TrafficMetric[]): MetricData[] {
  return records.map((record) => ({
    date: new Date(record.date),
    periodType: 'DAILY' as const,
    metrics: {
      sessions: record.sessions ?? null,
      totalUsers: record.users ?? null,
      newUsers: record.new_users ?? null,
      screenPageViews: record.pageviews ?? null,
      averageSessionDuration: record.avg_session_duration ?? null,
      bounceRate: record.bounce_rate ?? null,
    },
  }))
}

/**
 * 참여율 계산
 */
function calculateEngagementRate(engagement: number, reach: number): number | null {
  if (reach === 0) return null
  return Math.round((engagement / reach) * 10000) / 100 // 소수점 2자리까지
}

/**
 * 데이터 날짜 범위 추출
 */
export function getDateRange(
  records: Record<string, unknown>[]
): { startDate: Date; endDate: Date } | null {
  const dates = records
    .map((r) => {
      const dateStr = r.date as string | undefined
      return dateStr ? new Date(dateStr) : null
    })
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))

  if (dates.length === 0) return null

  dates.sort((a, b) => a.getTime() - b.getTime())

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  }
}
