import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { PeriodType, ChannelProvider } from '@prisma/client'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  parseISO,
} from 'date-fns'
import { CHANNEL_GROUPS, CHANNEL_LABELS, METRIC_LABELS, HIGHLIGHT_THRESHOLD, getMetricSeverity } from '@/constants'

const querySchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  channels: z.string().optional(),
})

interface HighlightItem {
  channel: string
  metric: string
  change: number
  direction: 'up' | 'down'
  severity: 'positive' | 'negative' | 'neutral'
}

interface YouTubeMetrics {
  views: number | null
  estimatedMinutesWatched: number | null
  subscribers: number | null
  subscriberGained: number | null
  engagement: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  change: {
    views: number | null
    estimatedMinutesWatched: number | null
    subscribers: number | null
    engagement: number | null
  }
  topVideos: Array<{
    id: string
    title: string | null
    url: string
    views: number | null
    engagement: number | null
  }>
}

interface InstagramMetrics {
  reach: number | null
  impressions: number | null
  engagement: number | null
  engagementRate: number | null
  followers: number | null
  change: {
    reach: number | null
    impressions: number | null
    engagement: number | null
    followers: number | null
  }
}

interface FacebookMetrics {
  impressions: number | null
  engagement: number | null
  fanAdds: number | null
  pageViews: number | null
  change: {
    impressions: number | null
    engagement: number | null
    fanAdds: number | null
    pageViews: number | null
  }
}

interface StoreMetrics {
  revenue: number | null
  orders: number | null
  conversionRate: number | null
  avgOrderValue: number | null
  cancels: number | null
  refunds: number | null
  refundAmount: number | null
  returns: number | null
  change: {
    revenue: number | null
    orders: number | null
    conversionRate: number | null
    cancels: number | null
    refunds: number | null
  }
}

interface ChannelDetails {
  YOUTUBE?: YouTubeMetrics
  META_INSTAGRAM?: InstagramMetrics
  META_FACEBOOK?: FacebookMetrics
  SMARTSTORE?: StoreMetrics
  COUPANG?: StoreMetrics
}

interface MetricData {
  [key: string]: number | null
}

interface ChannelMetrics {
  channel: ChannelProvider
  channelName: string
  data: MetricData
  change: MetricData
}

interface TopPost {
  id: string
  channel: ChannelProvider
  contentType: string
  title: string | null
  url: string
  views: number | null
  engagement: number | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = await requireWorkspaceViewer(params.workspaceId)

