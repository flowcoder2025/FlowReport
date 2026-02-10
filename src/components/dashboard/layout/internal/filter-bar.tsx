'use client'

import { format, addWeeks, subWeeks, addMonths, subMonths, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardUrl } from '@/lib/hooks/use-dashboard-url'
import { PeriodDropdown } from './period-dropdown'
import { ChannelMultiSelect } from '../../filters'

export function FilterBar() {
  const { periodType, periodStart, setPeriodStart } = useDashboardContext()
  const { updateUrl } = useDashboardUrl()

  const handleDateChange = (date: Date) => {
    setPeriodStart(date)
    updateUrl({ date: format(date, 'yyyy-MM-dd') })
  }

  const handlePrev = () => {
    const newDate = periodType === 'WEEKLY'
      ? subWeeks(periodStart, 1)
      : subMonths(periodStart, 1)
    handleDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = periodType === 'WEEKLY'
      ? addWeeks(periodStart, 1)
      : addMonths(periodStart, 1)
    handleDateChange(newDate)
  }

  const formatPeriodLabel = () => {
    if (periodType === 'WEEKLY') {
      const endDate = addDays(periodStart, 6)
      return `${format(periodStart, 'M/d', { locale: ko })} - ${format(endDate, 'M/d', { locale: ko })}`
    }
    return format(periodStart, 'yyyy년 M월', { locale: ko })
  }

  return (
    <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
      <div className="flex items-center gap-3">
        <PeriodDropdown />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="h-8 gap-2 px-3 text-sm font-normal">
            <CalendarIcon className="h-4 w-4" />
            {formatPeriodLabel()}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ChannelMultiSelect />
    </div>
  )
}
