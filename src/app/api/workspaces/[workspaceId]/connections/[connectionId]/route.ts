import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { encryptCredentials } from '@/lib/crypto/credentials'
import { createConnector, isApiSupported, getProviderDisplayName } from '@/lib/connectors'

const updateConnectionSchema = z.object({
  accountName: z.string().optional(),
  syncEnabled: z.boolean().optional(),
  credentials: z.record(z.any()).optional(),
})

interface RouteParams {
  params: Promise<{ workspaceId: string; connectionId: string }>
}

// GET: 연결 상세 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, connectionId } = await params
    await requireWorkspaceViewer(workspaceId)

    const connection = await prisma.channelConnection.findFirst({
      where: {
        id: connectionId,
        workspaceId,
      },
      select: {
        id: true,
        provider: true,
        accountId: true,
        accountName: true,
        credentialType: true,
        status: true,
        lastSyncAt: true,
        lastError: true,
        syncEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            metricSnapshots: true,
            contentItems: true,
          },
        },
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: '연결을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      connection: {
        ...connection,
        providerDisplayName: getProviderDisplayName(connection.provider),
        isApiSupported: isApiSupported(connection.provider),
        metricsCount: connection._count.metricSnapshots,
        contentCount: connection._count.contentItems,
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
    console.error('Get connection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 연결 수정
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, connectionId } = await params
    const { userId } = await requireWorkspaceAdmin(workspaceId)

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

    const body = await request.json()
    const data = updateConnectionSchema.parse(body)

    const updateData: Record<string, unknown> = {}

    if (data.accountName !== undefined) {
      updateData.accountName = data.accountName
    }

    if (data.syncEnabled !== undefined) {
      updateData.syncEnabled = data.syncEnabled
    }

    if (data.credentials) {
      // 새 자격증명으로 연결 테스트
      if (isApiSupported(connection.provider)) {
        const connector = createConnector(connection.provider, {
          connectionId: connection.id,
          workspaceId,
          credentials: data.credentials,
        })

        if (connector) {
          const testResult = await connector.testConnection()
          if (!testResult.valid) {
            return NextResponse.json(
              { error: testResult.error || '연결 테스트 실패' },
              { status: 400 }
            )
          }
          if (testResult.accountName) {
            updateData.accountName = testResult.accountName
          }
        }
      }

      updateData.encryptedCredentials = encryptCredentials(JSON.stringify(data.credentials))
      updateData.status = 'ACTIVE'
      updateData.lastError = null
    }

    const updated = await prisma.channelConnection.update({
      where: { id: connectionId },
      data: updateData,
      select: {
        id: true,
        provider: true,
        accountId: true,
        accountName: true,
        status: true,
        syncEnabled: true,
        lastSyncAt: true,
        updatedAt: true,
      },
    })

    // 감사 로그
    await prisma.connectionAuditLog.create({
      data: {
        connectionId,
        action: 'UPDATED',
        performedBy: userId,
        metadata: {
          changes: Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined),
        },
      },
    })

    return NextResponse.json({
      connection: {
        ...updated,
        providerDisplayName: getProviderDisplayName(updated.provider),
      },
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
    console.error('Update connection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 연결 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, connectionId } = await params
    const { userId } = await requireWorkspaceAdmin(workspaceId)

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

    // 연결 삭제 전 전체 connection 정보를 metadata에 보존
    const connectionMetadata = {
      connectionId,
      provider: connection.provider,
      accountId: connection.accountId,
      accountName: connection.accountName,
      workspaceId: connection.workspaceId,
      status: connection.status,
      createdAt: connection.createdAt,
      lastSyncAt: connection.lastSyncAt,
    }

    // 연결 삭제 (SetNull로 기존 감사 로그 보존됨)
    await prisma.channelConnection.delete({
      where: { id: connectionId },
    })

    // 삭제 감사 로그 기록 (connectionId는 null - 이미 삭제됨)
    await prisma.connectionAuditLog.create({
      data: {
        connectionId: null,  // 연결이 삭제되었으므로 null
        action: 'REVOKED',
        performedBy: userId,
        metadata: connectionMetadata,  // 삭제된 연결 정보 보존
      },
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
    console.error('Delete connection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
