import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ActionPriority } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'

// Zod 스키마 정의
const updateTemplateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').optional(),
  description: z.string().min(1, '설명을 입력해주세요.').optional(),
  priority: z.nativeEnum(ActionPriority).optional(),
  departmentUrl: z.string().min(1).optional(),
  steps: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ workspaceId: string; templateId: string }>
}

/**
 * @openapi
 * /api/workspaces/{workspaceId}/action-templates/{templateId}:
 *   get:
 *     summary: 특정 액션 템플릿 조회
 *     tags: [ActionTemplates]
 *     parameters:
 *       - name: workspaceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: templateId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 액션 템플릿 상세
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, templateId } = await params
    await requireWorkspaceViewer(workspaceId)

    const template = await prisma.actionTemplate.findFirst({
      where: {
        id: templateId,
        workspaceId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to fetch action template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @openapi
 * /api/workspaces/{workspaceId}/action-templates/{templateId}:
 *   put:
 *     summary: 액션 템플릿 수정
 *     tags: [ActionTemplates]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [HIGH, MEDIUM, LOW]
 *               departmentUrl:
 *                 type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 수정된 액션 템플릿
 *       400:
 *         description: 유효성 검사 실패
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음 또는 기본 템플릿 보호 필드 수정 시도
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, templateId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = updateTemplateSchema.parse(body)

    // Check if template exists (단일 쿼리로 존재 확인 + 업데이트)
    const existing = await prisma.actionTemplate.findFirst({
      where: {
        id: templateId,
        workspaceId,
      },
      select: {
        id: true,
        isDefault: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Prevent modifying default templates' core fields
    if (existing.isDefault) {
      const protectedFields = ['triggerType', 'triggerLevel', 'department']
      const hasProtectedField = protectedFields.some((field) => field in body)
      if (hasProtectedField) {
        return NextResponse.json(
          { error: '기본 템플릿의 핵심 필드는 수정할 수 없습니다.' },
          { status: 403 }
        )
      }
    }

    const template = await prisma.actionTemplate.update({
      where: { id: templateId },
      data,
    })

    return NextResponse.json({ template })
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
    console.error('Failed to update action template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @openapi
 * /api/workspaces/{workspaceId}/action-templates/{templateId}:
 *   delete:
 *     summary: 액션 템플릿 삭제
 *     tags: [ActionTemplates]
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음 또는 기본 템플릿 삭제 시도
 *       404:
 *         description: 템플릿을 찾을 수 없음
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, templateId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const existing = await prisma.actionTemplate.findFirst({
      where: {
        id: templateId,
        workspaceId,
      },
      select: {
        id: true,
        isDefault: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Prevent deleting default templates
    if (existing.isDefault) {
      return NextResponse.json(
        { error: '기본 템플릿은 삭제할 수 없습니다. 비활성화하세요.' },
        { status: 403 }
      )
    }

    await prisma.actionTemplate.delete({
      where: { id: templateId },
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
    console.error('Failed to delete action template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
