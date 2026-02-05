import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ChannelProvider, CredentialType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin, requireWorkspaceViewer } from '@/lib/permissions/workspace-middleware'
import { encryptCredentials } from '@/lib/crypto/credentials'
import { createConnector, isApiSupported, isCsvOnly, getProviderDisplayName } from '@/lib/connectors'

const createConnectionSchema = z.object({
  provider: z.nativeEnum(ChannelProvider),
  accountId: z.string().min(1),
  accountName: z.string().optional(),
  credentials: z.record(z.any()),
  credentialType: z.nativeEnum(CredentialType),
})

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

// GET: 연결 목록 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await params
    await requireWorkspaceViewer(workspaceId)

    const connections = await prisma.channelConnection.findMany({
      where: { workspaceId },
      select: {
        id: true,
        provider: true,
        accountId: true,
        accountName: true,
        status: true,
        lastSyncAt: true,
        lastError: true,
        syncEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const connectionsWithMeta = connections.map((conn) => ({
      ...conn,
      providerDisplayName: getProviderDisplayName(conn.provider),
      isApiSupported: isApiSupported(conn.provider),
      isCsvOnly: isCsvOnly(conn.provider),
    }))

    return NextResponse.json({ connections: connectionsWithMeta })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('List connections error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 새 연결 생성
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await params
    const { userId } = await requireWorkspaceAdmin(workspaceId)

    const body = await request.json()
    const data = createConnectionSchema.parse(body)

    // 중복 확인
    const existing = await prisma.channelConnection.findUnique({
      where: {
        workspaceId_provider_accountId: {
          workspaceId,
          provider: data.provider,
          accountId: data.accountId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 같은 계정이 연결되어 있습니다.' },
        { status: 400 }
      )
    }

    // API 지원 채널인 경우 연결 테스트
    let accountName = data.accountName
    if (isApiSupported(data.provider)) {
      const connector = createConnector(data.provider, {
        connectionId: 'temp',
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
        accountName = testResult.accountName || accountName
      }
    }

    // 자격증명 암호화
    const encryptedCredentials = encryptCredentials(JSON.stringify(data.credentials))

    // 연결 생성
    const connection = await prisma.channelConnection.create({
      data: {
        workspaceId,
        provider: data.provider,
        accountId: data.accountId,
        accountName,
        encryptedCredentials,
        credentialType: data.credentialType,
        status: isApiSupported(data.provider) ? 'ACTIVE' : 'PENDING',
      },
    })

    // 감사 로그 기록
    await prisma.connectionAuditLog.create({
      data: {
        connectionId: connection.id,
        action: 'CREATED',
        performedBy: userId,
        metadata: {
          provider: data.provider,
          accountId: data.accountId,
        },
      },
    })

    return NextResponse.json(
      {
        connection: {
          id: connection.id,
          provider: connection.provider,
          accountId: connection.accountId,
          accountName: connection.accountName,
          status: connection.status,
          providerDisplayName: getProviderDisplayName(connection.provider),
        },
      },
      { status: 201 }
    )
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
    console.error('Create connection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
