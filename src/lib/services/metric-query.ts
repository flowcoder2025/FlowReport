import { prisma } from '@/lib/db'
import { PeriodType, ChannelProvider } from '@prisma/client'
import { CHANNEL_LABELS } from '@/constants'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from 'date-fns'
import { CHANNEL_GROUPS } from '@/constants'

/**
 * 메트릭 조회 서비스
 * 대시보드에서 사용하는 데이터 조회 로직
 */

export interface DashboardMetrics {
  overview: MetricData
  previous: MetricData
  snsChannels: ChannelMetrics[]
  storeChannels: ChannelMetrics[]
  traffic: TrafficData
  topPosts: TopPost[]
}

export interface MetricData {
  totalRevenue: number | null
  dau: number | null
  wau: number | null
  mau: number | null
  signups: number | null
  reach: number | null
  engagement: number | null
  followers: number | null
  uploads: number | null
  [key: string]: number | null | undefined
}

export interface ChannelMetrics {
  channel: ChannelProvider
  channelName: string
  data: Record<string, number | null>
  change: Record<string, number | null>
}

export interface TrafficData {
  sessions: number | null
  users: number | null
  dau: number | null
  wau: number | null
  conversionRate: number | null
  previous: {
    sessions: number | null
    users: number | null
    dau: number | null
    wau: number | null
    conversionRate: number | null
  }
}

export interface TopPost {
  id: string
  channel: ChannelProvider
  contentType: string
  title: string | null
  url: string
  publishedAt: Date
  views: number | null
  engagement: number | null
}

/**
 * 주간/월간 메트릭 조회
 */
export async function getMetricsForPeriod(
  workspaceId: string,
  periodType: PeriodType,
  periodStart: Date
): Promise<DashboardMetrics> {
  const { start, end, prevStart, prevEnd } = calculatePeriodRange(periodStart, periodType)

  // Fetch current and previous period snapshots
  const [currentSnapshots, previousSnapshots] = await Promise.all([
    prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType,
        periodStart: { gte: start, lte: end },
      },
      include: {
        connection: {
          select: { id: true, provider: true, accountName: true },
        },
      },
    }),
    prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType,
        periodStart: { gte: prevStart, lte: prevEnd },
      },
      include: {
        connection: {
          select: { id: true, provider: true },
        },
      },
    }),
  ])

  // Aggregate overview metrics
  const overview = aggregateOverview(currentSnapshots)
  const previous = aggregateOverview(previousSnapshots)

  // Aggregate by channel
  const snsChannels = aggregateByChannel(
    currentSnapshots,
    previousSnapshots,
    [...CHANNEL_GROUPS.SNS]
  )

  const storeChannels = aggregateByChannel(
    currentSnapshots,
    previousSnapshots,
    [...CHANNEL_GROUPS.STORE]
  )

  // Extract traffic data (GA4)
  const traffic = extractTraffic(currentSnapshots, previousSnapshots)

  // Fetch top posts
  const topPosts = await getTopContent(workspaceId, start, end, 5)

  return {
    overview,
    previous,
    snsChannels,
    storeChannels,
    traffic,
    topPosts,
  }
}

/**
 * Top 게시물 조회
 */
export async function getTopContent(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  limit = 5
): Promise<TopPost[]> {
  const posts = await prisma.contentItem.findMany({
    where: {
      workspaceId,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit * 3, // Fetch more to filter and sort by metrics
  })

  // Sort by views and take top N
  const sortedPosts = posts
    .map((post) => {
      const metrics = post.metrics as Record<string, number> | null
      return {
        id: post.id,
        channel: post.channel,
        contentType: post.contentType,
        title: post.title,
        url: post.url,
        publishedAt: post.publishedAt,
        views: metrics?.views ?? metrics?.impressions ?? null,
        engagement: metrics?.engagement ?? metrics?.engagements ?? null,
      }
    })
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, limit)

  return sortedPosts
}

// Helper functions

function calculatePeriodRange(periodStart: Date, periodType: PeriodType) {
  if (periodType === 'WEEKLY') {
    const start = startOfWeek(periodStart, { weekStartsOn: 1 })
    const end = endOfWeek(periodStart, { weekStartsOn: 1 })
    const prevStart = subWeeks(start, 1)
    const prevEnd = subWeeks(end, 1)
    return { start, end, prevStart, prevEnd }
  } else {
    const start = startOfMonth(periodStart)
    const end = endOfMonth(periodStart)
    const prevStart = subMonths(start, 1)
    const prevEnd = endOfMonth(prevStart)
    return { start, end, prevStart, prevEnd }
  }
}

