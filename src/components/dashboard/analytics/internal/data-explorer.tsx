'use client'

import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ChannelProvider } from '@prisma/client'
import { cn } from '@/lib/utils'
import { CHANNEL_BADGE_COLORS } from '@/constants'
import type { SelectedMetric } from './metric-selector'

export interface RawMetricData {
  id: string
  date: string
  periodStart: string
  periodEnd: string
  channel: ChannelProvider
  channelName: string
  [metricKey: string]: string | number | null
}

export interface DataExplorerProps {
  data: RawMetricData[]
  selectedMetrics: SelectedMetric[]
  isLoading?: boolean
  initialPageSize?: number
}

type SortDirection = 'asc' | 'desc'
type SortConfig = {
  key: string
  direction: SortDirection
}

export function DataExplorer({
  data,
  selectedMetrics,
  isLoading = false,
  initialPageSize = 20,
}: DataExplorerProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return []

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
    setCurrentPage(1)
  }

  const formatMetricValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toLocaleString()
      }
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
    return String(value)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center text-muted-foreground">
          데이터를 불러오는 중...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center text-muted-foreground">
          표시할 데이터가 없습니다. 기간과 메트릭을 선택해주세요.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('date')}
                  className="-ml-3 h-8 data-[state=active]:bg-accent"
                >
                  날짜
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[140px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('channel')}
                  className="-ml-3 h-8 data-[state=active]:bg-accent"
                >
                  채널
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              {selectedMetrics.map((metric) => (
                <TableHead key={metric.key} className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort(metric.key)}
                    className="-mr-3 h-8 data-[state=active]:bg-accent"
                  >
                    {metric.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {format(new Date(row.date), 'yyyy-MM-dd')}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                      CHANNEL_BADGE_COLORS[row.channel] || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {row.channelName}
                  </span>
                </TableCell>
                {selectedMetrics.map((metric) => (
                  <TableCell key={metric.key} className="text-right tabular-nums">
                    {formatMetricValue(row[metric.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {sortedData.length}개 중 {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, sortedData.length)}개 표시
          </div>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value={20}>20개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
