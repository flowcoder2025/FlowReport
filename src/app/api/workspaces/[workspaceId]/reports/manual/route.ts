/**
 * Manual Report Generation API
 *
 * POST: 수동으로 리포트 생성 및 발송
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin } from '@/lib/permissions/workspace-middleware'
import {
  generateReport,
  distributeReport,
  getMonthlyPeriodLabel,
  getWeeklyPeriodLabel,
} from '@/lib/services/report'

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

const manualGenerateSchema = z.object({
  scheduleId: z.string(),
  periodStart: z.string().transform((s) => new Date(s)),
  periodEnd: z.string().transform((s) => new Date(s)),
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = manualGenerateSchema.parse(body)

    // 스케줄 및 워크스페이스 정보 조회
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: data.scheduleId, workspaceId },
      include: {
        workspace: { select: { name: true } },
        recipients: { where: { isActive: true } },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 리포트 생성
    const genResult = await generateReport(
      workspaceId,
      data.scheduleId,
      schedule.periodType,
      data.periodStart,
      data.periodEnd
    )

    if (!genResult.success || !genResult.pdfBuffer) {
      return NextResponse.json(
        { error: genResult.error || '리포트 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 리포트 배포 (이메일/슬랙)
    const periodLabel = schedule.periodType === 'MONTHLY'
      ? getMonthlyPeriodLabel(data.periodStart.getFullYear(), data.periodStart.getMonth() + 1)
      : getWeeklyPeriodLabel(data.periodStart, data.periodEnd)

    const distResult = await distributeReport(
      genResult.reportId!,
      schedule.id,
      schedule.workspace.name,
      schedule.periodType,
      periodLabel,
      genResult.pdfBuffer
    )

    return NextResponse.json({
      message: '리포트가 생성되고 발송되었습니다.',
      reportId: genResult.reportId,
      emailsSent: distResult.emailsSent,
      slackSent: distResult.slackSent,
      errors: distResult.errors.length > 0 ? distResult.errors : undefined,
    })
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
    console.error('Failed to generate manual report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
