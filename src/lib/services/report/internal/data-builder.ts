/**
 * Report Data Builder
 *
 * 리포트용 데이터 조회 및 구성
 */
import { prisma } from '@/lib/db'
import type { MonthlyReportData } from '@/lib/export/pdf-generator'
import type { WeeklyReportData, ReportPeriodRange } from '../types'

import { CHANNEL_LABELS, CHANNEL_GROUPS } from '@/constants'

// SSOT: CHANNEL_LABELS를 참조 (string 키 접근 허용)
const CHANNEL_NAMES: Record<string, string> = { ...CHANNEL_LABELS }

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export async function buildMonthlyReportData(
  workspaceId: string,
  year: number,
  month: number
): Promise<MonthlyReportData> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999)
  const prevPeriodStart = new Date(year, month - 2, 1)
  const prevPeriodEnd = new Date(year, month - 1, 0, 23, 59, 59, 999)

  // TODO: 월간 리포트 전용 필드 추가 예정
  // - YoY (Year-over-Year) 비교: 전년 동월 대비 성장률
  // - 월별 트렌드: 최근 6개월 추이 그래프 데이터
  // - 분기별 집계: 현재 분기 내 위치 및 분기 목표 달성률
  // - 월간 하이라이트: 최고 성과 콘텐츠/캠페인 요약
  // - 예산 대비 실적: 월간 마케팅 예산 소진율 (예산 데이터 연동 필요)
  const yearOverYearStart = new Date(year - 1, month - 1, 1)
  const yearOverYearEnd = new Date(year - 1, month, 0, 23, 59, 59, 999)

  const [currentSnapshots, previousSnapshots, yearOverYearSnapshots, insightNotes] = await Promise.all([
    prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: 'MONTHLY',
        periodStart: { gte: periodStart, lte: periodEnd },
      },
      include: { connection: true },
    }),
    prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: 'MONTHLY',
        periodStart: { gte: prevPeriodStart, lte: prevPeriodEnd },
      },
      include: { connection: true },
    }),
    // YoY (Year-over-Year) 비교를 위한 전년 동월 데이터
    prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: 'MONTHLY',
        periodStart: { gte: yearOverYearStart, lte: yearOverYearEnd },
      },
      include: { connection: true },
    }),
    prisma.insightNote.findMany({
      where: {
        workspaceId,
        periodType: 'MONTHLY',
        periodStart: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // YoY 메트릭 집계 (월간 리포트 전용)
  const yearOverYearMetrics = aggregateMetrics(yearOverYearSnapshots)

  const currentMetrics = aggregateMetrics(currentSnapshots)
  const previousMetrics = aggregateMetrics(previousSnapshots)
  const hasData = currentSnapshots.length > 0

  return {
    workspace: {
      name: workspace.name,
      description: workspace.description || undefined,
    },
    period: {
      year,
      month,
      start: periodStart,
      end: periodEnd,
    },
    kpis: hasData ? buildKpis(currentMetrics, previousMetrics) : getPlaceholderKpis(),
    channelMix: hasData ? buildChannelMix(currentSnapshots) : getPlaceholderChannelMix(),
    snsPerformance: hasData ? buildSnsPerformance(currentSnapshots) : getPlaceholderSnsPerformance(),
    insights: hasData ? buildInsights(insightNotes) : getPlaceholderInsights(),
  }
}

export async function buildWeeklyReportData(
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<WeeklyReportData> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  // 이전 주 계산
  const prevPeriodEnd = new Date(periodStart)
  prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1)
  const prevPeriodStart = new Date(prevPeriodEnd)
  prevPeriodStart.setDate(prevPeriodStart.getDate() - 6)

  const [currentSnapshots, previousSnapshots, insightNotes] = await Promise.all([
    prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: 'WEEKLY',
        periodStart: { gte: periodStart, lte: periodEnd },
      },
      include: { connection: true },
    }),
    prisma.metricSnapshot.findMany({
      where: {
        workspaceId,
        periodType: 'WEEKLY',
        periodStart: { gte: prevPeriodStart, lte: prevPeriodEnd },
      },
      include: { connection: true },
    }),
    prisma.insightNote.findMany({
      where: {
        workspaceId,
        periodType: 'WEEKLY',
        periodStart: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const currentMetrics = aggregateMetrics(currentSnapshots)
  const previousMetrics = aggregateMetrics(previousSnapshots)
  const hasData = currentSnapshots.length > 0
  const weekNumber = getWeekNumber(periodStart)

  return {
    workspace: {
      name: workspace.name,
      description: workspace.description || undefined,
    },
    period: {
      year: periodStart.getFullYear(),
      weekNumber,
      start: periodStart,
      end: periodEnd,
    },
    kpis: hasData ? buildKpis(currentMetrics, previousMetrics) : getPlaceholderKpis(),
    channelMix: hasData ? buildChannelMix(currentSnapshots) : getPlaceholderChannelMix(),
    snsPerformance: hasData ? buildSnsPerformance(currentSnapshots) : getPlaceholderSnsPerformance(),
    insights: hasData ? buildInsights(insightNotes) : getPlaceholderInsights(),
  }
}

export function getMonthlyPeriodLabel(year: number, month: number): string {
  return `${year}년 ${MONTH_NAMES[month - 1]}`
}

export function getWeeklyPeriodLabel(start: Date, end: Date): string {
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${start.getFullYear()}년 ${formatDate(start)} ~ ${formatDate(end)}`
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

function aggregateMetrics(
  snapshots: { data: unknown; connection: { provider: string } | null }[]
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const snapshot of snapshots) {
    const data = snapshot.data as Record<string, number | null>
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && typeof value === 'number') {
        result[key] = (result[key] || 0) + value
      }
    }
  }
  return result
}

function buildKpis(
  current: Record<string, number>,
  previous: Record<string, number>
): MonthlyReportData['kpis'] {
  const kpis: MonthlyReportData['kpis'] = []

  if (current.revenue !== undefined) {
    const prevValue = previous.revenue || 0
    const change = prevValue > 0 ? ((current.revenue - prevValue) / prevValue) * 100 : 0
    kpis.push({ label: '총 매출', value: current.revenue, previousValue: prevValue, change, format: 'currency' })
  }

  if (current.totalUsers !== undefined) {
    const prevValue = previous.totalUsers || 0
    const change = prevValue > 0 ? ((current.totalUsers - prevValue) / prevValue) * 100 : 0
    kpis.push({ label: '총 방문자', value: current.totalUsers, previousValue: prevValue, change, format: 'number' })
  }

  const reach = current.reach || current.impressions || 0
  const prevReach = previous.reach || previous.impressions || 0
  if (reach > 0) {
    const change = prevReach > 0 ? ((reach - prevReach) / prevReach) * 100 : 0
    kpis.push({ label: '총 도달', value: reach, previousValue: prevReach, change, format: 'number' })
  }

  if (current.engagements !== undefined) {
    const prevValue = previous.engagements || 0
    const change = prevValue > 0 ? ((current.engagements - prevValue) / prevValue) * 100 : 0
    kpis.push({ label: '총 참여', value: current.engagements, previousValue: prevValue, change, format: 'number' })
  }

  return kpis
}

function buildChannelMix(
  snapshots: { data: unknown; connection: { provider: string } | null }[]
): MonthlyReportData['channelMix'] {
  const revenueByChannel: Record<string, number> = {}
  let totalRevenue = 0

  for (const snapshot of snapshots) {
    const data = snapshot.data as Record<string, number | null>
    const provider = snapshot.connection?.provider
    if (provider && data.revenue) {
      const channelName = CHANNEL_NAMES[provider] || provider
      revenueByChannel[channelName] = (revenueByChannel[channelName] || 0) + data.revenue
      totalRevenue += data.revenue
    }
  }

  if (totalRevenue === 0) return getPlaceholderChannelMix()

  return Object.entries(revenueByChannel)
    .map(([name, revenue]) => ({ name, percentage: Math.round((revenue / totalRevenue) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
}

function buildSnsPerformance(
  snapshots: { data: unknown; connection: { provider: string } | null }[]
): MonthlyReportData['snsPerformance'] {
  const snsChannels: string[] = [...CHANNEL_GROUPS.SNS]
  const result: MonthlyReportData['snsPerformance'] = []

  for (const snapshot of snapshots) {
    const provider = snapshot.connection?.provider
    if (!provider || !snsChannels.includes(provider)) continue

    const data = snapshot.data as Record<string, number | null>
    result.push({
      channel: CHANNEL_NAMES[provider] || provider,
      followers: data.followers || 0,
      engagement: data.engagementRate || data.engagement || 0,
    })
  }

  return result.length > 0 ? result : getPlaceholderSnsPerformance()
}

function buildInsights(notes: { noteType: string; content: string }[]): MonthlyReportData['insights'] {
  const achievements: string[] = []
  const improvements: string[] = []
  const nextMonthFocus: string[] = []

  for (const note of notes) {
    switch (note.noteType) {
      case 'BEST_PRACTICE':
        achievements.push(note.content)
        break
      case 'IMPROVEMENT':
        improvements.push(note.content)
        break
      case 'CAUSE':
        nextMonthFocus.push(note.content)
        break
    }
  }

  return {
    achievements: achievements.length > 0 ? achievements.slice(0, 5) : ['데이터 수집 중'],
    improvements: improvements.length > 0 ? improvements.slice(0, 5) : ['분석 진행 중'],
    nextMonthFocus: nextMonthFocus.length > 0 ? nextMonthFocus.slice(0, 5) : ['전략 수립 중'],
  }
}

function getPlaceholderKpis(): MonthlyReportData['kpis'] {
  return [
    { label: '총 매출', value: 0, previousValue: 0, change: 0, format: 'currency' },
    { label: '총 방문자', value: 0, previousValue: 0, change: 0, format: 'number' },
    { label: '총 도달', value: 0, previousValue: 0, change: 0, format: 'number' },
    { label: '총 참여', value: 0, previousValue: 0, change: 0, format: 'number' },
  ]
}

function getPlaceholderChannelMix(): MonthlyReportData['channelMix'] {
  return [{ name: '데이터 없음', percentage: 100 }]
}

function getPlaceholderSnsPerformance(): MonthlyReportData['snsPerformance'] {
  return [{ channel: '채널 연결 필요', followers: 0, engagement: 0 }]
}

function getPlaceholderInsights(): MonthlyReportData['insights'] {
  return {
    achievements: ['데이터가 수집되면 자동으로 업데이트됩니다'],
    improvements: ['채널을 연결하여 데이터를 수집해주세요'],
    nextMonthFocus: ['리포트 설정에서 KPI를 구성해주세요'],
  }
}