    const searchParams = request.nextUrl.searchParams
    const parseResult = querySchema.safeParse({
      periodType: searchParams.get('periodType'),
      periodStart: searchParams.get('periodStart'),
      channels: searchParams.get('channels') ?? undefined,
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.errors },
        { status: 400 }
      )
    }

    const { periodType, periodStart: periodStartStr, channels: channelsParam } = parseResult.data
    const periodStartDate = parseISO(periodStartStr)
    const channelFilter = channelsParam
      ? (channelsParam.split(',') as ChannelProvider[])
      : null

    // Calculate period range
    const { start, end, prevStart, prevEnd } = calculatePeriodRange(
      periodStartDate,
      periodType as PeriodType
    )

    // Fetch current period snapshots (including DAILY for aggregation)
    const currentSnapshots = await prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: {
          in: [periodType as PeriodType, 'DAILY'],
        },
        periodStart: {
          gte: start,
          lte: end,
        },
        ...(channelFilter && channelFilter.length > 0 && {
          connection: { provider: { in: channelFilter } },
        }),
      },
      include: {
        connection: {
          select: {
            id: true,
            provider: true,
            accountName: true,
          },
        },
      },
    })

    // Fetch previous period snapshots (including DAILY for aggregation)
    const previousSnapshots = await prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: {
          in: [periodType as PeriodType, 'DAILY'],
        },
        periodStart: {
          gte: prevStart,
          lte: prevEnd,
        },
        ...(channelFilter && channelFilter.length > 0 && {
          connection: { provider: { in: channelFilter } },
        }),
      },
      include: {
        connection: {
          select: {
            id: true,
            provider: true,
          },
        },
      },
    })

    // Aggregate metrics
    const overview = aggregateOverviewMetrics(currentSnapshots)
    const previous = aggregateOverviewMetrics(previousSnapshots)

    // Group by channel (SNS and Store)
    const snsChannels = aggregateByChannel(
      currentSnapshots,
      previousSnapshots,
      [...CHANNEL_GROUPS.SNS]
    )

    const storeChannels = aggregateByChannel(
      currentSnapshots,
      previousSnapshots,
      [...CHANNEL_GROUPS.STORE, 'GA4']
    )

    // Fetch top posts
    // Fetch posts and sort by metrics in JavaScript
    const allPosts = await prisma.contentItem.findMany({
      where: {
        workspaceId,
        publishedAt: {
          gte: start,
          lte: end,
        },
        ...(channelFilter && channelFilter.length > 0 && {
          channel: { in: channelFilter },
        }),
      },
      orderBy: { publishedAt: 'desc' },
      take: 20, // Fetch more to filter by metrics
    })

    // Sort by views and take top 5
    const topPosts = allPosts
      .sort((a, b) => {
        const aViews = (a.metrics as Record<string, number> | null)?.views ?? 0
        const bViews = (b.metrics as Record<string, number> | null)?.views ?? 0
        return bViews - aViews
      })
      .slice(0, 5)

    // Format top posts
    const formattedTopPosts: TopPost[] = topPosts.map((post) => {
      const metrics = post.metrics as Record<string, number> | null
      return {
        id: post.id,
        channel: post.channel,
        contentType: post.contentType,
        title: post.title,
        url: post.url,
        views: metrics?.views ?? null,
        engagement: metrics?.engagement ?? metrics?.engagements ?? null,
      }
    })

    // Get traffic data from GA4
    const trafficData = extractTrafficData(currentSnapshots, previousSnapshots)

    // Generate highlights
    const highlights = generateHighlights(overview, previous, snsChannels, storeChannels)

    // Generate channel details
    const channelDetails = generateChannelDetails(
      currentSnapshots,
      previousSnapshots,
      formattedTopPosts
    )

    return NextResponse.json({
      periodType,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      overview,
      previous,
      sns: {
        channels: snsChannels,
        topPosts: formattedTopPosts,
      },
      store: {
        traffic: trafficData,
        channels: storeChannels,
      },
      highlights,
      channelDetails,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Get metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

function aggregateOverviewMetrics(
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

    // Sum up metrics
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
  const channelMap = new Map<ChannelProvider, { current: MetricData; previous: MetricData; name: string }>()

  // Aggregate current period
  for (const snapshot of currentSnapshots) {
    if (!snapshot.connection || !providers.includes(snapshot.connection.provider)) {
      continue
    }

    const provider = snapshot.connection.provider
    const existing = channelMap.get(provider) || {
      current: {},
      previous: {},
      name: snapshot.connection.accountName || getChannelDisplayName(provider),
    }

    const data = snapshot.data as Record<string, number | null>
    existing.current = mergeMetrics(existing.current, data)
    channelMap.set(provider, existing)
  }

  // Aggregate previous period
  for (const snapshot of previousSnapshots) {
    if (!snapshot.connection || !providers.includes(snapshot.connection.provider)) {
      continue
    }

    const provider = snapshot.connection.provider
    const existing = channelMap.get(provider)
    if (!existing) continue

    const data = snapshot.data as Record<string, number | null>
    existing.previous = mergeMetrics(existing.previous, data)
  }

  // Calculate changes
  return Array.from(channelMap.entries()).map(([channel, { current, previous, name }]) => ({
    channel,
    channelName: name,
    data: current,
    change: calculateChange(current, previous),
  }))
}

function mergeMetrics(existing: MetricData, newData: Record<string, number | null>): MetricData {
  const result = { ...existing }
  for (const [key, value] of Object.entries(newData)) {
    if (value !== null) {
      result[key] = (result[key] ?? 0) + value
    }
  }
  return result
}

function calculateChange(current: MetricData, previous: MetricData): MetricData {
  const result: MetricData = {}
  for (const key of Object.keys(current)) {
    const curr = current[key]
    const prev = previous[key]
    if (curr !== null && prev !== null && prev !== 0) {
      result[key] = ((curr - prev) / prev) * 100
    } else {
      result[key] = null
    }
  }
  return result
}

function extractTrafficData(
  currentSnapshots: Array<{ data: unknown; connection: { provider: ChannelProvider } | null }>,
  previousSnapshots: Array<{ data: unknown; connection: { provider: ChannelProvider } | null }>
) {
  // Find GA4 snapshots
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
    previousSessions: previous.sessions ?? null,
    previousUsers: previous.totalUsers ?? null,
    previousDau: previous.dau ?? null,
    previousWau: previous.wau ?? null,
    previousConversionRate: previous.conversionRate ?? null,
  }
}

function getChannelDisplayName(provider: ChannelProvider): string {
  return CHANNEL_LABELS[provider] || provider
}

function generateHighlights(
  overview: MetricData,
  previous: MetricData,
  snsChannels: ChannelMetrics[],
  storeChannels: ChannelMetrics[]
): HighlightItem[] {
  const highlights: HighlightItem[] = []

  for (const channel of [...snsChannels, ...storeChannels]) {
    for (const [metricKey, changeValue] of Object.entries(channel.change)) {
      if (changeValue === null || Math.abs(changeValue) < HIGHLIGHT_THRESHOLD) {
        continue
      }

      const label = METRIC_LABELS[metricKey]
      if (!label) continue

      highlights.push({
        channel: channel.channelName,
        metric: label,
        change: Math.round(changeValue * 10) / 10,
        direction: changeValue > 0 ? 'up' : 'down',
        severity: getMetricSeverity(metricKey, changeValue),
      })
    }
  }

  highlights.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  return highlights.slice(0, 5)
}


function generateChannelDetails(
  currentSnapshots: Array<{
    data: unknown
    connection: { provider: ChannelProvider; accountName?: string | null } | null
  }>,
  previousSnapshots: Array<{
    data: unknown
    connection: { provider: ChannelProvider } | null
  }>,
  topPosts: TopPost[]
): ChannelDetails {
  const details: ChannelDetails = {}

  const youtubeSnapshots = currentSnapshots.filter(
    (s) => s.connection?.provider === 'YOUTUBE'
  )
  const youtubePrevSnapshots = previousSnapshots.filter(
    (s) => s.connection?.provider === 'YOUTUBE'
  )

  if (youtubeSnapshots.length > 0) {
    const current = aggregateChannelData(youtubeSnapshots)
    const prev = aggregateChannelData(youtubePrevSnapshots)
    const engagement =
      (current.likes ?? 0) + (current.comments ?? 0) + (current.shares ?? 0)
    const prevEngagement =
      (prev.likes ?? 0) + (prev.comments ?? 0) + (prev.shares ?? 0)

    details.YOUTUBE = {
      views: current.views ?? null,
      estimatedMinutesWatched: current.estimatedMinutesWatched ?? null,
      subscribers: current.followers ?? current.subscriberCount ?? null,
      subscriberGained: current.subscriberGained ?? null,
      engagement,
      likes: current.likes ?? null,
      comments: current.comments ?? null,
      shares: current.shares ?? null,
      change: {
        views: calculateSingleChange(current.views, prev.views),
        estimatedMinutesWatched: calculateSingleChange(
          current.estimatedMinutesWatched,
          prev.estimatedMinutesWatched
        ),
        subscribers: calculateSingleChange(
          current.followers ?? current.subscriberCount,
          prev.followers ?? prev.subscriberCount
        ),
        engagement: calculateSingleChange(engagement, prevEngagement),
      },
      topVideos: topPosts
        .filter((p) => p.channel === 'YOUTUBE')
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          title: p.title,
          url: p.url,
          views: p.views,
          engagement: p.engagement,
        })),
    }
  }

  const instagramSnapshots = currentSnapshots.filter(
    (s) => s.connection?.provider === 'META_INSTAGRAM'
  )
  const instagramPrevSnapshots = previousSnapshots.filter(
    (s) => s.connection?.provider === 'META_INSTAGRAM'
  )

  if (instagramSnapshots.length > 0) {
    const current = aggregateChannelData(instagramSnapshots)
    const prev = aggregateChannelData(instagramPrevSnapshots)
    const engagementRate =
      current.reach && current.reach > 0
        ? ((current.engagements ?? current.engagement ?? 0) / current.reach) * 100
        : null

    details.META_INSTAGRAM = {
      reach: current.reach ?? null,
      impressions: current.impressions ?? null,
      engagement: current.engagements ?? current.engagement ?? null,
      engagementRate,
      followers: current.followers ?? null,
      change: {
        reach: calculateSingleChange(current.reach, prev.reach),
        impressions: calculateSingleChange(current.impressions, prev.impressions),
        engagement: calculateSingleChange(
          current.engagements ?? current.engagement,
          prev.engagements ?? prev.engagement
        ),
        followers: calculateSingleChange(current.followers, prev.followers),
      },
    }
  }

  const facebookSnapshots = currentSnapshots.filter(
    (s) => s.connection?.provider === 'META_FACEBOOK'
  )
  const facebookPrevSnapshots = previousSnapshots.filter(
    (s) => s.connection?.provider === 'META_FACEBOOK'
  )

  if (facebookSnapshots.length > 0) {
    const current = aggregateChannelData(facebookSnapshots)
    const prev = aggregateChannelData(facebookPrevSnapshots)

    details.META_FACEBOOK = {
      impressions: current.impressions ?? null,
      engagement: current.engagement ?? null,
      fanAdds: current.followers ?? null,
      pageViews: current.profileViews ?? null,
      change: {
        impressions: calculateSingleChange(current.impressions, prev.impressions),
        engagement: calculateSingleChange(current.engagement, prev.engagement),
        fanAdds: calculateSingleChange(current.followers, prev.followers),
        pageViews: calculateSingleChange(current.profileViews, prev.profileViews),
      },
    }
  }

  const storeProviders = CHANNEL_GROUPS.STORE
  for (const provider of storeProviders) {
    const storeSnapshots = currentSnapshots.filter(
      (s) => s.connection?.provider === provider
    )
    const storePrevSnapshots = previousSnapshots.filter(
      (s) => s.connection?.provider === provider
    )

    if (storeSnapshots.length > 0) {
      const current = aggregateChannelData(storeSnapshots)
      const prev = aggregateChannelData(storePrevSnapshots)
      const revenue = current.revenue ?? current.sales ?? null
      const prevRevenue = prev.revenue ?? prev.sales ?? null
      const orders = current.orders ?? null
      const avgOrderValue =
        revenue !== null && orders !== null && orders > 0
          ? revenue / orders
          : null

      const storeMetrics: StoreMetrics = {
        revenue,
        orders,
        conversionRate: current.conversionRate ?? null,
        avgOrderValue,
        cancels: current.cancels ?? null,
        refunds: current.refunds ?? null,
        refundAmount: current.refundAmount ?? null,
        returns: current.returns ?? null,
        change: {
          revenue: calculateSingleChange(revenue, prevRevenue),
          orders: calculateSingleChange(orders, prev.orders),
          conversionRate: calculateSingleChange(
            current.conversionRate,
            prev.conversionRate
          ),
          cancels: calculateSingleChange(current.cancels, prev.cancels),
          refunds: calculateSingleChange(current.refunds, prev.refunds),
        },
      }

      if (provider === 'SMARTSTORE') {
        details.SMARTSTORE = storeMetrics
      } else if (provider === 'COUPANG') {
        details.COUPANG = storeMetrics
      }
    }
  }

  return details
}

function aggregateChannelData(
  snapshots: Array<{ data: unknown }>
): Record<string, number | null> {
  const result: Record<string, number | null> = {}

  for (const snapshot of snapshots) {
    const data = snapshot.data as Record<string, number | null>
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        result[key] = (result[key] ?? 0) + value
      }
    }
  }

  return result
}

function calculateSingleChange(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0
  ) {
    return null
  }
  return ((current - previous) / previous) * 100
}
