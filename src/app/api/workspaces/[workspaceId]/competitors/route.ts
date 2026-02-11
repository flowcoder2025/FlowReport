import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ChannelProvider } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'

const createCompetitorSchema = z.object({
  name: z.string().min(1, '경쟁사 이름을 입력해주세요.'),
  platform: z.nativeEnum(ChannelProvider),
  channelId: z.string().min(1, '채널 ID를 입력해주세요.'),
  channelUrl: z.string().url().optional().nullable(),
  followers: z.number().int().min(0).optional().nullable(),
  engagementRate: z.number().min(0).max(100).optional().nullable(),
  uploads: z.number().int().min(0).optional().nullable(),
})

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

// GET: 경쟁사 목록 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceViewer(workspaceId)

    const competitors = await prisma.competitor.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        platform: true,
        channelId: true,
        channelUrl: true,
        followers: true,
        engagementRate: true,
        uploads: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ competitors })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('List competitors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 경쟁사 생성
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = createCompetitorSchema.parse(body)

    // 중복 확인
    const existing = await prisma.competitor.findUnique({
      where: {
        workspaceId_platform_channelId: {
          workspaceId,
          platform: data.platform,
          channelId: data.channelId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 경쟁사입니다.' },
        { status: 400 }
      )
    }

    const competitor = await prisma.competitor.create({
      data: {
        workspaceId,
        name: data.name,
        platform: data.platform,
        channelId: data.channelId,
        channelUrl: data.channelUrl,
        followers: data.followers,
        engagementRate: data.engagementRate,
        uploads: data.uploads,
      },
      select: {
        id: true,
        name: true,
        platform: true,
        channelId: true,
        channelUrl: true,
        followers: true,
        engagementRate: true,
        uploads: true,
        lastSyncAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ competitor }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Create competitor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
