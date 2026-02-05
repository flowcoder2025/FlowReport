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
  periodStart: Date
) {
  const periodStartStr = format(periodStart, 'yyyy-MM-dd')
  const url = `/api/workspaces/${workspaceId}/metrics?periodType=${periodType}&periodStart=${periodStartStr}`

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
