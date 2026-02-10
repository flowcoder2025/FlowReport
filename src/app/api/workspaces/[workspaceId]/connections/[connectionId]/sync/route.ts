import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWorkspaceAdmin } from '@/lib/permissions/workspace-middleware'
import { createConnector, isApiSupported } from '@/lib/connectors'
import { decryptCredentials } from '@/lib/crypto/credentials'
import { upsertDailySnapshots, upsertContentItems } from '@/lib/services/metric-snapshot'

interface RouteParams {
  params: Promise<{ workspaceId: string; connectionId: string }>
}

/**
 * POST: 수동 동기화 실행
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, connectionId } = await params
    const { userId } = await requireWorkspaceAdmin(workspaceId)

    // Get connection
    const connection = await prisma.channelConnection.findUnique({
      where: {
        id: connectionId,
        workspaceId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Check if API is supported
    if (!isApiSupported(connection.provider)) {
      return NextResponse.json(
        { error: 'This channel does not support API sync' },
        { status: 400 }
      )
    }

    // Decrypt credentials
    const credentials = JSON.parse(decryptCredentials(connection.encryptedCredentials))

    // Create connector
    const connector = createConnector(connection.provider, {
      connectionId: connection.id,
      workspaceId: connection.workspaceId,
      credentials,
    })

    if (!connector) {
      return NextResponse.json(
        { error: 'Failed to create connector' },
        { status: 500 }
      )
    }

    // Sync last 30 days
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    console.log(`[Sync] Starting sync for ${connection.provider} (${connectionId})`)
    console.log(`[Sync] Date range: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    // Sync metrics
    const metricsResult = await connector.syncMetrics(startDate, endDate)
    console.log(`[Sync] Metrics result:`, {
      success: metricsResult.success,
      count: metricsResult.metrics?.length || 0,
      error: metricsResult.error,
    })

    // Sync content
    const contentResult = await connector.syncContent(startDate, endDate)
    console.log(`[Sync] Content result:`, {
      success: contentResult.success,
      count: contentResult.contentItems?.length || 0,
      error: contentResult.error,
    })

    let metricsCount = 0
    let contentCount = 0

    if (metricsResult.success && metricsResult.metrics && metricsResult.metrics.length > 0) {
      await upsertDailySnapshots(
        {
          workspaceId: connection.workspaceId,
          connectionId: connection.id,
          source: 'CONNECTOR',
        },
        metricsResult.metrics
      )
      metricsCount = metricsResult.metrics.length
    }

    if (contentResult.success && contentResult.contentItems && contentResult.contentItems.length > 0) {
      await upsertContentItems(
        connection.workspaceId,
        connection.id,
        connection.provider,
        contentResult.contentItems
      )
      contentCount = contentResult.contentItems.length
    }

    // Update connection status
    if (metricsResult.success) {
      await prisma.channelConnection.update({
        where: { id: connection.id },
        data: {
          status: 'ACTIVE',
          lastSyncAt: new Date(),
          lastError: null,
        },
      })
    } else {
      await prisma.channelConnection.update({
        where: { id: connection.id },
        data: {
          status: 'ERROR',
          lastError: metricsResult.error || 'Sync failed',
        },
      })
    }

    // Audit log
    await prisma.connectionAuditLog.create({
      data: {
        connectionId: connection.id,
        action: 'SYNCED',
        performedBy: userId,
        metadata: {
          metricsCount,
          contentCount,
          success: metricsResult.success,
          error: metricsResult.error,
        },
      },
    })

    return NextResponse.json({
      success: metricsResult.success,
      metrics: {
        success: metricsResult.success,
        count: metricsCount,
        error: metricsResult.error,
      },
      content: {
        success: contentResult.success,
        count: contentCount,
        error: contentResult.error,
      },
    })
  } catch (error) {
    console.error('Sync error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
