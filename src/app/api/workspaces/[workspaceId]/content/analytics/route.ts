import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { ContentType, ChannelProvider } from '@prisma/client'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns'

const querySchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

interface ContentMetrics {
  views?: number | null
  engagement?: number | null
  engagements?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
}

interface ContentTypeStats {
  contentType: ContentType
  count: number
  avgViews: number
  avgEngagement: number
  avgEngagementRate: number
  totalViews: number
  totalEngagement: number
}

interface ChannelTypeStats {
  channel: ChannelProvider
  types: ContentTypeStats[]
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
    const { start, end } = calculatePeriodRange(periodStartDate, periodType)

    // Fetch content items
    const contentItems = await prisma.contentItem.findMany({
      where: {
        workspaceId,
        contentType: { not: 'PRODUCT' }, // Exclude products
        publishedAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        channel: true,
        contentType: true,
        metrics: true,
      },
    })

    // Aggregate by content type
    const typeMap = new Map<ContentType, ContentTypeStats>()
    const channelTypeMap = new Map<ChannelProvider, Map<ContentType, ContentTypeStats>>()

    for (const item of contentItems) {
      const metrics = item.metrics as ContentMetrics | null
      const views = metrics?.views ?? 0
      const engagement =
        metrics?.engagement ??
        metrics?.engagements ??
        (metrics?.likes ?? 0) + (metrics?.comments ?? 0) + (metrics?.shares ?? 0)

      // By type
      const typeStats = typeMap.get(item.contentType) || {
        contentType: item.contentType,
        count: 0,
        avgViews: 0,
        avgEngagement: 0,
        avgEngagementRate: 0,
        totalViews: 0,
        totalEngagement: 0,
      }
      typeStats.count++
      typeStats.totalViews += views
      typeStats.totalEngagement += engagement
      typeMap.set(item.contentType, typeStats)

      // By channel and type
      if (!channelTypeMap.has(item.channel)) {
        channelTypeMap.set(item.channel, new Map())
      }
      const channelTypes = channelTypeMap.get(item.channel)!
      const channelTypeStats = channelTypes.get(item.contentType) || {
        contentType: item.contentType,
        count: 0,
        avgViews: 0,
        avgEngagement: 0,
        avgEngagementRate: 0,
        totalViews: 0,
        totalEngagement: 0,
      }
      channelTypeStats.count++
      channelTypeStats.totalViews += views
      channelTypeStats.totalEngagement += engagement
      channelTypes.set(item.contentType, channelTypeStats)
    }

    // Calculate averages
    const byType: ContentTypeStats[] = []
    for (const stats of Array.from(typeMap.values())) {
      stats.avgViews = stats.count > 0 ? Math.round(stats.totalViews / stats.count) : 0
      stats.avgEngagement = stats.count > 0 ? Math.round(stats.totalEngagement / stats.count) : 0
      stats.avgEngagementRate =
        stats.totalViews > 0
          ? Math.round((stats.totalEngagement / stats.totalViews) * 1000) / 10
          : 0
      byType.push(stats)
    }

    // Sort by average views descending
    byType.sort((a, b) => b.avgViews - a.avgViews)

    // Build channel stats
    const byChannel: ChannelTypeStats[] = []
    for (const [channel, types] of Array.from(channelTypeMap.entries())) {
      const channelTypes: ContentTypeStats[] = []
      for (const stats of Array.from(types.values())) {
        stats.avgViews = stats.count > 0 ? Math.round(stats.totalViews / stats.count) : 0
        stats.avgEngagement = stats.count > 0 ? Math.round(stats.totalEngagement / stats.count) : 0
        stats.avgEngagementRate =
          stats.totalViews > 0
            ? Math.round((stats.totalEngagement / stats.totalViews) * 1000) / 10
            : 0
        channelTypes.push(stats)
      }
      channelTypes.sort((a, b) => b.avgViews - a.avgViews)
      byChannel.push({ channel, types: channelTypes })
    }

    // Find best performer
    const bestPerformer =
      byType.length > 0
        ? {
            contentType: byType[0].contentType,
            reason: `평균 조회수 ${byType[0].avgViews.toLocaleString()}회 (${byType[0].count}개 콘텐츠)`,
          }
        : null

    return NextResponse.json({
      periodType,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      byType,
      byChannel,
      bestPerformer,
      totalContent: contentItems.length,
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
    console.error('Get content analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculatePeriodRange(periodStart: Date, periodType: 'WEEKLY' | 'MONTHLY') {
  if (periodType === 'WEEKLY') {
    const start = startOfWeek(periodStart, { weekStartsOn: 1 })
    const end = endOfWeek(periodStart, { weekStartsOn: 1 })
    return { start, end }
  } else {
    const start = startOfMonth(periodStart)
    const end = endOfMonth(periodStart)
    return { start, end }
  }
}
