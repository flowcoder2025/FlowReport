import React from 'react'
import { pdf, DocumentProps } from '@react-pdf/renderer'
import { MonthlyReportDocument } from './pdf-components'

/**
 * Monthly report data structure for PDF generation
 */
export interface MonthlyReportData {
  workspace: {
    name: string
    description?: string
  }
  period: {
    year: number
    month: number
    start: Date
    end: Date
  }
  kpis: {
    label: string
    value: number
    previousValue: number
    change: number
    format: 'number' | 'currency' | 'percent'
  }[]
  channelMix: {
    name: string
    percentage: number
  }[]
  snsPerformance: {
    channel: string
    followers: number
    engagement: number
  }[]
  insights: {
    achievements: string[]
    improvements: string[]
    nextMonthFocus: string[]
  }
}

/**
 * Generate PDF buffer for monthly report
 */
export async function generateMonthlyPDF(data: MonthlyReportData): Promise<Buffer> {
  const document = React.createElement(MonthlyReportDocument, { data }) as React.ReactElement<DocumentProps>
  const blob = await pdf(document).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Format value for PDF display
 */
export function formatPdfValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    default:
      return new Intl.NumberFormat('ko-KR').format(value)
  }
}
