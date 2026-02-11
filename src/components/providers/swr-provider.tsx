'use client'

import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'

interface SWRProviderProps {
  children: React.ReactNode
}

/**
 * 전역 SWR 설정을 제공하는 Provider
 *
 * Server Component인 레이아웃에서 사용하기 위한 Client 래퍼입니다.
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
