/**
 * Report Generator
 *
 * PDF 리포트 생성 로직
 */
import { prisma } from '@/lib/db'
import type { ReportPeriod } from '@prisma/client'
import type { MonthlyReportData } from '@/lib/export/pdf-generator'
import type { ReportGenerationResult } from '../types'
import { buildMonthlyReportData, buildWeeklyReportData } from './data-builder'

/**
 * 리포트 생성 및 DB 기록
 */
export async function generateReport(
  workspaceId: string,
  scheduleId: string,
  periodType: ReportPeriod,
  periodStart: Date,
  periodEnd: Date
): Promise<ReportGenerationResult> {
  // GeneratedReport 레코드 생성
  const report = await prisma.generatedReport.create({
    data: {
      workspaceId,
      scheduleId,
      periodType,
      periodStart,
      periodEnd,
      status: 'GENERATING',
    },
  })

  try {
    // PDF 생성 (lazy load)
    const { generateMonthlyPDF } = await import('@/lib/export/pdf-generator')

    // 데이터 빌드 및 PDF용 형식 변환
    let pdfData: MonthlyReportData

    if (periodType === 'MONTHLY') {
      pdfData = await buildMonthlyReportData(workspaceId, periodStart.getFullYear(), periodStart.getMonth() + 1)
    } else {
      // Weekly 데이터를 Monthly 형식으로 변환 (현재 MonthlyReportDocument만 있음)
      const weeklyData = await buildWeeklyReportData(workspaceId, periodStart, periodEnd)
      pdfData = {
        ...weeklyData,
        period: {
          year: periodStart.getFullYear(),
          month: periodStart.getMonth() + 1,
          start: periodStart,
          end: periodEnd,
        },
      }
    }

    const pdfBuffer = await generateMonthlyPDF(pdfData)

    // 상태 업데이트
    await prisma.generatedReport.update({
      where: { id: report.id },
      data: { status: 'GENERATED' },
    })

    return {
      success: true,
      reportId: report.id,
      pdfBuffer,
    }
  } catch (error) {
    // 실패 기록
    await prisma.generatedReport.update({
      where: { id: report.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return {
      success: false,
      reportId: report.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 테스트 리포트 생성 (DB 기록 없이)
 */
export async function generateTestReport(
  workspaceId: string,
  periodType: ReportPeriod
): Promise<{ success: boolean; pdfBuffer?: Buffer; error?: string }> {
  try {
    const now = new Date()

    // 테스트용 기간 계산 (현재 달/주)
    let periodStart: Date
    let periodEnd: Date

    if (periodType === 'MONTHLY') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else {
      const dayOfWeek = now.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      periodStart = new Date(now)
      periodStart.setDate(now.getDate() - daysToMonday)
      periodStart.setHours(0, 0, 0, 0)
      periodEnd = new Date(periodStart)
      periodEnd.setDate(periodStart.getDate() + 6)
      periodEnd.setHours(23, 59, 59, 999)
    }

    const { generateMonthlyPDF } = await import('@/lib/export/pdf-generator')

    let pdfData: MonthlyReportData

    if (periodType === 'MONTHLY') {
      pdfData = await buildMonthlyReportData(workspaceId, periodStart.getFullYear(), periodStart.getMonth() + 1)
    } else {
      const weeklyData = await buildWeeklyReportData(workspaceId, periodStart, periodEnd)
      pdfData = {
        ...weeklyData,
        period: {
          year: periodStart.getFullYear(),
          month: periodStart.getMonth() + 1,
          start: periodStart,
          end: periodEnd,
        },
      }
    }

    const pdfBuffer = await generateMonthlyPDF(pdfData)

    return { success: true, pdfBuffer }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