function aggregateOverview(
  snapshots: Array<{ data: unknown }>
): MetricData {
  const result: MetricData = {
    totalRevenue: 0,
    dau: 0,
    wau: 0,
    mau: 0,
    signups: 0,
    reach: 0,
    engagement: 0,
    followers: 0,
    uploads: 0,
  }

  for (const snapshot of snapshots) {
    const data = snapshot.data as Record<string, number | null>

    result.totalRevenue = (result.totalRevenue ?? 0) + (data.revenue ?? data.sales ?? 0)
    result.dau = Math.max(result.dau ?? 0, data.dau ?? data.totalUsers ?? 0)
    result.wau = Math.max(result.wau ?? 0, data.wau ?? 0)
    result.mau = Math.max(result.mau ?? 0, data.mau ?? 0)
    result.signups = (result.signups ?? 0) + (data.signups ?? data.newUsers ?? 0)
    result.reach = (result.reach ?? 0) + (data.reach ?? data.impressions ?? 0)
    result.engagement = (result.engagement ?? 0) + (data.engagement ?? data.engagements ?? 0)
    result.followers = (result.followers ?? 0) + (data.followers ?? data.subscriberGained ?? 0)
    result.uploads = (result.uploads ?? 0) + (data.uploads ?? data.posts ?? 0)
  }

  return result
}

function aggregateByChannel(
  currentSnapshots: Array<{ data: unknown; connection: { provider: ChannelProvider; accountName?: string | null } | null }>,
  previousSnapshots: Array<{ data: unknown; connection: { provider: ChannelProvider } | null }>,
  providers: string[]
): ChannelMetrics[] {
  const channelMap = new Map<ChannelProvider, { current: Record<string, number>; previous: Record<string, number>; name: string }>()

  // Aggregate current
  for (const snapshot of currentSnapshots) {
    if (!snapshot.connection || !providers.includes(snapshot.connection.provider)) continue

    const provider = snapshot.connection.provider
    const existing = channelMap.get(provider) || {
      current: {},
      previous: {},
      name: snapshot.connection.accountName || getChannelDisplayName(provider),
    }

    const data = snapshot.data as Record<string, number | null>
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        existing.current[key] = (existing.current[key] ?? 0) + value
      }
    }
    channelMap.set(provider, existing)
  }

  // Aggregate previous
  for (const snapshot of previousSnapshots) {
    if (!snapshot.connection || !providers.includes(snapshot.connection.provider)) continue

    const provider = snapshot.connection.provider
    const existing = channelMap.get(provider)
    if (!existing) continue

    const data = snapshot.data as Record<string, number | null>
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        existing.previous[key] = (existing.previous[key] ?? 0) + value
      }
    }
  }

  return Array.from(channelMap.entries()).map(([channel, { current, previous, name }]) => ({
    channel,
    channelName: name,
    data: current,
    change: calculateChange(current, previous),
  }))
}

function calculateChange(
  current: Record<string, number>,
  previous: Record<string, number>
): Record<string, number | null> {
  const result: Record<string, number | null> = {}
  for (const key of Object.keys(current)) {
    const curr = current[key]
    const prev = previous[key]
    if (prev && prev !== 0) {
      result[key] = ((curr - prev) / prev) * 100
    } else {
      result[key] = null
    }
  }
  return result
}

function extractTraffic(
  currentSnapshots: Array<{ data: unknown; connection: { provider: ChannelProvider } | null }>,
  previousSnapshots: Array<{ data: unknown; connection: { provider: ChannelProvider } | null }>
): TrafficData {
  const ga4Current = currentSnapshots.find((s) => s.connection?.provider === 'GA4')
  const ga4Previous = previousSnapshots.find((s) => s.connection?.provider === 'GA4')

  const current = (ga4Current?.data as Record<string, number | null>) || {}
  const previous = (ga4Previous?.data as Record<string, number | null>) || {}

  return {
    sessions: current.sessions ?? null,
    users: current.totalUsers ?? null,
    dau: current.dau ?? null,
    wau: current.wau ?? null,
    conversionRate: current.conversionRate ?? null,
    previous: {
      sessions: previous.sessions ?? null,
      users: previous.totalUsers ?? null,
      dau: previous.dau ?? null,
      wau: previous.wau ?? null,
      conversionRate: previous.conversionRate ?? null,
    },
  }
}

function getChannelDisplayName(provider: ChannelProvider): string {
  return CHANNEL_LABELS[provider] || provider
}
