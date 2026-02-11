import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import {
  targetConfigSchema,
  DEFAULT_TARGET_CONFIG,
  type TargetConfig,
} from '@/lib/types/targets'

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

/**
 * @openapi
 * /api/workspaces/{workspaceId}/settings/targets:
 *   get:
 *     summary: 워크스페이스 목표값 조회
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: 목표값 설정
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceViewer(workspaceId)

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { targetConfig: true },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: '워크스페이스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 저장된 값과 기본값 병합
    const targetConfig = {
      ...DEFAULT_TARGET_CONFIG,
      ...(workspace.targetConfig as TargetConfig || {}),
    }

    return NextResponse.json({ targetConfig, defaults: DEFAULT_TARGET_CONFIG })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to fetch target config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @openapi
 * /api/workspaces/{workspaceId}/settings/targets:
 *   patch:
 *     summary: 워크스페이스 목표값 수정
 *     tags: [Settings]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               revenueGrowthRate:
 *                 type: number
 *               revenueTarget:
 *                 type: number
 *               engagementTarget:
 *                 type: number
 *               conversionTarget:
 *                 type: number
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = targetConfigSchema.parse(body)

    // 기존 설정과 병합
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { targetConfig: true },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: '워크스페이스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const existingConfig = (workspace.targetConfig as TargetConfig) || {}
    const newConfig = { ...existingConfig, ...data }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { targetConfig: newConfig },
      select: { targetConfig: true },
    })

    return NextResponse.json({
      targetConfig: {
        ...DEFAULT_TARGET_CONFIG,
        ...(updated.targetConfig as TargetConfig),
      },
      message: '목표값이 저장되었습니다.',
    })
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
    console.error('Failed to update target config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
