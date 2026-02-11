'use client'

import useSWR, { mutate } from 'swr'
import { format } from 'date-fns'
import { type TargetConfig } from '@/lib/types/targets'

// Re-export TargetConfig for backward compatibility
export type { TargetConfig } from '@/lib/types/targets'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Failed to fetch data')
    const data = await res.json().catch(() => ({}))
    ;(error as Error & { info?: unknown }).info = data
    throw error
  }
  return res.json()
}

export interface HighlightItem {
  channel: string
  metric: string
  change: number
  direction: 'up' | 'down'
  severity: 'positive' | 'negative' | 'neutral'
}

export interface YouTubeMetrics {
  views: number | null
  estimatedMinutesWatched: number | null
  subscribers: number | null
  subscriberGained: number | null
  engagement: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  change: {
    views: number | null
    estimatedMinutesWatched: number | null
    subscribers: number | null
    engagement: number | null
  }
  topVideos: Array<{
    id: string
    title: string | null
    url: string
    views: number | null
    engagement: number | null
  }>
}

export interface InstagramMetrics {
  reach: number | null
  impressions: number | null
  engagement: number | null
  engagementRate: number | null
  followers: number | null
  change: {
    reach: number | null
    impressions: number | null
    engagement: number | null
    followers: number | null
  }
}

export interface StoreMetrics {
  revenue: number | null
  orders: number | null
  conversionRate: number | null
  avgOrderValue: number | null
  cancels: number | null
  refunds: number | null
  refundAmount: number | null
  returns: number | null
  change: {
    revenue: number | null
    orders: number | null
    conversionRate: number | null
    cancels: number | null
    refunds: number | null
  }
}

export interface ChannelDetails {
  YOUTUBE?: YouTubeMetrics
  META_INSTAGRAM?: InstagramMetrics
  SMARTSTORE?: StoreMetrics
  COUPANG?: StoreMetrics
}

export interface MetricsData {
  periodType: string
  periodStart: string
  periodEnd: string
  overview: {
    totalRevenue: number | null
    dau: number | null
    wau: number | null
    mau: number | null
    signups: number | null
    reach: number | null
    engagement: number | null
    followers: number | null
    uploads: number | null
  }
  previous: {
    totalRevenue: number | null
    dau: number | null
    wau: number | null
    mau: number | null
    signups: number | null
    reach: number | null
    engagement: number | null
    followers: number | null
    uploads: number | null
  }
  sns: {
    channels: Array<{
      channel: string
      channelName: string
      data: Record<string, number | null>
      change: Record<string, number | null>
    }>
    topPosts: Array<{
      id: string
      channel: string
      contentType: string
      title: string | null
      url: string
      views: number | null
      engagement: number | null
    }>
  }
  store: {
    traffic: {
      sessions: number | null
      users: number | null
      dau: number | null
      wau: number | null
      conversionRate: number | null
      previousSessions: number | null
      previousUsers: number | null
      previousDau: number | null
      previousWau: number | null
      previousConversionRate: number | null
    }
    channels: Array<{
      channel: string
      channelName: string
      data: Record<string, number | null>
      change: Record<string, number | null>
    }>
  }
  highlights: HighlightItem[]
  channelDetails: ChannelDetails
}

export interface NotesData {
  periodType: string
  periodStart: string
  notes: {
    causes: string[]
    improvements: string[]
    bestPractices: string[]
  }
  actions: Array<{
    id: string
    title: string
    description: string | null
    status: string
    priority: number
  }>
}

export function useDashboardMetrics(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date,
  channels?: string[]
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const channelsParam = channels && channels.length > 0 ? `&channels=${channels.join(',')}` : ''
  const url = `/api/workspaces/${workspaceId}/metrics?periodType=${periodType}&periodStart=${periodStartStr}${channelsParam}`

  // 전역 SWR 설정 사용 (src/lib/swr-config.ts)
  return useSWR<MetricsData>(url, fetcher)
}

export function useDashboardNotes(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const url = `/api/workspaces/${workspaceId}/notes?periodType=${periodType}&periodStart=${periodStartStr}`

  // 전역 SWR 설정 사용
  return useSWR<NotesData>(url, fetcher)
}

