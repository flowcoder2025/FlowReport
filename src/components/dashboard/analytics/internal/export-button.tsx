'use client'

import { useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonProps {
  workspaceId: string
  startDate: Date
  endDate: Date
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  selectedChannels?: string[]
  selectedMetrics?: string[]
  disabled?: boolean
}

type ExportFormat = 'csv' | 'json'

export function ExportButton({
  workspaceId,
  startDate,
  endDate,
  periodType,
  selectedChannels,
  selectedMetrics,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(
    async (exportFormat: ExportFormat) => {
      setIsExporting(true)

      try {
        const params = new URLSearchParams({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          periodType,
          format: exportFormat,
        })

        if (selectedChannels && selectedChannels.length > 0) {
          params.set('channels', selectedChannels.join(','))
        }

        if (selectedMetrics && selectedMetrics.length > 0) {
          params.set('metrics', selectedMetrics.join(','))
        }

        const response = await fetch(
          `/api/workspaces/${workspaceId}/metrics/raw?${params.toString()}`
        )

        if (!response.ok) {
          throw new Error('Export failed')
        }

        if (exportFormat === 'csv') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `metrics_${format(startDate, 'yyyy-MM-dd')}_${format(
            endDate,
            'yyyy-MM-dd'
          )}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `metrics_${format(startDate, 'yyyy-MM-dd')}_${format(
            endDate,
            'yyyy-MM-dd'
          )}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error('Export error:', error)
        // TODO: Show toast notification
      } finally {
        setIsExporting(false)
      }
    },
    [workspaceId, startDate, endDate, periodType, selectedChannels, selectedMetrics]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>내보내기 형식</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <Download className="mr-2 h-4 w-4" />
          CSV 파일 (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <Download className="mr-2 h-4 w-4" />
          JSON 파일 (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
