import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { grant } from '@/lib/permissions'

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  }),
  description: z.string().max(500).optional(),
  timezone: z.string().default('Asia/Seoul'),
  weekStart: z.number().min(0).max(6).default(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createWorkspaceSchema.parse(body)

    // Check if slug already exists
    const existing = await prisma.workspace.findUnique({
      where: { slug: data.slug },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Workspace slug already exists' },
        { status: 400 }
      )
    }

    // Create workspace with membership in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      // Create workspace
      const ws = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          timezone: data.timezone,
          weekStart: data.weekStart,
          memberships: {
            create: {
              userId: user.id,
              role: 'ADMIN',
            },
          },
        },
      })

      return ws
    })

    // Grant owner permission (Zanzibar)
    await grant('workspace', workspace.id, 'owner', 'user', user.id)

    return NextResponse.json({ workspace }, { status: 201 })
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
    }
    console.error('Create workspace error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await requireAuth()

    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: user.id },
      include: {
        workspace: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }))

    return NextResponse.json({ workspaces })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }
    console.error('List workspaces error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
