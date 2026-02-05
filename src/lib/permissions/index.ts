import { prisma } from '@/lib/db'

// Namespace types
export type Namespace = 'workspace' | 'report' | 'system'

// Relation types
export type Relation = 'owner' | 'admin' | 'editor' | 'viewer'

// Subject types
export type SubjectType = 'user' | 'workspace_role'

// Permission inheritance map (higher relations inherit lower)
const inheritanceMap: Record<Relation, Relation[]> = {
  owner: ['admin', 'editor', 'viewer'],
  admin: ['editor', 'viewer'],
  editor: ['viewer'],
  viewer: [],
}

/**
 * Check if a user has a specific permission
 * @param userId - User ID to check
 * @param namespace - Resource namespace (workspace, report, system)
 * @param objectId - Resource ID
 * @param relation - Required relation (owner, admin, editor, viewer)
 * @returns true if user has the permission (directly or inherited)
 */
export async function check(
  userId: string,
  namespace: Namespace,
  objectId: string,
  relation: Relation
): Promise<boolean> {
  // 1. Direct permission check
  const directTuple = await prisma.relationTuple.findFirst({
    where: {
      namespace,
      objectId,
      relation,
      subjectType: 'user',
      subjectId: userId,
    },
  })
  if (directTuple) return true

  // 2. Check inherited permissions (e.g., owner has editor permission)
  for (const [higherRelation, inherits] of Object.entries(inheritanceMap)) {
    if (inherits.includes(relation)) {
      const inheritedTuple = await prisma.relationTuple.findFirst({
        where: {
          namespace,
          objectId,
          relation: higherRelation,
          subjectType: 'user',
          subjectId: userId,
        },
      })
      if (inheritedTuple) return true
    }
  }

  // 3. System admin bypass
  const systemAdmin = await prisma.relationTuple.findFirst({
    where: {
      namespace: 'system',
      objectId: 'global',
      relation: 'admin',
      subjectType: 'user',
      subjectId: userId,
    },
  })
  if (systemAdmin) return true

  return false
}

/**
 * Grant a permission to a user
 * @param namespace - Resource namespace
 * @param objectId - Resource ID
 * @param relation - Relation to grant
 * @param subjectType - Subject type (user, workspace_role)
 * @param subjectId - Subject ID (user ID or *)
 */
export async function grant(
  namespace: Namespace,
  objectId: string,
  relation: Relation,
  subjectType: SubjectType,
  subjectId: string
): Promise<void> {
  await prisma.relationTuple.upsert({
    where: {
      namespace_objectId_relation_subjectType_subjectId: {
        namespace,
        objectId,
        relation,
        subjectType,
        subjectId,
      },
    },
    create: { namespace, objectId, relation, subjectType, subjectId },
    update: {},
  })
}

/**
 * Revoke a permission from a user
 */
export async function revoke(
  namespace: Namespace,
  objectId: string,
  relation: Relation,
  subjectType: SubjectType,
  subjectId: string
): Promise<void> {
  await prisma.relationTuple.deleteMany({
    where: { namespace, objectId, relation, subjectType, subjectId },
  })
}

/**
 * Get all permissions for a user on a specific resource
 */
export async function getPermissions(
  userId: string,
  namespace: Namespace,
  objectId: string
): Promise<Relation[]> {
  const tuples = await prisma.relationTuple.findMany({
    where: {
      namespace,
      objectId,
      subjectType: 'user',
      subjectId: userId,
    },
    select: { relation: true },
  })

  return tuples.map((t) => t.relation as Relation)
}

/**
 * Get all resources a user has access to in a namespace
 */
export async function getAccessibleResources(
  userId: string,
  namespace: Namespace
): Promise<string[]> {
  const tuples = await prisma.relationTuple.findMany({
    where: {
      namespace,
      subjectType: 'user',
      subjectId: userId,
    },
    select: { objectId: true },
    distinct: ['objectId'],
  })

  return tuples.map((t) => t.objectId)
}
