'use client'

import useSWR from 'swr'
import { format } from 'date-fns'

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
  change: {
    revenue: number | null
    orders: number | null
    conversionRate: number | null
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

  return useSWR<MetricsData>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30 seconds
  })
}

export function useDashboardNotes(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const url = `/api/workspaces/${workspaceId}/notes?periodType=${periodType}&periodStart=${periodStartStr}`

  return useSWR<NotesData>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })
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

  return useSWR<TrendData>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute for trend data
  })
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

  return useSWR<ActionProgressData>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })
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
