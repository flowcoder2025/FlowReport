'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboardContext, PeriodType } from '@/lib/contexts/dashboard-context'

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'WEEKLY', label: '주간' },
  { value: 'MONTHLY', label: '월간' },
]

export function PeriodDropdown() {
  const { periodType, setPeriodType } = useDashboardContext()

  return (
    <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
      <SelectTrigger className="w-[100px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
