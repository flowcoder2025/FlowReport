'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
} from 'date-fns'
import { ko, Locale } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface DateRange {
  from: Date
  to: Date
}

export interface CalendarProps {
  mode?: 'single' | 'range'
  selected?: Date | DateRange
  onSelect?: (date: Date | DateRange | undefined) => void
  numberOfMonths?: number
  locale?: Locale
  className?: string
  disabled?: (date: Date) => boolean
}

function Calendar({
  mode = 'single',
  selected,
  onSelect,
  numberOfMonths = 1,
  locale = ko,
  className,
  disabled,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (mode === 'single' && selected instanceof Date) {
      return startOfMonth(selected)
    }
    if (mode === 'range' && selected && 'from' in selected) {
      return startOfMonth(selected.from)
    }
    return startOfMonth(new Date())
  })

  const [rangeStart, setRangeStart] = React.useState<Date | null>(null)

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDayClick = (day: Date) => {
    if (disabled?.(day)) return

    if (mode === 'single') {
      onSelect?.(day)
    } else if (mode === 'range') {
      if (!rangeStart) {
        setRangeStart(day)
      } else {
        const range: DateRange = isBefore(day, rangeStart)
          ? { from: day, to: rangeStart }
          : { from: rangeStart, to: day }
        onSelect?.(range)
        setRangeStart(null)
      }
    }
  }

  const isSelected = (day: Date) => {
    if (mode === 'single' && selected instanceof Date) {
      return isSameDay(day, selected)
    }
    if (mode === 'range' && selected && 'from' in selected) {
      return isSameDay(day, selected.from) || isSameDay(day, selected.to)
    }
    return false
  }

  const isInRange = (day: Date) => {
    if (mode === 'range' && selected && 'from' in selected) {
      return isWithinInterval(day, { start: selected.from, end: selected.to })
    }
    if (rangeStart) {
      return isSameDay(day, rangeStart)
    }
    return false
  }

  const isRangeStart = (day: Date) => {
    if (mode === 'range' && selected && 'from' in selected) {
      return isSameDay(day, selected.from)
    }
    return false
  }

  const isRangeEnd = (day: Date) => {
    if (mode === 'range' && selected && 'from' in selected) {
      return isSameDay(day, selected.to)
    }
    return false
  }

  const renderMonth = (monthOffset: number) => {
    const monthDate = addMonths(currentMonth, monthOffset)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    const weekDays = ['일', '월', '화', '수', '목', '금', '토']

    return (
      <div key={monthOffset} className="space-y-4">
        <div className="flex justify-center pt-1 relative items-center">
          <div className="text-sm font-medium">
            {format(monthDate, 'yyyy년 M월', { locale })}
          </div>
        </div>
        <table className="w-full border-collapse space-y-1">
          <thead>
            <tr className="flex">
              {weekDays.map((dayName) => (
                <th
                  key={dayName}
                  className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center"
                >
                  {dayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex} className="flex w-full mt-2">
                {week.map((dayDate, dayIndex) => {
                  const isOutside = !isSameMonth(dayDate, monthDate)
                  const isDisabled = disabled?.(dayDate)
                  const selected = isSelected(dayDate)
                  const inRange = isInRange(dayDate)
                  const rangeStart = isRangeStart(dayDate)
                  const rangeEnd = isRangeEnd(dayDate)
                  const isToday = isSameDay(dayDate, new Date())

                  return (
                    <td
                      key={dayIndex}
                      className={cn(
                        'h-9 w-9 text-center text-sm p-0 relative',
                        inRange && !selected && 'bg-accent',
                        rangeStart && 'rounded-l-md',
                        rangeEnd && 'rounded-r-md'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayClick(dayDate)}
                        disabled={isDisabled}
                        className={cn(
                          'h-9 w-9 p-0 font-normal inline-flex items-center justify-center rounded-md text-sm transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          'disabled:pointer-events-none disabled:opacity-50',
                          isOutside && 'text-muted-foreground opacity-50',
                          isToday && !selected && 'bg-accent text-accent-foreground',
                          selected &&
                            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                          isDisabled && 'text-muted-foreground opacity-50'
                        )}
                      >
                        {format(dayDate, 'd')}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const months = Array.from({ length: numberOfMonths }, (_, i) => i)

  return (
    <div className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div
        className={cn(
          'flex',
          numberOfMonths > 1 ? 'flex-row space-x-4' : 'flex-col'
        )}
      >
        {months.map((offset) => renderMonth(offset))}
      </div>
    </div>
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }
