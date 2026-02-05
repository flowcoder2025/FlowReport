import { NextRequest, NextResponse } from 'next/server'
import { ChannelProvider } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireWorkspaceEditor } from '@/lib/permissions/workspace-middleware'
import { parseCsv, validateCsvData } from '@/lib/csv/upload-handler'
import { csvToMetrics, getDateRange } from '@/lib/services/csv-to-snapshot'
import { upsertDailySnapshots } from '@/lib/services/metric-snapshot'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

export async function POST(request: NextRequest) {
  try {
    // 파라미터 추출
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const channel = searchParams.get('channel') as ChannelProvider | null

    // 필수 파라미터 확인
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      )
    }

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Valid channels: ${VALID_CHANNELS.join(', ')}` },
        { status: 400 }
      )
    }

    // 권한 확인
    await requireWorkspaceEditor(workspaceId)

    // 세션에서 사용자 ID 가져오기
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // FormData에서 파일 추출
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 파일 타입 확인
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // 파일 내용 읽기
    const csvContent = await file.text()

    // CSV 파싱
    const records = parseCsv(csvContent)
    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      )
    }

    // 데이터 검증
    const validationResult = validateCsvData(channel, records)
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationResult.errors?.slice(0, 10), // 최대 10개 오류만 반환
          totalErrors: validationResult.errors?.length || 0,
        },
        { status: 400 }
      )
    }

    // CsvUpload 레코드 생성
    const csvUpload = await prisma.csvUpload.create({
      data: {
        workspaceId,
        channel,
        filename: file.name,
        fileSize: file.size,
        rowCount: records.length,
        columnMapping: {},
        status: 'PROCESSING',
        createdBy: userId,
      },
    })

    try {
      // CSV 데이터를 MetricData로 변환
      const metrics = csvToMetrics(channel, validationResult.data || records)

      if (metrics.length === 0) {
        throw new Error('No valid metrics data converted from CSV')
      }

      // MetricSnapshot 저장
      const saveResult = await upsertDailySnapshots(
        {
          workspaceId,
          source: 'CSV_UPLOAD',
          csvUploadId: csvUpload.id,
        },
        metrics
      )

      // 날짜 범위 가져오기
      const dateRange = getDateRange(validationResult.data || records)

      // CsvUpload 상태 업데이트
      await prisma.csvUpload.update({
        where: { id: csvUpload.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        uploadId: csvUpload.id,
        rowsProcessed: records.length,
        snapshotsCreated: saveResult.created,
        snapshotsUpdated: saveResult.updated,
        dateRange: dateRange
          ? {
              start: dateRange.startDate.toISOString().split('T')[0],
              end: dateRange.endDate.toISOString().split('T')[0],
            }
          : null,
      })
    } catch (error) {
      // 처리 실패 시 상태 업데이트
      const errorMessage = error instanceof Error ? error.message : 'Processing failed'
      await prisma.csvUpload.update({
        where: { id: csvUpload.id },
        data: {
          status: 'FAILED',
          validationErrors: { error: errorMessage },
        },
      })

      throw error
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('CSV upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// CSV 템플릿 다운로드
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') as ChannelProvider | null

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Valid channels: ${VALID_CHANNELS.join(', ')}` },
        { status: 400 }
      )
    }

    // 채널별 템플릿
    const templates: Record<ChannelProvider, string> = {
      SMARTSTORE:
        'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total\n2024-01-01,1000000,900000,10,15,100000,0,0,0,0,10,850000,50000',
      COUPANG:
        'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total\n2024-01-01,1000000,900000,10,15,100000,0,0,0,0,10,850000,50000',
      META_INSTAGRAM:
        'date,uploads_count,views,reach,engagement,followers,likes,comments,shares\n2024-01-01,1,5000,3000,500,10000,400,80,20',
      META_FACEBOOK:
        'date,uploads_count,views,reach,engagement,followers,likes,comments,shares\n2024-01-01,1,5000,3000,500,10000,400,80,20',
      YOUTUBE:
        'date,uploads_count,views,reach,engagement,followers,likes,comments,shares\n2024-01-01,1,10000,8000,1000,5000,800,150,50',
      GA4: 'date,sessions,users,new_users,pageviews,avg_session_duration,bounce_rate\n2024-01-01,1000,800,200,3000,120,45.5',
      NAVER_BLOG:
        'date,posts_count,visitors,pageviews,avg_duration\n2024-01-01,1,500,800,180',
      NAVER_KEYWORDS:
        'keyword,impressions,clicks,ctr,position\n브랜드명,10000,500,5.0,3.5',
      GOOGLE_SEARCH_CONSOLE:
        'keyword,impressions,clicks,ctr,position\nbrand name,10000,500,5.0,3.5',
    }

    const template = templates[channel]

    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${channel.toLowerCase()}_template.csv"`,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