export interface TrendPeriod {
  period: string
  periodStart: string
  periodEnd: string
  revenue: number
  reach: number
  engagement: number
  [key: string]: string | number
}

export interface ChannelTrendMetrics {
  youtube?: Array<{ period: string; subscribers: number; views: number }>
  instagram?: Array<{ period: string; followers: number; reach: number }>
}

export interface TrendData {
  periodType: string
  periods: TrendPeriod[]
  channelMetrics?: ChannelTrendMetrics
}

export function useDashboardTrendData(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodCount = 8,
  channels?: string[]
) {
  const channelsParam = channels && channels.length > 0 ? `&channels=${channels.join(',')}` : ''
  const url = `/api/workspaces/${workspaceId}/metrics/trend?periodType=${periodType}&periodCount=${periodCount}${channelsParam}`

  // 전역 SWR 설정 사용
  return useSWR<TrendData>(url, fetcher)
}

// Action Progress Types
export interface ActionItem {
  id: string
  title: string
  description: string | null
  status: 'completed' | 'in_progress' | 'not_started' | 'overdue' | 'canceled'
  priority: number
  createdAt: string
  completedAt: string | null
}

export interface ActionProgressStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  canceled: number
}

export interface ActionProgressData {
  periodType: string
  periodStart: string
  items: ActionItem[]
  stats: ActionProgressStats
  completionRate: number
}

export function useActionProgress(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const url = `/api/workspaces/${workspaceId}/notes/progress?periodType=${periodType}&periodStart=${periodStartStr}`

  // 전역 SWR 설정 사용
  return useSWR<ActionProgressData>(url, fetcher)
}

export async function saveDashboardNotes(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date,
  notes: {
    causes: string[]
    improvements: string[]
    bestPractices: string[]
  },
  actions: Array<{
    id?: string
    title: string
    status?: string
    priority?: number
  }>
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')

  const res = await fetch(`/api/workspaces/${workspaceId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periodType,
      periodStart: periodStartStr,
      notes,
      actions,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to save notes')
  }

  return res.json()
}

// ===========================================
// Competitor Types & Hooks
// ===========================================

export type CompetitorPlatform = 'YOUTUBE' | 'META_INSTAGRAM' | 'META_FACEBOOK' | 'NAVER_BLOG'

export interface CompetitorMetrics {
  followers: number | null
  engagementRate: number | null
  uploads: number | null
}

export interface Competitor {
  id: string
  name: string
  platform: CompetitorPlatform
  channelId: string
  channelUrl: string | null
  followers: number | null
  engagementRate: number | null
  uploads: number | null
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CompetitorsData {
  competitors: Competitor[]
}

export interface CreateCompetitorData {
  name: string
  platform: CompetitorPlatform
  channelId: string
  channelUrl?: string | null
  followers?: number | null
  engagementRate?: number | null
  uploads?: number | null
}

export interface UpdateCompetitorData {
  name?: string
  platform?: CompetitorPlatform
  channelId?: string
  channelUrl?: string | null
  followers?: number | null
  engagementRate?: number | null
  uploads?: number | null
}

export function useCompetitors(workspaceId: string) {
  const url = `/api/workspaces/${workspaceId}/competitors`

  // 전역 SWR 설정 사용
  const { data, error, isLoading, isValidating } = useSWR<CompetitorsData>(
    workspaceId ? url : null,
    fetcher
  )

  return {
    competitors: data?.competitors ?? [],
    isLoading,
    isValidating,
    error,
    mutate: () => mutate(url),
  }
}

export async function createCompetitor(
  workspaceId: string,
  data: CreateCompetitorData
): Promise<Competitor> {
  const res = await fetch(`/api/workspaces/${workspaceId}/competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create competitor')
  }

  const result = await res.json()
  // Revalidate competitors list
  mutate(`/api/workspaces/${workspaceId}/competitors`)
  return result.competitor
}

