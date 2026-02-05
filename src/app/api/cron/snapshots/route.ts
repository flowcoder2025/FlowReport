import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Cron job to create weekly snapshots
 * Runs every Monday at 09:00 KST (00:00 UTC)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all workspaces
    const workspaces = await prisma.workspace.findMany()

    const results: { workspaceId: string; snapshotsCreated: number }[] = []

    for (const workspace of workspaces) {
      // Get all LIVE metric snapshots for this workspace
      // that don't have a SNAPSHOT version yet
      const liveSnapshots = await prisma.metricSnapshot.findMany({
        where: {
          workspaceId: workspace.id,
          periodType: 'WEEKLY',
        },
        include: {
          versions: {
            where: {
              status: 'LIVE',
            },
          },
        },
      })

      let created = 0

      for (const snapshot of liveSnapshots) {
        // Skip if already has a snapshot version this week
        const hasRecentSnapshot = await prisma.snapshotVersion.findFirst({
          where: {
            snapshotId: snapshot.id,
            status: 'SNAPSHOT',
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        })

        if (hasRecentSnapshot) {
          continue
        }

        // Get latest version number
        const latestVersion = await prisma.snapshotVersion.findFirst({
          where: { snapshotId: snapshot.id },
          orderBy: { versionNo: 'desc' },
        })

        // Create new snapshot version
        await prisma.snapshotVersion.create({
          data: {
            workspaceId: workspace.id,
            snapshotId: snapshot.id,
            status: 'SNAPSHOT',
            versionNo: (latestVersion?.versionNo || 0) + 1,
            frozenData: snapshot.data as any,
            createdBy: 'SYSTEM',
          },
        })

        created++
      }

      results.push({
        workspaceId: workspace.id,
        snapshotsCreated: created,
      })
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Cron snapshots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
