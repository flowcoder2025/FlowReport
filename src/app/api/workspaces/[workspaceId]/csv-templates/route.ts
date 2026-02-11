import { NextRequest, NextResponse } from 'next/server'
import { ChannelProvider } from '@prisma/client'
import { requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'

// 유효한 채널 목록
const VALID_CHANNELS: ChannelProvider[] = [
  'SMARTSTORE',
  'COUPANG',
  'META_INSTAGRAM',
  'META_FACEBOOK',
  'YOUTUBE',
  'GA4',
  'NAVER_BLOG',
  'NAVER_KEYWORDS',
  'GOOGLE_SEARCH_CONSOLE',
]

// 채널별 CSV 템플릿 정의 (헤더 + 샘플 데이터)
const CSV_TEMPLATES: Record<ChannelProvider, { headers: string; sample: string }> = {
  SMARTSTORE: {
    headers: 'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total',
    sample: '2026-02-10,1000000,900000,10,15,100000,0,0,0,0,10,850000,50000',
  },
  COUPANG: {
    headers: 'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total',
    sample: '2026-02-10,1000000,900000,10,15,100000,0,0,0,0,10,850000,50000',
  },
  META_INSTAGRAM: {
    headers: 'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    sample: '2026-02-10,1,5000,3000,500,10000,400,80,20',
  },
  META_FACEBOOK: {
    headers: 'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    sample: '2026-02-10,1,5000,3000,500,10000,400,80,20',
  },
  YOUTUBE: {
    headers: 'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    sample: '2026-02-10,1,10000,8000,1000,5000,800,150,50',
  },
  GA4: {
    headers: 'date,sessions,users,new_users,pageviews,avg_session_duration,bounce_rate',
    sample: '2026-02-10,1000,800,200,3000,120,45.5',
  },
  NAVER_BLOG: {
    headers: 'date,visitors,pageviews,avg_time_on_page,subscribers,new_subscribers,comments,likes,shares,search_visitors,direct_visitors,social_visitors,referral_visitors,posts_published,top_post_url,top_post_views',
    sample: '2026-02-10,1500,3200,180,5000,50,25,100,15,800,400,200,100,3,https://blog.naver.com/example/123,500',
  },
  NAVER_KEYWORDS: {
    headers: 'keyword,impressions,clicks,ctr,position',
    sample: '브랜드명,10000,500,5.0,3.5',
  },
  GOOGLE_SEARCH_CONSOLE: {
    headers: 'keyword,impressions,clicks,ctr,position',
    sample: 'brand name,10000,500,5.0,3.5',
  },
}

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
    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Valid channels: ${VALID_CHANNELS.join(', ')}` },
        { status: 400 }
      )
    }

    const template = CSV_TEMPLATES[channel]
    const csvContent = `${template.headers}\n${template.sample}`

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