export async function updateCompetitor(
  workspaceId: string,
  competitorId: string,
  data: UpdateCompetitorData
): Promise<Competitor> {
  const res = await fetch(`/api/workspaces/${workspaceId}/competitors/${competitorId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to update competitor')
  }

  const result = await res.json()
  mutate(`/api/workspaces/${workspaceId}/competitors`)
  return result.competitor
}

export async function deleteCompetitor(
  workspaceId: string,
  competitorId: string
): Promise<void> {
  const res = await fetch(`/api/workspaces/${workspaceId}/competitors/${competitorId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to delete competitor')
  }

  mutate(`/api/workspaces/${workspaceId}/competitors`)
}

// ===========================================
// Action Template Types & Hooks
// ===========================================

export type TriggerType =
  | 'REVENUE_DECLINE_CRITICAL'
  | 'REVENUE_DECLINE_WARNING'
  | 'ENGAGEMENT_DECLINE_CRITICAL'
  | 'ENGAGEMENT_DECLINE_WARNING'
  | 'CONVERSION_LOW_CRITICAL'
  | 'CONVERSION_LOW_WARNING'
  | 'CHANNEL_METRIC_DECLINE'

export type AlertLevel = 'CRITICAL' | 'WARNING' | 'INFO'
export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type Department = 'MARKETING' | 'COMMERCE' | 'OVERALL'

export interface ActionTemplate {
  id: string
  workspaceId: string
  triggerType: TriggerType
  triggerLevel: AlertLevel
  title: string
  description: string
  priority: ActionPriority
  department: Department
  departmentUrl: string
  steps: string[]
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ActionTemplatesData {
  templates: ActionTemplate[]
}

export function useActionTemplates(workspaceId: string) {
  const url = `/api/workspaces/${workspaceId}/action-templates`

  // 전역 SWR 설정 사용
  const { data, error, isLoading, isValidating } = useSWR<ActionTemplatesData>(
    workspaceId ? url : null,
    fetcher
  )

  // TriggerType을 키로 하는 Map 생성 (빠른 조회용)
  const templateMap = new Map<TriggerType, ActionTemplate>()
  if (data?.templates) {
    for (const template of data.templates) {
      templateMap.set(template.triggerType, template)
    }
  }

  return {
    templates: data?.templates ?? [],
    templateMap,
    isLoading,
    isValidating,
    error,
    mutate: () => mutate(url),
  }
}

// ===========================================
// Content Analytics Types & Hook
// ===========================================

export interface ContentTypeStats {
  contentType: string
  count: number
  avgViews: number
  avgEngagement: number
  avgEngagementRate: number
  totalViews: number
  totalEngagement: number
}

export interface ChannelTypeStats {
  channel: string
  types: ContentTypeStats[]
}

export interface ContentAnalyticsData {
  periodType: string
  periodStart: string
  periodEnd: string
  byType: ContentTypeStats[]
  byChannel: ChannelTypeStats[]
  bestPerformer: {
    contentType: string
    reason: string
  } | null
  totalContent: number
}

export function useContentAnalytics(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const url = `/api/workspaces/${workspaceId}/content/analytics?periodType=${periodType}&periodStart=${periodStartStr}`

  return useSWR<ContentAnalyticsData>(workspaceId ? url : null, fetcher)
}

// ===========================================
// Product Ranking Types & Hook
// ===========================================

export interface ProductRankingItem {
  id: string
  name: string
  url: string
  channel: string
  sales: number
  revenue: number
  units: number
  change: number | null
}

export interface ProductRankingData {
  periodType: string
  periodStart: string
  periodEnd: string
  products: ProductRankingItem[]
  total: number
}

export function useDashboardProducts(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date,
  limit = 5
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const url = `/api/workspaces/${workspaceId}/products/top?periodType=${periodType}&periodStart=${periodStartStr}&limit=${limit}`

  return useSWR<ProductRankingData>(workspaceId ? url : null, fetcher)
}

// ===========================================
// Workspace Targets Types & Hook
// ===========================================

export interface WorkspaceTargetsData {
  targetConfig: TargetConfig
  defaults: TargetConfig
}

export function useWorkspaceTargets(workspaceId: string): {
  data: WorkspaceTargetsData | undefined
  isLoading: boolean
  error: Error | undefined
} {
  const url = `/api/workspaces/${workspaceId}/settings/targets`

  // 전역 SWR 설정 사용
  const { data, error, isLoading } = useSWR<WorkspaceTargetsData>(
    workspaceId ? url : null,
    fetcher
  )

  return {
    data,
    isLoading,
    error,
  }
}
