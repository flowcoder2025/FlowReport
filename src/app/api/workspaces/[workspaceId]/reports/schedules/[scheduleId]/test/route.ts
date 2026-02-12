/**
 * Test Report Send API
 *
 * POST: 테스트 리포트 발송
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin } from '@/lib/permissions/workspace-middleware'
import { generateTestReport, sendTestEmail } from '@/lib/services/report'

interface RouteParams {
  params: Promise<{ workspaceId: string; scheduleId: string }>
}

const testSendSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, scheduleId } = await params
    await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const { email } = testSendSchema.parse(body)

    // 스케줄 및 워크스페이스 정보 조회
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
      include: {
        workspace: { select: { name: true } },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: '스케줄을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 테스트 리포트 생성
    const generateResult = await generateTestReport(workspaceId, schedule.periodType)

    if (!generateResult.success || !generateResult.pdfBuffer) {
      return NextResponse.json(
        { error: generateResult.error || '리포트 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 테스트 이메일 발송
    const sendResult = await sendTestEmail(
      email,
      schedule.workspace.name,
      schedule.periodType,
      generateResult.pdfBuffer
    )

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || '이메일 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '테스트 리포트가 발송되었습니다.',
      sentTo: email,
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
    console.error('Failed to send test report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
