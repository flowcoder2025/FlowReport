/**
 * Report Schedules Hook
 *
 * 리포트 스케줄 관리 훅
 */
import useSWR from 'swr'
import type { ReportPeriod, ReportStatus } from '@prisma/client'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export interface ReportSchedule {
  id: string
  workspaceId: string
  name: string
  periodType: ReportPeriod
  scheduleDay: number
  scheduleHour: number
  timezone: string
  reportConfig: {
    sections?: string[]
    includeCharts?: boolean
    includeTrends?: boolean
  }
  emailEnabled: boolean
  slackEnabled: boolean
  slackWebhook: string | null
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
  updatedAt: string
  recipients: ReportRecipient[]
  _count?: { reports: number }
}

export interface ReportRecipient {
  id: string
  email: string
  name: string | null
  isActive: boolean
  createdAt: string
}

export interface GeneratedReport {
  id: string
  periodType: ReportPeriod
  periodStart: string
  periodEnd: string
  status: ReportStatus
  emailsSent: number
  slackSent: boolean
  error: string | null
  createdAt: string
  completedAt: string | null
}

export function useReportSchedules(workspaceId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ schedules: ReportSchedule[] }>(
    `/api/workspaces/${workspaceId}/reports/schedules`,
    fetcher
  )

  return {
    schedules: data?.schedules || [],
    isLoading,
    error,
    mutate,
  }
}

export function useReportSchedule(workspaceId: string, scheduleId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ schedule: ReportSchedule & { reports: GeneratedReport[] } }>(
    scheduleId ? `/api/workspaces/${workspaceId}/reports/schedules/${scheduleId}` : null,
    fetcher
  )

  return {
    schedule: data?.schedule,
    isLoading,
    error,
    mutate,
  }
}

export function useReportHistory(workspaceId: string, limit = 20) {
  const { data, error, isLoading } = useSWR<{
    reports: (GeneratedReport & { schedule: { name: string; periodType: ReportPeriod } })[]
    pagination: { hasMore: boolean; nextCursor: string | null }
  }>(`/api/workspaces/${workspaceId}/reports/history?limit=${limit}`, fetcher)

  return {
    reports: data?.reports || [],
    pagination: data?.pagination,
    isLoading,
    error,
  }
}
