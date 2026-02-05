import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { generateMonthlyPDF, MonthlyReportData } from '@/lib/export/pdf-generator'
import { prisma } from '@/lib/db'

// 채널 이름 매핑
const CHANNEL_NAMES: Record<string, string> = {
  GA4: 'GA4',
  META_INSTAGRAM: 'Instagram',
  META_FACEBOOK: 'Facebook',
  YOUTUBE: 'YouTube',
  SMARTSTORE: '스마트스토어',
  COUPANG: '쿠팡',
  NAVER_BLOG: '네이버 블로그',
  GOOGLE_SEARCH_CONSOLE: 'Google Search Console',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const period = searchParams.get('period') // YYYY-MM format

    if (!workspaceId || !period) {
      return NextResponse.json(
        { error: 'Missing workspaceId or period parameter' },
        { status: 400 }
      )
    }

    // Validate period format
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: 'Invalid period format. Use YYYY-MM' },
        { status: 400 }
      )
    }

    // Check permission
    await requireWorkspaceViewer(workspaceId)

    // Get workspace info
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse period
    const [year, month] = period.split('-').map(Number)
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999)

    // 이전 달 계산
    const prevPeriodStart = new Date(year, month - 2, 1)
    const prevPeriodEnd = new Date(year, month - 1, 0, 23, 59, 59, 999)

    // 월간 스냅샷 조회
    const [currentSnapshots, previousSnapshots] = await Promise.all([
      prisma.metricSnapshot.findMany({
        where: {
          workspaceId,
          periodType: 'MONTHLY',
          periodStart: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        include: {
          connection: true,
        },
      }),
      prisma.metricSnapshot.findMany({
        where: {
          workspaceId,
          periodType: 'MONTHLY',
          periodStart: {
            gte: prevPeriodStart,
            lte: prevPeriodEnd,
          },
        },
        include: {
          connection: true,
        },
      }),
    ])

    // InsightNote 조회
    const insightNotes = await prisma.insightNote.findMany({
      where: {
        workspaceId,
        periodType: 'MONTHLY',
        periodStart: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 메트릭 집계
    const currentMetrics = aggregateMetrics(currentSnapshots)
    const previousMetrics = aggregateMetrics(previousSnapshots)

    // KPI 계산
    const kpis = buildKpis(currentMetrics, previousMetrics)

    // 채널별 매출 비중 (커머스 채널만)
    const channelMix = buildChannelMix(currentSnapshots)

    // SNS 성과 (SNS 채널만)
    const snsPerformance = buildSnsPerformance(currentSnapshots)

    // Insights 정리
    const insights = buildInsights(insightNotes)

    // 데이터가 없는 경우 placeholder 사용
    const hasData = currentSnapshots.length > 0

    const reportData: MonthlyReportData = hasData
      ? {
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
          kpis: kpis.length > 0 ? kpis : getPlaceholderKpis(),
          channelMix: channelMix.length > 0 ? channelMix : getPlaceholderChannelMix(),
          snsPerformance: snsPerformance.length > 0 ? snsPerformance : getPlaceholderSnsPerformance(),
          insights: insights,
        }
      : {
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
          kpis: getPlaceholderKpis(),
          channelMix: getPlaceholderChannelMix(),
          snsPerformance: getPlaceholderSnsPerformance(),
          insights: {
            achievements: ['데이터가 수집되면 자동으로 업데이트됩니다'],
            improvements: ['채널을 연결하여 데이터를 수집해주세요'],
            nextMonthFocus: ['리포트 설정에서 KPI를 구성해주세요'],
          },
        }

    // Generate PDF
    const pdfBuffer = await generateMonthlyPDF(reportData)

    // Return PDF file
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${workspace.name}-${period}.pdf"`,
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
    console.error('Export PDF error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 스냅샷에서 메트릭 집계
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

// KPI 구성
function buildKpis(
  current: Record<string, number>,
  previous: Record<string, number>
): MonthlyReportData['kpis'] {
  const kpis: MonthlyReportData['kpis'] = []

  // 총 매출 (revenue)
  if (current.revenue !== undefined) {
    const prevValue = previous.revenue || 0
    const change = prevValue > 0 ? ((current.revenue - prevValue) / prevValue) * 100 : 0
    kpis.push({
      label: '총 매출',
      value: current.revenue,
      previousValue: prevValue,
      change,
      format: 'currency',
    })
  }

  // 총 방문자 (totalUsers)
  if (current.totalUsers !== undefined) {
    const prevValue = previous.totalUsers || 0
    const change = prevValue > 0 ? ((current.totalUsers - prevValue) / prevValue) * 100 : 0
    kpis.push({
      label: '총 방문자',
      value: current.totalUsers,
      previousValue: prevValue,
      change,
      format: 'number',
    })
  }

  // 총 도달 (reach 또는 impressions)
  const reach = current.reach || current.impressions || 0
  const prevReach = previous.reach || previous.impressions || 0
  if (reach > 0) {
    const change = prevReach > 0 ? ((reach - prevReach) / prevReach) * 100 : 0
    kpis.push({
      label: '총 도달',
      value: reach,
      previousValue: prevReach,
      change,
      format: 'number',
    })
  }

  // 참여 (engagements)
  if (current.engagements !== undefined) {
    const prevValue = previous.engagements || 0
    const change = prevValue > 0 ? ((current.engagements - prevValue) / prevValue) * 100 : 0
    kpis.push({
      label: '총 참여',
      value: current.engagements,
      previousValue: prevValue,
      change,
      format: 'number',
    })
  }

  return kpis
}

// 채널별 매출 비중
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

  if (totalRevenue === 0) return []

  return Object.entries(revenueByChannel)
    .map(([name, revenue]) => ({
      name,
      percentage: Math.round((revenue / totalRevenue) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

// SNS 성과
function buildSnsPerformance(
  snapshots: { data: unknown; connection: { provider: string } | null }[]
): MonthlyReportData['snsPerformance'] {
  const snsChannels = ['META_INSTAGRAM', 'META_FACEBOOK', 'YOUTUBE']
  const result: MonthlyReportData['snsPerformance'] = []

  for (const snapshot of snapshots) {
    const provider = snapshot.connection?.provider
    if (!provider || !snsChannels.includes(provider)) continue

    const data = snapshot.data as Record<string, number | null>
    const channelName = CHANNEL_NAMES[provider] || provider

    result.push({
      channel: channelName,
      followers: data.followers || 0,
      engagement: data.engagementRate || data.engagement || 0,
    })
  }

  return result
}

// Insights 정리
function buildInsights(
  notes: { noteType: string; content: string }[]
): MonthlyReportData['insights'] {
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

// Placeholder 데이터
function getPlaceholderKpis(): MonthlyReportData['kpis'] {
  return [
    { label: '총 매출', value: 0, previousValue: 0, change: 0, format: 'currency' },
    { label: '총 방문자', value: 0, previousValue: 0, change: 0, format: 'number' },
    { label: '총 도달', value: 0, previousValue: 0, change: 0, format: 'number' },
    { label: '총 참여', value: 0, previousValue: 0, change: 0, format: 'number' },
  ]
}

function getPlaceholderChannelMix(): MonthlyReportData['channelMix'] {
  return [
    { name: '데이터 없음', percentage: 100 },
  ]
}

function getPlaceholderSnsPerformance(): MonthlyReportData['snsPerformance'] {
  return [
    { channel: '채널 연결 필요', followers: 0, engagement: 0 },
  ]
}
