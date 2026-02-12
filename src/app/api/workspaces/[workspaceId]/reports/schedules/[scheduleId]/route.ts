/**
 * Single Report Schedule API
 *
 * GET: 스케줄 상세 조회
 * PATCH: 스케줄 수정
 * DELETE: 스케줄 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { calculateNextRunAt } from '@/lib/services/report'

interface RouteParams {
  params: Promise<{ workspaceId: string; scheduleId: string }>
}

const updateScheduleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scheduleDay: z.number().int().min(0).max(31).optional(),
  scheduleHour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().optional(),
  reportConfig: z.object({
    sections: z.array(z.string()).optional(),
    includeCharts: z.boolean().optional(),
    includeTrends: z.boolean().optional(),
  }).optional(),
  emailEnabled: z.boolean().optional(),
  slackEnabled: z.boolean().optional(),
  slackWebhook: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, scheduleId } = await params
    await requireWorkspaceViewer(workspaceId)

    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
      include: {
        recipients: {
          orderBy: { createdAt: 'asc' },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to fetch schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, scheduleId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = updateScheduleSchema.parse(body)

    // 스케줄 존재 확인
    const existing = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
    })

    if (!existing) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 스케줄 시간이 변경되면 nextRunAt 재계산
    let nextRunAt = existing.nextRunAt
    if (data.scheduleDay !== undefined || data.scheduleHour !== undefined || data.timezone !== undefined) {
      nextRunAt = calculateNextRunAt(
        existing.periodType,
        data.scheduleDay ?? existing.scheduleDay,
        data.scheduleHour ?? existing.scheduleHour,
        data.timezone ?? existing.timezone
      )
    }

    const schedule = await prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: {
        ...data,
        nextRunAt,
      },
      include: {
        recipients: true,
      },
    })

    return NextResponse.json({ schedule, message: '스케줄이 수정되었습니다.' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to update schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, scheduleId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const existing = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
    })

    if (!existing) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.reportSchedule.delete({
      where: { id: scheduleId },
    })

    return NextResponse.json({ message: '스케줄이 삭제되었습니다.' })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to delete schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
