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
  format,
} from 'date-fns'

const querySchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  periodCount: z.coerce.number().min(1).max(12).default(8),
  channels: z.string().optional(),
})

export interface TrendPeriod {
  period: string
  periodStart: string
  periodEnd: string
  revenue: number
  reach: number
  engagement: number
  [key: string]: string | number
}

export interface ChannelTrendMetrics {
  youtube?: Array<{ period: string; subscribers: number; views: number }>
  instagram?: Array<{ period: string; followers: number; reach: number }>
}

export interface TrendData {
  periodType: string
  periods: TrendPeriod[]
  channelMetrics?: ChannelTrendMetrics
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
      periodCount: searchParams.get('periodCount') ?? 8,
      channels: searchParams.get('channels') ?? undefined,
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.errors },
        { status: 400 }
      )
    }

    const { periodType, periodCount, channels: channelsParam } = parseResult.data
    const channelFilter = channelsParam
      ? (channelsParam.split(',') as ChannelProvider[])
      : null

    const now = new Date()
    const periods: TrendPeriod[] = []

    // 채널별 트렌드 데이터 수집
    const youtubeData: Array<{ period: string; subscribers: number; views: number }> = []
    const instagramData: Array<{ period: string; followers: number; reach: number }> = []

    for (let i = periodCount - 1; i >= 0; i--) {
      const { start, end, label } = getPeriodBounds(now, periodType as PeriodType, i)

      // Fetch snapshots for this period
      const snapshots = await prisma.metricSnapshot.findMany({
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
            select: { provider: true },
          },
        },
      })

      // Aggregate metrics
      let revenue = 0
      let reach = 0
      let engagement = 0

      // 채널별 세부 지표
      let youtubeSubscribers = 0
      let youtubeViews = 0
      let instagramFollowers = 0
      let instagramReach = 0

      for (const snapshot of snapshots) {
        const data = snapshot.data as Record<string, number | null>
        const provider = snapshot.connection?.provider

        revenue += data.revenue ?? data.sales ?? 0
        reach += data.reach ?? data.impressions ?? data.views ?? 0
        engagement += data.engagement ?? data.engagements ?? 0

        // 채널별 세부 데이터 수집
        if (provider === 'YOUTUBE') {
          youtubeSubscribers += data.subscribers ?? data.subscriberCount ?? 0
          youtubeViews += data.views ?? 0
        } else if (provider === 'META_INSTAGRAM') {
          instagramFollowers += data.followers ?? data.followerCount ?? 0
          instagramReach += data.reach ?? 0
        }
      }

      periods.push({
        period: label,
        periodStart: format(start, 'yyyy-MM-dd'),
        periodEnd: format(end, 'yyyy-MM-dd'),
        revenue,
        reach,
        engagement,
      })

      // 채널별 트렌드 데이터 추가
      youtubeData.push({ period: label, subscribers: youtubeSubscribers, views: youtubeViews })
      instagramData.push({ period: label, followers: instagramFollowers, reach: instagramReach })
    }

    // 채널별 메트릭스 구성 (데이터가 있는 채널만 포함)
    const channelMetrics: ChannelTrendMetrics = {}
    if (youtubeData.some(d => d.subscribers > 0 || d.views > 0)) {
      channelMetrics.youtube = youtubeData
    }
    if (instagramData.some(d => d.followers > 0 || d.reach > 0)) {
      channelMetrics.instagram = instagramData
    }

    return NextResponse.json({
      periodType,
      periods,
      channelMetrics,
    } as TrendData)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Get trend metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getPeriodBounds(
  now: Date,
  periodType: PeriodType,
  periodsBack: number
): { start: Date; end: Date; label: string } {
  if (periodType === 'WEEKLY') {
    const baseStart = startOfWeek(now, { weekStartsOn: 1 })
    const start = subWeeks(baseStart, periodsBack)
    const end = endOfWeek(start, { weekStartsOn: 1 })
    const weekNum = periodsBack === 0 ? '이번주' : `${periodsBack}주 전`
    return { start, end, label: weekNum }
  } else {
    const baseStart = startOfMonth(now)
    const start = subMonths(baseStart, periodsBack)
    const end = endOfMonth(start)
    const label = format(start, 'M월')
    return { start, end, label }
  }
}
