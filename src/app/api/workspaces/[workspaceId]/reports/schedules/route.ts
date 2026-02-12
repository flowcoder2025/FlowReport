/**
 * Report Schedules API
 *
 * GET: 스케줄 목록 조회
 * POST: 스케줄 생성
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { REPORT_CONFIG, DEFAULT_REPORT_CONFIG } from '@/constants'
import { calculateNextRunAt } from '@/lib/services/report'

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

const createScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  scheduleDay: z.number().int().min(0).max(31),
  scheduleHour: z.number().int().min(0).max(23).default(REPORT_CONFIG.DEFAULT_SCHEDULE_HOUR),
  timezone: z.string().default(REPORT_CONFIG.TIMEZONE),
  reportConfig: z.object({
    sections: z.array(z.string()).optional(),
    includeCharts: z.boolean().optional(),
    includeTrends: z.boolean().optional(),
  }).optional(),
  emailEnabled: z.boolean().default(true),
  slackEnabled: z.boolean().default(false),
  slackWebhook: z.string().url().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceViewer(workspaceId)

    const schedules = await prisma.reportSchedule.findMany({
      where: { workspaceId },
      include: {
        recipients: {
          where: { isActive: true },
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to fetch schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = createScheduleSchema.parse(body)

    // 같은 periodType의 스케줄이 이미 있는지 확인
    const existing = await prisma.reportSchedule.findUnique({
      where: {
        workspaceId_periodType: {
          workspaceId,
          periodType: data.periodType,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `이미 ${data.periodType === 'WEEKLY' ? '주간' : '월간'} 스케줄이 존재합니다.` },
        { status: 400 }
      )
    }

    // 다음 실행 시간 계산
    const nextRunAt = calculateNextRunAt(
      data.periodType,
      data.scheduleDay,
      data.scheduleHour,
      data.timezone
    )

    const schedule = await prisma.reportSchedule.create({
      data: {
        workspaceId,
        name: data.name,
        periodType: data.periodType,
        scheduleDay: data.scheduleDay,
        scheduleHour: data.scheduleHour,
        timezone: data.timezone,
        reportConfig: data.reportConfig || DEFAULT_REPORT_CONFIG,
        emailEnabled: data.emailEnabled,
        slackEnabled: data.slackEnabled,
        slackWebhook: data.slackWebhook,
        nextRunAt,
      },
      include: {
        recipients: true,
      },
    })

    return NextResponse.json({ schedule }, { status: 201 })
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
    console.error('Failed to create schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
