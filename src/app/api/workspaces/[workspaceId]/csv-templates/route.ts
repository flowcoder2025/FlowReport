import { NextRequest, NextResponse } from 'next/server'
import { ChannelProvider } from '@prisma/client'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import {
  VALID_CSV_CHANNELS,
  getCsvTemplateContent,
  isValidCsvChannel,
} from '@/constants'

/**
 * GET /api/workspaces/[workspaceId]/csv-templates?channel=NAVER_BLOG
 * 채널별 CSV 템플릿 다운로드
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') as ChannelProvider | null

    // 권한 확인 (뷰어 이상)
    await requireWorkspaceViewer(workspaceId)

    // 채널 파라미터 검증
    if (!channel || !isValidCsvChannel(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Valid channels: ${VALID_CSV_CHANNELS.join(', ')}` },
        { status: 400 }
      )
    }

    const csvContent = getCsvTemplateContent(channel)

    // CSV 파일 응답
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${channel.toLowerCase()}_template.csv"`,
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
    console.error('CSV template download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
