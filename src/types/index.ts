// Re-export Prisma types
export type {
  User,
  Account,
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
  ChannelConnection,
  ChannelProvider,
  CredentialType,
  ConnectionStatus,
  MetricDefinition,
  MetricCategory,
  MetricSnapshot,
  PeriodType,
  DataSource,
  SnapshotVersion,
  VersionStatus,
  ContentItem,
  ContentType,
  InsightNote,
  NoteType,
  ActionItem,
  ActionStatus,
  CsvUpload,
  CsvUploadStatus,
  RelationTuple,
  RelationDefinition,
} from '@prisma/client'

// Custom types
export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface WorkspaceWithRole {
  id: string
  name: string
  slug: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'
}

export interface KPIData {
  label: string
  code: string
  value: number | null
  previousValue: number | null
  change: number | null
  naReason?: string
}

export interface DashboardPeriod {
  type: 'WEEKLY' | 'MONTHLY'
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
}

// N/A Reason codes from PRD
export type NAReason =
  | 'NOT_PROVIDED_BY_CHANNEL'
  | 'NOT_CONNECTED'
  | 'NOT_UPLOADED'
  | 'NOT_APPLICABLE'
