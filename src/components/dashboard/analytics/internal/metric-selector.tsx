'use client'

import { useState, useMemo, useCallback } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { ChannelProvider } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface MetricOption {
  key: string
  label: string
  channel: ChannelProvider | null
  category: MetricCategory
}

export interface SelectedMetric {
  key: string
  label: string
}

export type MetricCategory =
  | 'engagement'
  | 'reach'
  | 'revenue'
  | 'traffic'
  | 'growth'
  | 'content'

interface MetricSelectorProps {
  availableMetrics: Record<string, { label: string; channel: ChannelProvider | null }>
  selectedMetrics: SelectedMetric[]
  onSelectionChange: (metrics: SelectedMetric[]) => void
  maxSelections?: number
}

const CATEGORY_LABELS: Record<MetricCategory, string> = {
  engagement: '참여',
  reach: '도달/노출',
  revenue: '매출',
  traffic: '트래픽',
  growth: '성장',
  content: '콘텐츠',
}

const METRIC_CATEGORIES: Record<string, MetricCategory> = {
  views: 'reach',
  reach: 'reach',
  impressions: 'reach',
  engagement: 'engagement',
  engagements: 'engagement',
  likes: 'engagement',
  comments: 'engagement',
  shares: 'engagement',
  followers: 'growth',
  subscriberGained: 'growth',
  subscriberCount: 'growth',
  revenue: 'revenue',
  sales: 'revenue',
  orders: 'revenue',
  avgOrderValue: 'revenue',
  conversionRate: 'revenue',
  dau: 'traffic',
  wau: 'traffic',
  mau: 'traffic',
  sessions: 'traffic',
  totalUsers: 'traffic',
  newUsers: 'traffic',
  estimatedMinutesWatched: 'content',
  averageViewDuration: 'content',
}

const CHANNEL_COLORS: Record<ChannelProvider, string> = {
  GA4: 'bg-orange-100 text-orange-700',
  META_INSTAGRAM: 'bg-pink-100 text-pink-700',
  META_FACEBOOK: 'bg-blue-100 text-blue-700',
  YOUTUBE: 'bg-red-100 text-red-700',
  SMARTSTORE: 'bg-green-100 text-green-700',
  COUPANG: 'bg-sky-100 text-sky-700',
  GOOGLE_SEARCH_CONSOLE: 'bg-yellow-100 text-yellow-700',
  NAVER_BLOG: 'bg-emerald-100 text-emerald-700',
  NAVER_KEYWORDS: 'bg-teal-100 text-teal-700',
}

export function MetricSelector({
  availableMetrics,
  selectedMetrics,
  onSelectionChange,
  maxSelections = 10,
}: MetricSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const metricOptions: MetricOption[] = useMemo(() => {
    return Object.entries(availableMetrics).map(([key, { label, channel }]) => ({
      key,
      label,
      channel,
      category: METRIC_CATEGORIES[key] || 'content',
    }))
  }, [availableMetrics])

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return metricOptions

    const query = searchQuery.toLowerCase()
    return metricOptions.filter(
      (option) =>
        option.key.toLowerCase().includes(query) ||
        option.label.toLowerCase().includes(query)
    )
  }, [metricOptions, searchQuery])

  const groupedOptions = useMemo(() => {
    const groups: Record<MetricCategory, MetricOption[]> = {
      engagement: [],
      reach: [],
      revenue: [],
      traffic: [],
      growth: [],
      content: [],
    }

    for (const option of filteredOptions) {
      groups[option.category].push(option)
    }

    return groups
  }, [filteredOptions])

  const isSelected = useCallback(
    (key: string) => selectedMetrics.some((m) => m.key === key),
    [selectedMetrics]
  )

  const toggleMetric = useCallback(
    (option: MetricOption) => {
      if (isSelected(option.key)) {
        onSelectionChange(selectedMetrics.filter((m) => m.key !== option.key))
      } else if (selectedMetrics.length < maxSelections) {
        onSelectionChange([...selectedMetrics, { key: option.key, label: option.label }])
      }
    },
    [selectedMetrics, onSelectionChange, maxSelections, isSelected]
  )

  const removeMetric = useCallback(
    (key: string) => {
      onSelectionChange(selectedMetrics.filter((m) => m.key !== key))
    },
    [selectedMetrics, onSelectionChange]
  )

  const clearAll = useCallback(() => {
    onSelectionChange([])
  }, [onSelectionChange])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">메트릭 선택</label>
        {selectedMetrics.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
          >
            전체 해제
          </Button>
        )}
      </div>

      {/* Selected metrics tags */}
      {selectedMetrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMetrics.map((metric) => (
            <div
              key={metric.key}
              className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm"
            >
              <span>{metric.label}</span>
              <button
                onClick={() => removeMetric(metric.key)}
                className="ml-1 rounded-full hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Metric selector dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedMetrics.length === 0
              ? '메트릭을 선택하세요'
              : `${selectedMetrics.length}개 메트릭 선택됨`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="메트릭 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>

          {/* Metric list grouped by category */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {Object.entries(groupedOptions).map(([category, options]) => {
              if (options.length === 0) return null

              return (
                <div key={category} className="mb-3">
                  <div className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase">
                    {CATEGORY_LABELS[category as MetricCategory]}
                  </div>
                  {options.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => toggleMetric(option)}
                      disabled={
                        !isSelected(option.key) &&
                        selectedMetrics.length >= maxSelections
                      }
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm',
                        'hover:bg-accent hover:text-accent-foreground',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isSelected(option.key) && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            isSelected(option.key)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted'
                          )}
                        >
                          {isSelected(option.key) && <Check className="h-3 w-3" />}
                        </div>
                        <span>{option.label}</span>
                      </div>
                      {option.channel && (
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-xs',
                            CHANNEL_COLORS[option.channel] || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {option.channel}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )
            })}

            {filteredOptions.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-2 text-xs text-muted-foreground">
            {selectedMetrics.length}/{maxSelections} 선택됨
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
