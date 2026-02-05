import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireWorkspaceViewer, requireWorkspaceAdmin } from '@/lib/permissions/workspace-middleware'

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  weekStart: z.number().min(0).max(6).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId, role } = await requireWorkspaceViewer(params.workspaceId)

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            channelConnections: true,
            metricSnapshots: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ workspace, userRole: role })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    console.error('Get workspace error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    await requireWorkspaceAdmin(params.workspaceId)

    const body = await request.json()
    const data = updateWorkspaceSchema.parse(body)

    const workspace = await prisma.workspace.update({
      where: { id: params.workspaceId },
      data,
    })

    return NextResponse.json({ workspace })
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
    console.error('Update workspace error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    await requireWorkspaceAdmin(params.workspaceId)

    await prisma.workspace.delete({
      where: { id: params.workspaceId },
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
    console.error('Delete workspace error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
