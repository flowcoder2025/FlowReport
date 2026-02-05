import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWorkspaceEditor } from '@/lib/permissions/workspace-middleware'
import { decryptCredentials } from '@/lib/crypto/credentials'
import { createConnector, isApiSupported, isCsvOnly, getProviderDisplayName } from '@/lib/connectors'

interface RouteParams {
  params: Promise<{ workspaceId: string; connectionId: string }>
}

// POST: 연결 테스트
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, connectionId } = await params
    const { userId } = await requireWorkspaceEditor(workspaceId)

    const connection = await prisma.channelConnection.findFirst({
      where: {
        id: connectionId,
        workspaceId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: '연결을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // CSV 전용 채널은 연결 테스트 불가
    if (isCsvOnly(connection.provider)) {
      return NextResponse.json({
        valid: true,
        message: `${getProviderDisplayName(connection.provider)}는 CSV 업로드 전용입니다.`,
        isCsvOnly: true,
      })
    }

    // API 지원 여부 확인
    if (!isApiSupported(connection.provider)) {
      return NextResponse.json(
        { error: '이 채널은 API 연결을 지원하지 않습니다.' },
        { status: 400 }
      )
    }

    // 자격증명 복호화
    let credentials: Record<string, unknown>
    try {
      credentials = JSON.parse(decryptCredentials(connection.encryptedCredentials))
    } catch {
      return NextResponse.json(
        { error: '자격증명 복호화 실패' },
        { status: 500 }
      )
    }

    // 커넥터 생성 및 테스트
    const connector = createConnector(connection.provider, {
      connectionId: connection.id,
      workspaceId,
      credentials,
    })

    if (!connector) {
      return NextResponse.json(
        { error: '커넥터 생성 실패' },
        { status: 500 }
      )
    }

    const testResult = await connector.testConnection()

    // 연결 상태 업데이트
    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: {
        status: testResult.valid ? 'ACTIVE' : 'ERROR',
        lastError: testResult.error || null,
        accountName: testResult.accountName || connection.accountName,
      },
    })

    // 감사 로그
    await prisma.connectionAuditLog.create({
      data: {
        connectionId,
        action: 'UPDATED',
        performedBy: userId,
        metadata: {
          type: 'connection_test',
          result: testResult.valid ? 'success' : 'failure',
          error: testResult.error,
        },
      },
    })

    return NextResponse.json({
      valid: testResult.valid,
      error: testResult.error,
      accountName: testResult.accountName,
      providerDisplayName: getProviderDisplayName(connection.provider),
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
    console.error('Test connection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
