// PDF Generator using @react-pdf/renderer
// This file provides the structure for PDF generation

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
 * In production, use @react-pdf/renderer:
 *
 * import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
 *
 * const doc = (
 *   <Document>
 *     <Page size="A4">...</Page>
 *   </Document>
 * )
 * return Buffer.from(await pdf(doc).toBlob().then(b => b.arrayBuffer()))
 */
export async function generateMonthlyPDF(data: MonthlyReportData): Promise<Buffer> {
  // Placeholder - implement with @react-pdf/renderer
  // For MVP, return a placeholder buffer
  const placeholderText = `Monthly Report: ${data.workspace.name} - ${data.period.year}/${data.period.month}`
  return Buffer.from(placeholderText, 'utf-8')
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
