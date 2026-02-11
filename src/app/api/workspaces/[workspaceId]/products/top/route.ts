import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
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
  limit: z.coerce.number().int().min(1).max(20).default(5),
})

interface ProductMetrics {
  sales?: number | null
  revenue?: number | null
  units?: number | null
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
      limit: searchParams.get('limit') ?? 5,
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.errors },
        { status: 400 }
      )
    }

    const { periodType, periodStart: periodStartStr, limit } = parseResult.data
    const periodStartDate = parseISO(periodStartStr)

    // Calculate period range
    const { start, end, prevStart, prevEnd } = calculatePeriodRange(
      periodStartDate,
      periodType
    )

    // Fetch current period products (PRODUCT type ContentItems)
    const currentProducts = await prisma.contentItem.findMany({
      where: {
        workspaceId,
        contentType: 'PRODUCT',
        channel: { in: ['SMARTSTORE', 'COUPANG'] },
        publishedAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { publishedAt: 'desc' },
    })

    // Fetch previous period products for change calculation
    const previousProducts = await prisma.contentItem.findMany({
      where: {
        workspaceId,
        contentType: 'PRODUCT',
        channel: { in: ['SMARTSTORE', 'COUPANG'] },
        publishedAt: {
          gte: prevStart,
          lte: prevEnd,
        },
      },
    })

    // Aggregate by product (externalId or url as key)
    const productMap = new Map<
      string,
      {
        id: string
        name: string
        url: string
        channel: string
        sales: number
        revenue: number
        units: number
      }
    >()

    for (const item of currentProducts) {
      const key = item.externalId || item.url
      const metrics = item.metrics as ProductMetrics | null
      const existing = productMap.get(key)

      if (existing) {
        existing.sales += metrics?.sales ?? 0
        existing.revenue += metrics?.revenue ?? 0
        existing.units += metrics?.units ?? 0
      } else {
        productMap.set(key, {
          id: item.id,
          name: item.title || '상품명 없음',
          url: item.url,
          channel: item.channel,
          sales: metrics?.sales ?? 0,
          revenue: metrics?.revenue ?? 0,
          units: metrics?.units ?? 0,
        })
      }
    }

    // Previous period aggregation for change calculation
    const prevProductMap = new Map<string, number>()
    for (const item of previousProducts) {
      const key = item.externalId || item.url
      const metrics = item.metrics as ProductMetrics | null
      const existing = prevProductMap.get(key) ?? 0
      prevProductMap.set(key, existing + (metrics?.sales ?? 0))
    }

    // Sort by sales and take top N
    const products = Array.from(productMap.entries())
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, limit)
      .map(([key, data]) => {
        const prevSales = prevProductMap.get(key)
        const change =
          prevSales !== undefined && prevSales > 0
            ? ((data.sales - prevSales) / prevSales) * 100
            : null

        return {
          ...data,
          change: change !== null ? Math.round(change * 10) / 10 : null,
        }
      })

    return NextResponse.json({
      periodType,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      products,
      total: productMap.size,
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
    console.error('Get top products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculatePeriodRange(periodStart: Date, periodType: 'WEEKLY' | 'MONTHLY') {
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
