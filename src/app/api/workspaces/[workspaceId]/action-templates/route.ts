import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TriggerType, AlertLevel, ActionPriority, Department } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'

// Zod 스키마 정의
const createTemplateSchema = z.object({
  triggerType: z.nativeEnum(TriggerType),
  triggerLevel: z.nativeEnum(AlertLevel).default(AlertLevel.WARNING),
  title: z.string().min(1, '제목을 입력해주세요.'),
  description: z.string().min(1, '설명을 입력해주세요.'),
  priority: z.nativeEnum(ActionPriority).default(ActionPriority.MEDIUM),
  department: z.nativeEnum(Department),
  departmentUrl: z.string().min(1, '부서 URL을 입력해주세요.'),
  steps: z.array(z.string()).default([]),
})

const querySchema = z.object({
  triggerType: z.nativeEnum(TriggerType).optional(),
  department: z.nativeEnum(Department).optional(),
})

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

/**
 * @openapi
 * /api/workspaces/{workspaceId}/action-templates:
 *   get:
 *     summary: 워크스페이스의 액션 템플릿 목록 조회
 *     tags: [ActionTemplates]
 *     parameters:
 *       - name: workspaceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: triggerType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [REVENUE_DECLINE_CRITICAL, REVENUE_DECLINE_WARNING, ENGAGEMENT_DECLINE_CRITICAL, ENGAGEMENT_DECLINE_WARNING, CONVERSION_LOW_CRITICAL, CONVERSION_LOW_WARNING, CHANNEL_METRIC_DECLINE]
 *       - name: department
 *         in: query
 *         schema:
 *           type: string
 *           enum: [MARKETING, COMMERCE, OVERALL]
 *     responses:
 *       200:
 *         description: 액션 템플릿 목록
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceViewer(workspaceId)

    const { searchParams } = new URL(request.url)
    const queryResult = querySchema.safeParse({
      triggerType: searchParams.get('triggerType') || undefined,
      department: searchParams.get('department') || undefined,
    })

    const where: {
      workspaceId: string
      isActive: boolean
      triggerType?: TriggerType
      department?: Department
    } = {
      workspaceId,
      isActive: true,
    }

    if (queryResult.success) {
      if (queryResult.data.triggerType) {
        where.triggerType = queryResult.data.triggerType
      }
      if (queryResult.data.department) {
        where.department = queryResult.data.department
      }
    }

    const templates = await prisma.actionTemplate.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { triggerType: 'asc' },
      ],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to fetch action templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @openapi
 * /api/workspaces/{workspaceId}/action-templates:
 *   post:
 *     summary: 새 액션 템플릿 생성
 *     tags: [ActionTemplates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [triggerType, title, description, department, departmentUrl]
 *             properties:
 *               triggerType:
 *                 type: string
 *                 enum: [REVENUE_DECLINE_CRITICAL, REVENUE_DECLINE_WARNING, ...]
 *               triggerLevel:
 *                 type: string
 *                 enum: [CRITICAL, WARNING, INFO]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [HIGH, MEDIUM, LOW]
 *               department:
 *                 type: string
 *                 enum: [MARKETING, COMMERCE, OVERALL]
 *               departmentUrl:
 *                 type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 생성된 액션 템플릿
 *       400:
 *         description: 유효성 검사 실패
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 *       409:
 *         description: 중복된 템플릿
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = createTemplateSchema.parse(body)

    // Check for duplicate
    const existing = await prisma.actionTemplate.findUnique({
      where: {
        workspaceId_triggerType_triggerLevel: {
          workspaceId,
          triggerType: data.triggerType,
          triggerLevel: data.triggerLevel,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 동일한 트리거 타입의 템플릿이 존재합니다.' },
        { status: 409 }
      )
    }

    const template = await prisma.actionTemplate.create({
      data: {
        workspaceId,
        triggerType: data.triggerType,
        triggerLevel: data.triggerLevel,
        title: data.title,
        description: data.description,
        priority: data.priority,
        department: data.department,
        departmentUrl: data.departmentUrl,
        steps: data.steps,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
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
    console.error('Failed to create action template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
