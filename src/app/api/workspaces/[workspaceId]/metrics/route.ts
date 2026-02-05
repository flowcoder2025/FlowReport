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

const querySchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

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
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.errors },
        { status: 400 }
      )
    }

    const { periodType, periodStart: periodStartStr } = parseResult.data
    const periodStartDate = parseISO(periodStartStr)

    // Calculate period range
    const { start, end, prevStart, prevEnd } = calculatePeriodRange(
      periodStartDate,
      periodType as PeriodType
    )

    // Fetch current period snapshots
    const currentSnapshots = await prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: periodType as PeriodType,
        periodStart: {
          gte: start,
          lte: end,
        },
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

    // Fetch previous period snapshots
    const previousSnapshots = await prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: periodType as PeriodType,
        periodStart: {
          gte: prevStart,
          lte: prevEnd,
        },
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
      ['META_INSTAGRAM', 'META_FACEBOOK', 'YOUTUBE', 'NAVER_BLOG']
    )

    const storeChannels = aggregateByChannel(
      currentSnapshots,
      previousSnapshots,
      ['SMARTSTORE', 'COUPANG', 'GA4']
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
  const names: Record<ChannelProvider, string> = {
    GA4: 'Google Analytics',
    META_INSTAGRAM: 'Instagram',
    META_FACEBOOK: 'Facebook',
    YOUTUBE: 'YouTube',
    SMARTSTORE: '스마트스토어',
    COUPANG: '쿠팡',
    GOOGLE_SEARCH_CONSOLE: 'Google Search Console',
    NAVER_BLOG: '네이버 블로그',
    NAVER_KEYWORDS: '네이버 키워드',
  }
  return names[provider] || provider
}
