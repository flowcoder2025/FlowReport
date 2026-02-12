/**
 * Report History API
 *
 * GET: 리포트 발송 이력 조회
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceViewer(workspaceId)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const cursor = searchParams.get('cursor')
    const periodType = searchParams.get('periodType')

    const where = {
      workspaceId,
      ...(periodType && { periodType: periodType as 'WEEKLY' | 'MONTHLY' }),
    }

    const reports = await prisma.generatedReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        schedule: {
          select: { name: true, periodType: true },
        },
      },
    })

    const hasMore = reports.length > limit
    const items = hasMore ? reports.slice(0, -1) : reports
    const nextCursor = hasMore ? items[items.length - 1]?.id : null

    return NextResponse.json({
      reports: items,
      pagination: {
        hasMore,
        nextCursor,
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
    console.error('Failed to fetch report history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
