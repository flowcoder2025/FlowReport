'use client'

import useSWR from 'swr'
import { ChannelProvider } from '@prisma/client'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch connections')
  }
  return res.json()
}

export interface Connection {
  id: string
  provider: ChannelProvider
  accountName: string | null
  status: string
  createdAt: string
  lastSyncAt: string | null
}

interface ConnectionsResponse {
  connections: Connection[]
}

export function useConnections(workspaceId: string) {
  const url = `/api/workspaces/${workspaceId}/connections`

  // 전역 SWR 설정 사용 (src/lib/swr-config.ts)
  const result = useSWR<ConnectionsResponse>(url, fetcher)

  const transformedData = result.data
    ? {
        connections: result.data.connections.map((conn) => ({
          ...conn,
          isActive: conn.status === 'ACTIVE',
        })),
      }
    : undefined

  return {
    ...result,
    data: transformedData,
  }
}
