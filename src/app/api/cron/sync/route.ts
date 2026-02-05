import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createConnector, isApiSupported } from '@/lib/connectors'
import { decryptCredentials } from '@/lib/crypto/credentials'

/**
 * Cron job to sync all active connectors
 * Runs daily at 03:00 KST (18:00 UTC)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active connections
    const connections = await prisma.channelConnection.findMany({
      where: {
        syncEnabled: true,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    })

    const results: { id: string; success: boolean; error?: string }[] = []

    for (const connection of connections) {
      // Skip if no API support
      if (!isApiSupported(connection.provider)) {
        continue
      }

      try {
        // Decrypt credentials
        const credentials = JSON.parse(decryptCredentials(connection.encryptedCredentials))

        // Create connector
        const connector = createConnector(connection.provider, {
          connectionId: connection.id,
          workspaceId: connection.workspaceId,
          credentials,
        })

        if (!connector) {
          continue
        }

        // Sync last 7 days
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

        const metricsResult = await connector.syncMetrics(startDate, endDate)
        const contentResult = await connector.syncContent(startDate, endDate)

        if (metricsResult.success) {
          // TODO: Upsert metric snapshots to database
          await prisma.channelConnection.update({
            where: { id: connection.id },
            data: {
              status: 'ACTIVE',
              lastSyncAt: new Date(),
              lastError: null,
            },
          })
          results.push({ id: connection.id, success: true })
        } else {
          throw new Error(metricsResult.error || 'Sync failed')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await prisma.channelConnection.update({
          where: { id: connection.id },
          data: {
            status: 'ERROR',
            lastError: errorMessage,
          },
        })
        results.push({ id: connection.id, success: false, error: errorMessage })
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
