'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { ChannelProvider } from '@prisma/client'
import { startOfWeek, startOfMonth } from 'date-fns'

export type PeriodType = 'WEEKLY' | 'MONTHLY'
export type DashboardView =
  | 'overview'
  | 'performance'
  | 'content'
  | 'commerce'
  | 'executive'    // 경영진용
  | 'marketing'    // 마케팅팀용
  | 'analytics'    // 데이터팀용
  | 'blog'         // 블로그 전용

interface DashboardState {
  activeView: DashboardView
  setActiveView: (view: DashboardView) => void
  selectedChannels: ChannelProvider[]
  setSelectedChannels: (channels: ChannelProvider[]) => void
  periodType: PeriodType
  setPeriodType: (type: PeriodType) => void
  periodStart: Date
  setPeriodStart: (date: Date) => void
  workspaceId: string
}

const DashboardContext = createContext<DashboardState | null>(null)

interface DashboardProviderProps {
  children: ReactNode
  workspaceId: string
  initialView?: DashboardView
  initialPeriodType?: PeriodType
  initialPeriodStart?: Date
  initialChannels?: ChannelProvider[]
}

export function DashboardProvider({
  children,
  workspaceId,
  initialView = 'overview',
  initialPeriodType = 'WEEKLY',
  initialPeriodStart,
  initialChannels = [],
}: DashboardProviderProps) {
  const [activeView, setActiveView] = useState<DashboardView>(initialView)
  const [selectedChannels, setSelectedChannels] = useState<ChannelProvider[]>(initialChannels)
  const [periodType, setPeriodType] = useState<PeriodType>(initialPeriodType)
  const [periodStart, setPeriodStart] = useState<Date>(
    initialPeriodStart ||
      (initialPeriodType === 'WEEKLY'
        ? startOfWeek(new Date(), { weekStartsOn: 1 })
        : startOfMonth(new Date()))
  )

  const handleSetActiveView = useCallback((view: DashboardView) => {
    setActiveView(view)
  }, [])

  const handleSetSelectedChannels = useCallback((channels: ChannelProvider[]) => {
    setSelectedChannels(channels)
  }, [])

  const handleSetPeriodType = useCallback((type: PeriodType) => {
    setPeriodType(type)
    if (type === 'WEEKLY') {
      setPeriodStart(startOfWeek(periodStart, { weekStartsOn: 1 }))
    } else {
      setPeriodStart(startOfMonth(periodStart))
    }
  }, [periodStart])

  const handleSetPeriodStart = useCallback((date: Date) => {
    setPeriodStart(date)
  }, [])

  const value = useMemo(
    () => ({
      activeView,
      setActiveView: handleSetActiveView,
      selectedChannels,
      setSelectedChannels: handleSetSelectedChannels,
      periodType,
      setPeriodType: handleSetPeriodType,
      periodStart,
      setPeriodStart: handleSetPeriodStart,
      workspaceId,
    }),
    [
      activeView,
      handleSetActiveView,
      selectedChannels,
      handleSetSelectedChannels,
      periodType,
      handleSetPeriodType,
      periodStart,
      handleSetPeriodStart,
      workspaceId,
    ]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return context
}
