import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { PeriodType, ChannelProvider } from '@prisma/client'
import { parseISO, startOfDay, endOfDay, format } from 'date-fns'

/**
 * Raw Metrics API for Analytics Dashboard
 * - 원본 데이터 쿼리 (집계 없음)
 * - 다중 메트릭 선택 지원
 * - 커스텀 기간 선택
 * - CSV Export 지원
 */

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional().default('DAILY'),
  channels: z.string().optional(),
  metrics: z.string().optional(), // comma-separated metric keys
  format: z.enum(['json', 'csv']).optional().default('json'),
  maxRows: z.coerce.number().min(1).max(10000).optional().default(1000),
})

interface RawMetricRow {
  id: string
  date: string
  periodStart: string
  periodEnd: string
  channel: ChannelProvider
  channelName: string
  [metricKey: string]: string | number | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = await requireWorkspaceViewer(params.workspaceId)

    const searchParams = request.nextUrl.searchParams
    const parseResult = querySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      periodType: searchParams.get('periodType') ?? undefined,
      channels: searchParams.get('channels') ?? undefined,
      metrics: searchParams.get('metrics') ?? undefined,
      format: searchParams.get('format') ?? undefined,
      maxRows: searchParams.get('maxRows') ?? undefined,
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.errors },
        { status: 400 }
      )
    }

    const {
      startDate: startDateStr,
      endDate: endDateStr,
      periodType,
      channels: channelsParam,
      metrics: metricsParam,
      format: outputFormat,
      maxRows,
    } = parseResult.data

    const startDate = startOfDay(parseISO(startDateStr))
    const endDate = endOfDay(parseISO(endDateStr))
    const channelFilter = channelsParam
      ? (channelsParam.split(',') as ChannelProvider[])
      : null
    const metricFilter = metricsParam ? metricsParam.split(',') : null

    // Fetch raw snapshots
    const snapshots = await prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: periodType as PeriodType,
        periodStart: {
          gte: startDate,
          lte: endDate,
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
      orderBy: [
        { periodStart: 'asc' },
        { connection: { provider: 'asc' } },
      ],
    })

    // Transform to flat rows
    const rows: RawMetricRow[] = snapshots.map((snapshot) => {
      const data = snapshot.data as Record<string, number | null>
      const baseRow: RawMetricRow = {
        id: snapshot.id,
        date: format(snapshot.periodStart, 'yyyy-MM-dd'),
        periodStart: snapshot.periodStart.toISOString(),
        periodEnd: snapshot.periodEnd.toISOString(),
        channel: snapshot.connection?.provider ?? ('UNKNOWN' as ChannelProvider),
        channelName: snapshot.connection?.accountName ?? getChannelDisplayName(snapshot.connection?.provider),
      }

      // Add metric values
      if (metricFilter) {
        for (const metricKey of metricFilter) {
          baseRow[metricKey] = data[metricKey] ?? null
        }
      } else {
        // Include all metrics
        for (const [key, value] of Object.entries(data)) {
          baseRow[key] = value
        }
      }

      return baseRow
    })

    // Get available metrics for metadata
    const availableMetrics = extractAvailableMetrics(snapshots)

    // Apply row limit
    const totalRows = rows.length
    const limitedRows = rows.slice(0, maxRows)
    const truncated = totalRows > maxRows

    if (outputFormat === 'csv') {
      const csv = convertToCSV(limitedRows, metricFilter || Object.keys(availableMetrics))
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="metrics_${startDateStr}_${endDateStr}.csv"`,
          'X-Total-Rows': String(totalRows),
          'X-Returned-Rows': String(limitedRows.length),
          'X-Truncated': String(truncated),
        },
      })
    }

    return NextResponse.json({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      periodType,
      totalRows,
      returnedRows: limitedRows.length,
      truncated,
      availableMetrics,
      rows: limitedRows,
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
    console.error('Get raw metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getChannelDisplayName(provider: ChannelProvider | undefined | null): string {
  if (!provider) return 'Unknown'

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

function extractAvailableMetrics(
  snapshots: Array<{ data: unknown; connection: { provider: ChannelProvider } | null }>
): Record<string, { label: string; channel: ChannelProvider | null }> {
  const metrics: Record<string, { label: string; channel: ChannelProvider | null }> = {}

  const metricLabels: Record<string, string> = {
    views: '조회수',
    reach: '도달',
    impressions: '노출',
    engagement: '참여',
    engagements: '참여',
    followers: '팔로워',
    subscriberGained: '구독자 증가',
    subscriberCount: '구독자 수',
    likes: '좋아요',
    comments: '댓글',
    shares: '공유',
    revenue: '매출',
    sales: '매출',
    orders: '주문',
    conversionRate: '전환율',
    dau: 'DAU',
    wau: 'WAU',
    mau: 'MAU',
    sessions: '세션',
    totalUsers: '전체 사용자',
    newUsers: '신규 사용자',
    estimatedMinutesWatched: '시청 시간(분)',
    averageViewDuration: '평균 시청 시간',
    avgOrderValue: '평균 주문 금액',
  }

  for (const snapshot of snapshots) {
    const data = snapshot.data as Record<string, number | null>
    const channel = snapshot.connection?.provider ?? null

    for (const key of Object.keys(data)) {
      if (!metrics[key]) {
        metrics[key] = {
          label: metricLabels[key] || key,
          channel,
        }
      }
    }
  }

  return metrics
}

function convertToCSV(rows: RawMetricRow[], metricKeys: string[]): string {
  if (rows.length === 0) {
    return ''
  }

  const headers = ['date', 'channel', 'channelName', ...metricKeys]
  const headerRow = headers.join(',')

  const dataRows = rows.map((row) => {
    const values = headers.map((header) => {
      const value = row[header]
      if (value === null || value === undefined) {
        return ''
      }
      // Escape strings with commas or quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }
      return String(value)
    })
    return values.join(',')
  })

  // Add BOM for UTF-8
  return '\uFEFF' + [headerRow, ...dataRows].join('\n')
}
