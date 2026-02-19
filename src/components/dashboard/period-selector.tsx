'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'

interface PeriodSelectorProps {
  periodType: 'WEEKLY' | 'MONTHLY'
  periodStart: Date
  onPeriodChange: (date: Date) => void
}

export function PeriodSelector({
  periodType,
  periodStart,
  onPeriodChange,
}: PeriodSelectorProps) {
  const isWeekly = periodType === 'WEEKLY'

  const start = isWeekly
    ? startOfWeek(periodStart, { weekStartsOn: 1 })
    : startOfMonth(periodStart)

  const end = isWeekly
    ? endOfWeek(periodStart, { weekStartsOn: 1 })
    : endOfMonth(periodStart)

  const handlePrev = () => {
    const newDate = isWeekly ? subWeeks(periodStart, 1) : subMonths(periodStart, 1)
    onPeriodChange(newDate)
  }

  const handleNext = () => {
    const newDate = isWeekly ? addWeeks(periodStart, 1) : addMonths(periodStart, 1)
    onPeriodChange(newDate)
  }

  const handleToday = () => {
    onPeriodChange(new Date())
  }

  const formatPeriod = () => {
    if (isWeekly) {
      return `${format(start, 'M.d', { locale: ko })} - ${format(end, 'M.d', { locale: ko })}`
    }
    return format(start, 'yyyy년 M월', { locale: ko })
  }

  const isCurrentPeriod = () => {
    const now = new Date()
    if (isWeekly) {
      const currentStart = startOfWeek(now, { weekStartsOn: 1 })
      return start.getTime() === currentStart.getTime()
    }
    const currentStart = startOfMonth(now)
    return start.getTime() === currentStart.getTime()
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="이전 기간" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 min-w-[160px] justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{formatPeriod()}</span>
      </div>

      <Button variant="outline" size="icon" aria-label="다음 기간" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentPeriod() && (
        <Button variant="ghost" size="sm" onClick={handleToday}>
          오늘
        </Button>
      )}
    </div>
  )
}
