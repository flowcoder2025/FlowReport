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

/**
 * Filter Context
 *
 * 대시보드 필터 상태를 관리하는 Context
 * 채널 선택, 기간 타입, 기간 시작일
 * FilterBar, View 컴포넌트에서 사용
 */

export type PeriodType = 'WEEKLY' | 'MONTHLY'

interface FilterContextValue {
  selectedChannels: ChannelProvider[]
  setSelectedChannels: (channels: ChannelProvider[]) => void
  periodType: PeriodType
  setPeriodType: (type: PeriodType) => void
  periodStart: Date
  setPeriodStart: (date: Date) => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

interface FilterProviderProps {
  children: ReactNode
  initialPeriodType?: PeriodType
  initialPeriodStart?: Date
  initialChannels?: ChannelProvider[]
}

export function FilterProvider({
  children,
  initialPeriodType = 'WEEKLY',
  initialPeriodStart,
  initialChannels = [],
}: FilterProviderProps) {
  const [selectedChannels, setSelectedChannelsState] =
    useState<ChannelProvider[]>(initialChannels)
  const [periodType, setPeriodTypeState] = useState<PeriodType>(initialPeriodType)
  const [periodStart, setPeriodStartState] = useState<Date>(
    initialPeriodStart ||
      (initialPeriodType === 'WEEKLY'
        ? startOfWeek(new Date(), { weekStartsOn: 1 })
        : startOfMonth(new Date()))
  )

  const setSelectedChannels = useCallback((channels: ChannelProvider[]) => {
    setSelectedChannelsState(channels)
  }, [])

  const setPeriodType = useCallback(
    (type: PeriodType) => {
      setPeriodTypeState(type)
      // 기간 타입 변경 시 시작일도 조정
      if (type === 'WEEKLY') {
        setPeriodStartState((prev) => startOfWeek(prev, { weekStartsOn: 1 }))
      } else {
        setPeriodStartState((prev) => startOfMonth(prev))
      }
    },
    []
  )

  const setPeriodStart = useCallback((date: Date) => {
    setPeriodStartState(date)
  }, [])

  const value = useMemo(
    () => ({
      selectedChannels,
      setSelectedChannels,
      periodType,
      setPeriodType,
      periodStart,
      setPeriodStart,
    }),
    [
      selectedChannels,
      setSelectedChannels,
      periodType,
      setPeriodType,
      periodStart,
      setPeriodStart,
    ]
  )

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  )
}

export function useFilterContext() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider')
  }
  return context
}
