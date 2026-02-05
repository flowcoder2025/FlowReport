import { prisma } from '@/lib/db'
import { DataSource, PeriodType, ChannelProvider, Prisma } from '@prisma/client'
import { MetricData, ContentItemData } from '@/lib/connectors/base'

/**
 * MetricSnapshot 저장 서비스
 * Cron sync 및 CSV 업로드에서 사용하는 데이터 저장 로직
 */

interface UpsertSnapshotParams {
  workspaceId: string
  connectionId?: string
  source: DataSource
  csvUploadId?: string
}

/**
 * 일별 메트릭 스냅샷 upsert
 * - 같은 날짜/커넥션의 데이터가 있으면 업데이트
 * - 없으면 새로 생성
 */
export async function upsertDailySnapshots(
  params: UpsertSnapshotParams,
  metrics: MetricData[]
): Promise<{ created: number; updated: number }> {
  const { workspaceId, connectionId, source, csvUploadId } = params
  let created = 0
  let updated = 0

  for (const metric of metrics) {
    // 날짜를 자정으로 정규화 (KST 기준)
    const periodStart = normalizeToMidnight(metric.date)
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + 1)
    periodEnd.setMilliseconds(periodEnd.getMilliseconds() - 1)

    // 기존 스냅샷 찾기
    const existing = await prisma.metricSnapshot.findFirst({
      where: {
        workspaceId,
        connectionId: connectionId || null,
        periodType: metric.periodType as PeriodType,
        periodStart,
      },
    })

    if (existing) {
      // 기존 데이터 병합 (새 데이터가 우선)
      const mergedData = {
        ...(existing.data as Record<string, unknown>),
        ...metric.metrics,
      }

      await prisma.metricSnapshot.update({
        where: { id: existing.id },
        data: {
          data: mergedData as Prisma.InputJsonValue,
          source,
          csvUploadId,
          updatedAt: new Date(),
        },
      })
      updated++
    } else {
      await prisma.metricSnapshot.create({
        data: {
          workspaceId,
          connectionId,
          periodType: metric.periodType as PeriodType,
          periodStart,
          periodEnd,
          data: metric.metrics,
          source,
          csvUploadId,
        },
      })
      created++
    }
  }

  return { created, updated }
}

/**
 * ContentItem upsert
 * - externalId + channel 조합으로 중복 체크
 */
export async function upsertContentItems(
  workspaceId: string,
  connectionId: string | null,
  channel: ChannelProvider,
  items: ContentItemData[]
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  for (const item of items) {
    // externalId로 기존 항목 찾기
    const existing = await prisma.contentItem.findFirst({
      where: {
        workspaceId,
        channel,
        externalId: item.externalId,
      },
    })

    const contentData = {
      url: item.url,
      title: item.title || null,
      publishedAt: item.publishedAt,
      contentType: item.contentType,
      metrics: (item.metrics as Prisma.InputJsonValue) || Prisma.JsonNull,
    }

    if (existing) {
      await prisma.contentItem.update({
        where: { id: existing.id },
        data: {
          ...contentData,
          updatedAt: new Date(),
        },
      })
      updated++
    } else {
      await prisma.contentItem.create({
        data: {
          workspaceId,
          connectionId,
          channel,
          externalId: item.externalId,
          ...contentData,
        },
      })
      created++
    }
  }

  return { created, updated }
}

/**
 * 월별 스냅샷 집계
 * - 일별 스냅샷을 월별로 집계
 */
export async function aggregateMonthlySnapshot(
  workspaceId: string,
  connectionId: string | null,
  year: number,
  month: number
): Promise<void> {
  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999)

  // 해당 월의 일별 스냅샷 조회
  const dailySnapshots = await prisma.metricSnapshot.findMany({
    where: {
      workspaceId,
      connectionId: connectionId || null,
      periodType: 'DAILY',
      periodStart: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  })

  if (dailySnapshots.length === 0) {
    return
  }

  // 메트릭 집계
  const aggregated: Record<string, number> = {}
  const counts: Record<string, number> = {}

  for (const snapshot of dailySnapshots) {
    const data = snapshot.data as Record<string, number | null>
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && typeof value === 'number') {
        // 합계 메트릭 (sessions, users, views 등)
        if (isSumMetric(key)) {
          aggregated[key] = (aggregated[key] || 0) + value
          counts[key] = (counts[key] || 0) + 1
        }
        // 평균 메트릭 (bounceRate, avgDuration 등)
        else if (isAvgMetric(key)) {
          aggregated[`_sum_${key}`] = (aggregated[`_sum_${key}`] || 0) + value
          counts[key] = (counts[key] || 0) + 1
        }
      }
    }
  }

  // 평균 메트릭 계산
  for (const key of Object.keys(counts)) {
    if (isAvgMetric(key) && aggregated[`_sum_${key}`] !== undefined) {
      aggregated[key] = aggregated[`_sum_${key}`] / counts[key]
      delete aggregated[`_sum_${key}`]
    }
  }

  // 월별 스냅샷 upsert
  const existing = await prisma.metricSnapshot.findFirst({
    where: {
      workspaceId,
      connectionId: connectionId || null,
      periodType: 'MONTHLY',
      periodStart,
    },
  })

  if (existing) {
    await prisma.metricSnapshot.update({
      where: { id: existing.id },
      data: {
        data: aggregated,
        updatedAt: new Date(),
      },
    })
  } else {
    await prisma.metricSnapshot.create({
      data: {
        workspaceId,
        connectionId,
        periodType: 'MONTHLY',
        periodStart,
        periodEnd,
        data: aggregated,
        source: 'CONNECTOR',
      },
    })
  }
}

// 헬퍼 함수들

function normalizeToMidnight(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

const SUM_METRICS = [
  'sessions',
  'totalUsers',
  'newUsers',
  'screenPageViews',
  'pageviews',
  'views',
  'likes',
  'comments',
  'shares',
  'saves',
  'reach',
  'impressions',
  'engagements',
  'followers',
  'subscriberGained',
  'subscriberLost',
  'estimatedMinutesWatched',
  'revenue',
  'orders',
  'visitors',
]

const AVG_METRICS = [
  'averageSessionDuration',
  'bounceRate',
  'engagementRate',
  'averageViewDuration',
  'averageViewPercentage',
  'ctr',
  'conversionRate',
]

function isSumMetric(key: string): boolean {
  return SUM_METRICS.includes(key)
}

function isAvgMetric(key: string): boolean {
  return AVG_METRICS.includes(key)
}
