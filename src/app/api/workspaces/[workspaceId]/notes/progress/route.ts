import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { PeriodType } from '@prisma/client'
import {
  startOfWeek,
  startOfMonth,
  subWeeks,
  subMonths,
  parseISO,
} from 'date-fns'

const querySchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

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
    const currentPeriodStart = normalizePeriodStart(
      parseISO(periodStartStr),
      periodType as PeriodType
    )

    // Calculate previous period start
    const previousPeriodStart =
      periodType === 'WEEKLY'
        ? subWeeks(currentPeriodStart, 1)
        : subMonths(currentPeriodStart, 1)

    // Fetch action items from previous period
    const actionItems = await prisma.actionItem.findMany({
      where: {
        workspaceId,
        periodType: periodType as PeriodType,
        periodStart: previousPeriodStart,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    })

    // Calculate completion stats
    const totalItems = actionItems.length
    const completedItems = actionItems.filter(
      (item) => item.status === 'COMPLETED'
    ).length
    const inProgressItems = actionItems.filter(
      (item) => item.status === 'IN_PROGRESS'
    ).length
    const pendingItems = actionItems.filter(
      (item) => item.status === 'PENDING'
    ).length
    const canceledItems = actionItems.filter(
      (item) => item.status === 'CANCELED'
    ).length

    // Calculate completion rate (excluding canceled items)
    const effectiveTotal = totalItems - canceledItems
    const completionRate =
      effectiveTotal > 0 ? (completedItems / effectiveTotal) * 100 : 0

    // Map action items to response format
    const items = actionItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: mapStatus(item.status),
      priority: item.priority,
      createdAt: item.createdAt.toISOString(),
      completedAt: item.completedAt?.toISOString() ?? null,
    }))

    return NextResponse.json({
      periodType,
      periodStart: previousPeriodStart.toISOString(),
      items,
      stats: {
        total: totalItems,
        completed: completedItems,
        inProgress: inProgressItems,
        pending: pendingItems,
        canceled: canceledItems,
      },
      completionRate: Math.round(completionRate * 10) / 10,
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
    console.error('Get action progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function normalizePeriodStart(date: Date, periodType: PeriodType): Date {
  if (periodType === 'WEEKLY') {
    return startOfWeek(date, { weekStartsOn: 1 })
  }
  return startOfMonth(date)
}

function mapStatus(
  status: string
): 'completed' | 'in_progress' | 'not_started' | 'overdue' | 'canceled' {
  switch (status) {
    case 'COMPLETED':
      return 'completed'
    case 'IN_PROGRESS':
      return 'in_progress'
    case 'PENDING':
      return 'not_started'
    case 'CANCELED':
      return 'canceled'
    default:
      return 'not_started'
  }
}
