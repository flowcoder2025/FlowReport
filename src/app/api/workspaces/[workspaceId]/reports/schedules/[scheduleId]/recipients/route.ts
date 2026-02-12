/**
 * Report Recipients API
 *
 * GET: 수신자 목록 조회
 * POST: 수신자 추가
 * DELETE: 수신자 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { REPORT_CONFIG } from '@/constants'

interface RouteParams {
  params: Promise<{ workspaceId: string; scheduleId: string }>
}

const addRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
})

const deleteRecipientSchema = z.object({
  recipientId: z.string(),
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, scheduleId } = await params
    await requireWorkspaceViewer(workspaceId)

    // 스케줄 소유권 확인
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
    })

    if (!schedule) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    const recipients = await prisma.reportRecipient.findMany({
      where: { scheduleId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ recipients })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Failed to fetch recipients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, scheduleId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = addRecipientSchema.parse(body)

    // 스케줄 소유권 확인
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
      include: { _count: { select: { recipients: true } } },
    })

    if (!schedule) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 최대 수신자 수 확인
    if (schedule._count.recipients >= REPORT_CONFIG.MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `최대 ${REPORT_CONFIG.MAX_RECIPIENTS}명까지 수신자를 추가할 수 있습니다.` },
        { status: 400 }
      )
    }

    // 중복 이메일 확인
    const existingRecipient = await prisma.reportRecipient.findUnique({
      where: {
        scheduleId_email: { scheduleId, email: data.email },
      },
    })

    if (existingRecipient) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      )
    }

    const recipient = await prisma.reportRecipient.create({
      data: {
        scheduleId,
        email: data.email,
        name: data.name,
      },
    })

    return NextResponse.json({ recipient }, { status: 201 })
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
    console.error('Failed to add recipient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, scheduleId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const { recipientId } = deleteRecipientSchema.parse(body)

    // 스케줄 소유권 확인
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
    })

    if (!schedule) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 수신자 존재 및 소유권 확인
    const recipient = await prisma.reportRecipient.findFirst({
      where: { id: recipientId, scheduleId },
    })

    if (!recipient) {
      return NextResponse.json({ error: '수신자를 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.reportRecipient.delete({
      where: { id: recipientId },
    })

    return NextResponse.json({ message: '수신자가 삭제되었습니다.' })
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
    console.error('Failed to delete recipient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
