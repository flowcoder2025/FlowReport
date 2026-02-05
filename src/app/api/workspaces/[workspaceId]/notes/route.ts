import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import {
  requireWorkspaceViewer,
  requireWorkspaceEditor,
} from '@/lib/permissions/workspace-middleware'
import { PeriodType, NoteType, ActionStatus } from '@prisma/client'
import { startOfWeek, startOfMonth, parseISO } from 'date-fns'

const querySchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const noteSchema = z.object({
  periodType: z.enum(['WEEKLY', 'MONTHLY']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.object({
    causes: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    bestPractices: z.array(z.string()).optional(),
  }),
  actions: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).optional(),
      priority: z.number().optional(),
    })
  ),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = await requireWorkspaceViewer(params.workspaceId)

    const searchParams = request.nextUrl.searchParams
    const parseResult = querySchema.safeParse({
      periodType: searchParams.get('periodType'),
      periodStart: searchParams.get('periodStart'),
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.errors },
        { status: 400 }
      )
    }

    const { periodType, periodStart: periodStartStr } = parseResult.data
    const periodStart = normalizePeriodStart(
      parseISO(periodStartStr),
      periodType as PeriodType
    )

    // Fetch insight notes
    const insightNotes = await prisma.insightNote.findMany({
      where: {
        workspaceId,
        periodType: periodType as PeriodType,
        periodStart,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Fetch action items
    const actionItems = await prisma.actionItem.findMany({
      where: {
        workspaceId,
        periodType: periodType as PeriodType,
        periodStart,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    })

    // Group notes by type
    const notes = {
      causes: insightNotes
        .filter((n) => n.noteType === 'CAUSE')
        .map((n) => n.content),
      improvements: insightNotes
        .filter((n) => n.noteType === 'IMPROVEMENT')
        .map((n) => n.content),
      bestPractices: insightNotes
        .filter((n) => n.noteType === 'BEST_PRACTICE')
        .map((n) => n.content),
    }

    // Format action items
    const actions = actionItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
    }))

    return NextResponse.json({
      periodType,
      periodStart: periodStart.toISOString(),
      notes,
      actions,
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
    console.error('Get notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId, userId } = await requireWorkspaceEditor(params.workspaceId)

    const body = await request.json()
    const parseResult = noteSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.errors },
        { status: 400 }
      )
    }

    const { periodType, periodStart: periodStartStr, notes, actions } = parseResult.data
    const periodStart = normalizePeriodStart(
      parseISO(periodStartStr),
      periodType as PeriodType
    )

    // Use transaction for atomic updates
    await prisma.$transaction(async (tx) => {
      // Delete existing notes for this period
      await tx.insightNote.deleteMany({
        where: {
          workspaceId,
          periodType: periodType as PeriodType,
          periodStart,
        },
      })

      // Create new notes
      const notesToCreate: Array<{
        workspaceId: string
        periodType: PeriodType
        periodStart: Date
        noteType: NoteType
        content: string
        createdBy: string
      }> = []

      if (notes.causes) {
        for (const content of notes.causes) {
          if (content.trim()) {
            notesToCreate.push({
              workspaceId,
              periodType: periodType as PeriodType,
              periodStart,
              noteType: 'CAUSE',
              content: content.trim(),
              createdBy: userId,
            })
          }
        }
      }

      if (notes.improvements) {
        for (const content of notes.improvements) {
          if (content.trim()) {
            notesToCreate.push({
              workspaceId,
              periodType: periodType as PeriodType,
              periodStart,
              noteType: 'IMPROVEMENT',
              content: content.trim(),
              createdBy: userId,
            })
          }
        }
      }

      if (notes.bestPractices) {
        for (const content of notes.bestPractices) {
          if (content.trim()) {
            notesToCreate.push({
              workspaceId,
              periodType: periodType as PeriodType,
              periodStart,
              noteType: 'BEST_PRACTICE',
              content: content.trim(),
              createdBy: userId,
            })
          }
        }
      }

      if (notesToCreate.length > 0) {
        await tx.insightNote.createMany({ data: notesToCreate })
      }

      // Upsert action items
      for (const action of actions) {
        if (!action.title.trim()) continue

        if (action.id) {
          // Update existing action
          await tx.actionItem.update({
            where: { id: action.id },
            data: {
              title: action.title.trim(),
              status: (action.status as ActionStatus) || 'PENDING',
              priority: action.priority ?? 0,
            },
          })
        } else {
          // Create new action
          await tx.actionItem.create({
            data: {
              workspaceId,
              periodType: periodType as PeriodType,
              periodStart,
              title: action.title.trim(),
              status: (action.status as ActionStatus) || 'PENDING',
              priority: action.priority ?? 0,
              createdBy: userId,
            },
          })
        }
      }

      // Delete actions that are not in the list
      const actionIds = actions
        .filter((a) => a.id)
        .map((a) => a.id as string)

      await tx.actionItem.deleteMany({
        where: {
          workspaceId,
          periodType: periodType as PeriodType,
          periodStart,
          id: { notIn: actionIds },
        },
      })
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
    console.error('Save notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function normalizePeriodStart(date: Date, periodType: PeriodType): Date {
  if (periodType === 'WEEKLY') {
    return startOfWeek(date, { weekStartsOn: 1 })
  }
  return startOfMonth(date)
}
