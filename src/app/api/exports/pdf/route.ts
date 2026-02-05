import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { generateMonthlyPDF, MonthlyReportData } from '@/lib/export/pdf-generator'
import { prisma } from '@/lib/db'

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
    const periodEnd = new Date(year, month, 0)

    // Build report data (in production, fetch from MetricSnapshots)
    const reportData: MonthlyReportData = {
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
      kpis: [
        { label: '총 매출', value: 52000000, previousValue: 48000000, change: 8.3, format: 'currency' },
        { label: 'MAU', value: 35000, previousValue: 32000, change: 9.4, format: 'number' },
        { label: '총 도달', value: 520000, previousValue: 480000, change: 8.3, format: 'number' },
        { label: '회원가입', value: 620, previousValue: 580, change: 6.9, format: 'number' },
      ],
      channelMix: [
        { name: '스마트스토어', percentage: 42 },
        { name: '쿠팡', percentage: 38 },
        { name: '자사몰', percentage: 20 },
      ],
      snsPerformance: [
        { channel: 'Instagram', followers: 12800, engagement: 4.2 },
        { channel: 'Facebook', followers: 4350, engagement: 1.8 },
        { channel: 'YouTube', followers: 2300, engagement: 5.1 },
      ],
      insights: {
        achievements: [
          '매출 전월 대비 8.3% 증가',
          '인스타그램 팔로워 2.4% 성장',
          '전환율 0.2%p 개선',
        ],
        improvements: [
          '자사몰 매출 비중 하락',
          '블로그 트래픽 정체',
          '신규 고객 획득 비용 증가',
        ],
        nextMonthFocus: [
          '자사몰 프로모션 강화',
          'SEO 최적화 진행',
          '신규 콘텐츠 포맷 테스트',
        ],
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
