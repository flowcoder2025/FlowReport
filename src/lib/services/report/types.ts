/**
 * Report Service Types
 */
import type { ReportPeriod, ReportStatus } from '@prisma/client'
import type { MonthlyReportData } from '@/lib/export/pdf-generator'

export interface ReportPeriodRange {
  start: Date
  end: Date
  label: string
}

export interface ReportScheduleConfig {
  sections: string[]
  includeCharts?: boolean
  includeTrends?: boolean
}

export interface ScheduleInfo {
  workspaceId: string
  scheduleId: string
  periodType: ReportPeriod
  scheduleDay: number
  scheduleHour: number
  timezone: string
  reportConfig: ReportScheduleConfig
  emailEnabled: boolean
  slackEnabled: boolean
  slackWebhook?: string | null
}

export interface GenerateReportOptions {
  workspaceId: string
  scheduleId: string
  periodType: ReportPeriod
  periodStart: Date
  periodEnd: Date
}

export interface ReportGenerationResult {
  success: boolean
  reportId?: string
  pdfBuffer?: Buffer
  error?: string
}

export interface DistributionResult {
  emailsSent: number
  slackSent: boolean
  errors: string[]
}

export type WeeklyReportData = Omit<MonthlyReportData, 'period'> & {
  period: {
    year: number
    weekNumber: number
    start: Date
    end: Date
  }
}

export type ReportData = MonthlyReportData | WeeklyReportData
