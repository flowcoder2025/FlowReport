import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ChannelProvider } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'

const updateCompetitorSchema = z.object({
  name: z.string().min(1).optional(),
  platform: z.nativeEnum(ChannelProvider).optional(),
  channelId: z.string().min(1).optional(),
  channelUrl: z.string().url().optional().nullable(),
  followers: z.number().int().min(0).optional().nullable(),
  engagementRate: z.number().min(0).max(100).optional().nullable(),
  uploads: z.number().int().min(0).optional().nullable(),
})

interface RouteParams {
  params: Promise<{ workspaceId: string; competitorId: string }>
}

// GET: 경쟁사 상세 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, competitorId } = await params
    await requireWorkspaceViewer(workspaceId)

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: competitorId,
        workspaceId,
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
        updatedAt: true,
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: '경쟁사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ competitor })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Get competitor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 경쟁사 수정
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, competitorId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: competitorId,
        workspaceId,
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: '경쟁사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updateCompetitorSchema.parse(body)

    // 채널 정보 변경 시 중복 확인
    if (data.platform || data.channelId) {
      const newPlatform = data.platform || competitor.platform
      const newChannelId = data.channelId || competitor.channelId

      const existing = await prisma.competitor.findFirst({
        where: {
          workspaceId,
          platform: newPlatform,
          channelId: newChannelId,
          NOT: { id: competitorId },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: '이미 등록된 경쟁사입니다.' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.competitor.update({
      where: { id: competitorId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.platform !== undefined && { platform: data.platform }),
        ...(data.channelId !== undefined && { channelId: data.channelId }),
        ...(data.channelUrl !== undefined && { channelUrl: data.channelUrl }),
        ...(data.followers !== undefined && { followers: data.followers }),
        ...(data.engagementRate !== undefined && { engagementRate: data.engagementRate }),
        ...(data.uploads !== undefined && { uploads: data.uploads }),
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
        updatedAt: true,
      },
    })

    return NextResponse.json({ competitor: updated })
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
    console.error('Update competitor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 경쟁사 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, competitorId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: competitorId,
        workspaceId,
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: '경쟁사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.competitor.delete({
      where: { id: competitorId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Delete competitor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
