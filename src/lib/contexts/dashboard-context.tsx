'use client'

import { ReactNode } from 'react'
import { ChannelProvider } from '@prisma/client'

// 분리된 Context들 import
import {
  WorkspaceProvider,
  useWorkspaceContext,
} from './dashboard-workspace-context'
import {
  ViewProvider,
  useViewContext,
  type DashboardView,
} from './dashboard-view-context'
import {
  FilterProvider,
  useFilterContext,
  type PeriodType,
} from './dashboard-filter-context'

// 타입 re-export (하위 호환성)
export type { DashboardView } from './dashboard-view-context'
export type { PeriodType } from './dashboard-filter-context'

/**
 * 통합 Provider Props
 */
interface DashboardProviderProps {
  children: ReactNode
  workspaceId: string
  initialView?: DashboardView
  initialPeriodType?: PeriodType
  initialPeriodStart?: Date
  initialChannels?: ChannelProvider[]
}

/**
 * 통합 Dashboard Provider
 *
 * 3개의 분리된 Context를 조합하여 제공
 * - WorkspaceContext: workspaceId (정적)
 * - ViewContext: activeView, setActiveView
 * - FilterContext: channels, period 관련
 */
export function DashboardProvider({
  children,
  workspaceId,
  initialView = 'overview',
  initialPeriodType = 'WEEKLY',
  initialPeriodStart,
  initialChannels = [],
}: DashboardProviderProps) {
  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <ViewProvider initialView={initialView}>
        <FilterProvider
          initialPeriodType={initialPeriodType}
          initialPeriodStart={initialPeriodStart}
          initialChannels={initialChannels}
        >
          {children}
        </FilterProvider>
      </ViewProvider>
    </WorkspaceProvider>
  )
}

/**
 * 통합 Dashboard Context Hook (하위 호환성)
 *
 * 기존 코드에서 useDashboardContext()를 사용하는 경우
 * 3개 Context를 조합하여 기존과 동일한 인터페이스 제공
 *
 * 새 코드에서는 필요한 Context만 개별 사용 권장:
 * - useWorkspaceContext() - workspaceId만 필요할 때
 * - useViewContext() - activeView만 필요할 때
 * - useFilterContext() - 필터만 필요할 때
 */
export function useDashboardContext() {
  const { workspaceId } = useWorkspaceContext()
  const { activeView, setActiveView } = useViewContext()
  const {
    selectedChannels,
    setSelectedChannels,
    periodType,
    setPeriodType,
    periodStart,
    setPeriodStart,
  } = useFilterContext()

  return {
    workspaceId,
    activeView,
    setActiveView,
    selectedChannels,
    setSelectedChannels,
    periodType,
    setPeriodType,
    periodStart,
    setPeriodStart,
  }
}

// 개별 Context Hook re-export (새 코드에서 사용)
export { useWorkspaceContext } from './dashboard-workspace-context'
export { useViewContext } from './dashboard-view-context'
export { useFilterContext } from './dashboard-filter-context'
