import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db'
import { WorkspaceRole } from '@prisma/client'

interface WorkspaceAuthResult {
  userId: string
  role: WorkspaceRole
  workspaceId: string
}

/**
 * Require user to have minimum workspace role
 * @param workspaceId - Workspace ID
 * @param minimumRole - Minimum required role (VIEWER, EDITOR, ADMIN)
 * @returns User ID and actual role
 * @throws Error if unauthorized or insufficient permissions
 */
export async function requireWorkspaceRole(
  workspaceId: string,
  minimumRole: WorkspaceRole
): Promise<WorkspaceAuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Login required')
  }

  const membership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  })

  if (!membership) {
    throw new Error('Forbidden: Not a workspace member')
  }

  const roleHierarchy: WorkspaceRole[] = ['VIEWER', 'EDITOR', 'ADMIN']
  const userRoleIndex = roleHierarchy.indexOf(membership.role)
  const requiredRoleIndex = roleHierarchy.indexOf(minimumRole)

  if (userRoleIndex < requiredRoleIndex) {
    throw new Error(`Forbidden: ${minimumRole} role required`)
  }

  return {
    userId: session.user.id,
    role: membership.role,
    workspaceId,
  }
}

/**
 * Require ADMIN role
 */
export const requireWorkspaceAdmin = (workspaceId: string) =>
  requireWorkspaceRole(workspaceId, 'ADMIN')

/**
 * Require EDITOR role (or higher)
 */
export const requireWorkspaceEditor = (workspaceId: string) =>
  requireWorkspaceRole(workspaceId, 'EDITOR')

/**
 * Require VIEWER role (any member)
 */
export const requireWorkspaceViewer = (workspaceId: string) =>
  requireWorkspaceRole(workspaceId, 'VIEWER')

/**
 * Get user's role in a workspace (or null if not a member)
 */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const membership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: { role: true },
  })

  return membership?.role ?? null
}

/**
 * Get all workspaces for a user with their roles
 */
export async function getUserWorkspaces(userId: string) {
  return prisma.workspaceMembership.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      joinedAt: 'desc',
    },
  })
}
