/**
 * Report Cron Job
 *
 * 매 시간 실행되어 예정된 리포트를 생성하고 배포합니다.
 * Vercel Cron: 0 * * * * (매시 정각)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  generateReport,
  distributeReport,
  calculateNextRunAt,
  calculateReportPeriod,
  getMonthlyPeriodLabel,
  getWeeklyPeriodLabel,
} from '@/lib/services/report'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5분

export async function GET(request: NextRequest) {
  try {
    // Cron secret 검증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // 실행이 필요한 스케줄 조회
    const dueSchedules = await prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      include: {
        workspace: { select: { name: true } },
        recipients: { where: { isActive: true } },
      },
    })

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        message: 'No schedules due for execution',
        processedAt: now.toISOString(),
      })
    }

    const results: Array<{
      scheduleId: string
      workspaceName: string
      periodType: string
      status: 'success' | 'failed'
      error?: string
    }> = []

    for (const schedule of dueSchedules) {
      try {
        // 리포트 기간 계산
        const period = calculateReportPeriod(schedule.periodType, now)
        const periodLabel = schedule.periodType === 'MONTHLY'
          ? getMonthlyPeriodLabel(period.start.getFullYear(), period.start.getMonth() + 1)
          : getWeeklyPeriodLabel(period.start, period.end)

        // 리포트 생성
        const genResult = await generateReport(
          schedule.workspaceId,
          schedule.id,
          schedule.periodType,
          period.start,
          period.end
        )

        if (!genResult.success || !genResult.pdfBuffer) {
          throw new Error(genResult.error || 'Failed to generate report')
        }

        // 리포트 배포
        await distributeReport(
          genResult.reportId!,
          schedule.id,
          schedule.workspace.name,
          schedule.periodType,
          periodLabel,
          genResult.pdfBuffer
        )

        // 다음 실행 시간 계산 및 업데이트
        const nextRunAt = calculateNextRunAt(
          schedule.periodType,
          schedule.scheduleDay,
          schedule.scheduleHour,
          schedule.timezone,
          now
        )

        await prisma.reportSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt,
          },
        })

        results.push({
          scheduleId: schedule.id,
          workspaceName: schedule.workspace.name,
          periodType: schedule.periodType,
          status: 'success',
        })
      } catch (error) {
        results.push({
          scheduleId: schedule.id,
          workspaceName: schedule.workspace.name,
          periodType: schedule.periodType,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      message: 'Cron job completed',
      processedAt: now.toISOString(),
      totalSchedules: dueSchedules.length,
      results,
    })
  } catch (error) {
    console.error('Report cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
