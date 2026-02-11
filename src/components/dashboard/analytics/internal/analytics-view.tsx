'use client'

import { useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { Calendar as CalendarIcon, BarChart3, TrendingUp } from 'lucide-react'
import { ChannelProvider } from '@prisma/client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar, type DateRange as CalendarDateRange } from '@/components/ui/calendar'
import { Skeleton } from '../../../dashboard/skeleton'
import { cn } from '@/lib/utils'

import { MetricSelector, type SelectedMetric } from './metric-selector'
import { DataExplorer, type RawMetricData } from './data-explorer'
import { ExportButton } from './export-button'
import { CorrelationChart } from './correlation-chart'

interface RawMetricsResponse {
  startDate: string
  endDate: string
  periodType: string
  totalRows: number
  returnedRows: number
  truncated: boolean
  availableMetrics: Record<string, { label: string; channel: ChannelProvider | null }>
  rows: RawMetricData[]
}

const fetcher = async (url: string): Promise<RawMetricsResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

type DateRange = {
  from: Date
  to: Date
}

type PeriodPreset = 'last7days' | 'last30days' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom'

const PRESET_LABELS: Record<PeriodPreset, string> = {
  last7days: '최근 7일',
  last30days: '최근 30일',
  thisWeek: '이번 주',
  thisMonth: '이번 달',
  lastMonth: '지난 달',
  custom: '직접 선택',
}

export function AnalyticsView() {
  const { workspaceId, selectedChannels } = useDashboardContext()

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last30days')
  const [periodType, setPeriodType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY')

  // Metric selection state
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetric[]>([])

  // Build API URL
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      startDate: format(dateRange.from, 'yyyy-MM-dd'),
      endDate: format(dateRange.to, 'yyyy-MM-dd'),
      periodType,
    })

    if (selectedChannels && selectedChannels.length > 0) {
      params.set('channels', selectedChannels.join(','))
    }

    if (selectedMetrics.length > 0) {
      params.set('metrics', selectedMetrics.map((m) => m.key).join(','))
    }

    return `/api/workspaces/${workspaceId}/metrics/raw?${params.toString()}`
  }, [workspaceId, dateRange, periodType, selectedChannels, selectedMetrics])

  const { data, error, isLoading } = useSWR<RawMetricsResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const handlePresetChange = useCallback((preset: PeriodPreset) => {
    setPeriodPreset(preset)
    const now = new Date()

    switch (preset) {
      case 'last7days':
        setDateRange({ from: subDays(now, 7), to: now })
        break
      case 'last30days':
        setDateRange({ from: subDays(now, 30), to: now })
        break
      case 'thisWeek':
        setDateRange({
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        })
        break
      case 'thisMonth':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
        break
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1)
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        })
        break
    }
  }, [])

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range)
      setPeriodPreset('custom')
    }
  }, [])

  // Compute summary statistics
  const summaryStats = useMemo(() => {
    if (!data?.rows || data.rows.length === 0 || selectedMetrics.length === 0) {
      return null
    }

    const stats: Record<string, { sum: number; avg: number; min: number; max: number; count: number }> = {}

    for (const metric of selectedMetrics) {
      stats[metric.key] = { sum: 0, avg: 0, min: Infinity, max: -Infinity, count: 0 }
    }

    for (const row of data.rows) {
      for (const metric of selectedMetrics) {
        const value = row[metric.key]
        if (typeof value === 'number' && !isNaN(value)) {
          stats[metric.key].sum += value
          stats[metric.key].count += 1
          stats[metric.key].min = Math.min(stats[metric.key].min, value)
          stats[metric.key].max = Math.max(stats[metric.key].max, value)
        }
      }
    }

    // Calculate averages
    for (const key of Object.keys(stats)) {
      if (stats[key].count > 0) {
        stats[key].avg = stats[key].sum / stats[key].count
      }
      if (stats[key].min === Infinity) stats[key].min = 0
      if (stats[key].max === -Infinity) stats[key].max = 0
    }

    return stats
  }, [data?.rows, selectedMetrics])

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">데이터 탐색기</h2>
          <p className="text-muted-foreground">
            원본 메트릭 데이터를 조회하고 분석하세요
          </p>
        </div>
        <ExportButton
          workspaceId={workspaceId}
          startDate={dateRange.from}
          endDate={dateRange.to}
          periodType={periodType}
          selectedChannels={selectedChannels}
          selectedMetrics={selectedMetrics.map((m) => m.key)}
          maxRows={10000}
          disabled={!data || data.rows.length === 0}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">필터 설정</CardTitle>
          <CardDescription>기간과 메트릭을 선택하여 데이터를 조회하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Period presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium">기간 선택</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESET_LABELS) as PeriodPreset[])
                .filter((p) => p !== 'custom')
                .map((preset) => (
                  <Button
                    key={preset}
                    variant={periodPreset === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetChange(preset)}
                  >
                    {PRESET_LABELS[preset]}
                  </Button>
                ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={periodPreset === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className={cn('justify-start text-left font-normal')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodPreset === 'custom'
                      ? `${format(dateRange.from, 'MM/dd')} - ${format(dateRange.to, 'MM/dd')}`
                      : PRESET_LABELS.custom}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) =>
                      handleDateRangeChange(range as CalendarDateRange | undefined)
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Period type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">집계 단위</label>
            <div className="flex gap-2">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((type) => (
                <Button
                  key={type}
                  variant={periodType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriodType(type)}
                >
                  {type === 'DAILY' ? '일별' : type === 'WEEKLY' ? '주별' : '월별'}
                </Button>
              ))}
            </div>
          </div>

          {/* Metric selector */}
          <MetricSelector
            availableMetrics={data?.availableMetrics || {}}
            selectedMetrics={selectedMetrics}
            onSelectionChange={setSelectedMetrics}
            maxSelections={10}
          />
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summaryStats && selectedMetrics.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {selectedMetrics.slice(0, 4).map((metric) => {
            const stats = summaryStats[metric.key]
            if (!stats) return null

            return (
              <Card key={metric.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.sum.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>평균: {stats.avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                    <span>최소: {stats.min.toLocaleString()}</span>
                    <span>최대: {stats.max.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Correlation Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">채널 간 상관관계</CardTitle>
              <CardDescription>
                채널별 메트릭 상관관계를 분석합니다
              </CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <CorrelationChart
            data={data?.rows || []}
            selectedMetrics={selectedMetrics}
            height={300}
          />
        </CardContent>
      </Card>

      {/* Data Explorer Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">데이터 테이블</h3>
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.truncated
                ? `${data.returnedRows.toLocaleString()} / ${data.totalRows.toLocaleString()}개 레코드`
                : `총 ${data.totalRows.toLocaleString()}개 레코드`
              }
            </span>
          )}
        </div>

        {data?.truncated && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <strong>데이터 제한:</strong> 전체 {data.totalRows.toLocaleString()}개 중 {data.returnedRows.toLocaleString()}개만 표시됩니다.
            전체 데이터는 Export 기능을 사용하세요.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <DataExplorer
            data={data?.rows || []}
            selectedMetrics={selectedMetrics}
            isLoading={isLoading}
            pageSize={20}
          />
        )}
      </div>
    </div>
  )
}
