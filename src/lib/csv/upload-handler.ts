import { ChannelProvider } from '@prisma/client'
import { channelSchemas } from './schemas'

export interface CsvValidationError {
  row: number
  field: string
  message: string
}

export interface CsvValidationResult {
  valid: boolean
  data?: Record<string, any>[]
  errors?: CsvValidationError[]
  rowCount: number
}

/**
 * Parse CSV content to array of objects
 */
export function parseCsv(content: string): Record<string, any>[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) {
    return []
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const records: Record<string, any>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const record: Record<string, any> = {}

    headers.forEach((header, index) => {
      const value = values[index]
      if (value === '' || value === undefined) {
        record[header] = null
      } else if (!isNaN(Number(value))) {
        record[header] = Number(value)
      } else {
        record[header] = value
      }
    })

    records.push(record)
  }

  return records
}

/**
 * Validate CSV data against channel schema
 */
export function validateCsvData(
  channel: ChannelProvider,
  records: Record<string, any>[]
): CsvValidationResult {
  const schema = channelSchemas[channel]
  if (!schema) {
    return {
      valid: false,
      errors: [{ row: 0, field: '', message: `Unsupported channel: ${channel}` }],
      rowCount: 0,
    }
  }

  const validData: Record<string, any>[] = []
  const errors: CsvValidationError[] = []

  records.forEach((record, index) => {
    const result = schema.safeParse(record)
    if (result.success) {
      validData.push(result.data)
    } else {
      result.error.errors.forEach((err) => {
        errors.push({
          row: index + 2, // +2 for header row and 0-index
          field: err.path.join('.'),
          message: err.message,
        })
      })
    }
  })

  return {
    valid: errors.length === 0,
    data: validData,
    errors: errors.length > 0 ? errors : undefined,
    rowCount: records.length,
  }
}

/**
 * Process CSV upload
 */
export async function processCsvUpload(
  channel: ChannelProvider,
  csvContent: string
): Promise<CsvValidationResult> {
  const records = parseCsv(csvContent)

  if (records.length === 0) {
    return {
      valid: false,
      errors: [{ row: 0, field: '', message: 'CSV file is empty or has no data rows' }],
      rowCount: 0,
    }
  }

  return validateCsvData(channel, records)
}

/**
 * Get CSV template for a channel
 */
export function getCsvTemplate(channel: ChannelProvider): string {
  const templates: Record<string, string> = {
    SMARTSTORE: 'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total',
    COUPANG: 'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total',
    META_INSTAGRAM: 'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    META_FACEBOOK: 'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    YOUTUBE: 'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    GA4: 'date,sessions,users,new_users,pageviews,avg_session_duration,bounce_rate',
    GOOGLE_SEARCH_CONSOLE: 'keyword,impressions,clicks,ctr,position',
    NAVER_BLOG: 'date,posts_count,visitors,pageviews,avg_duration',
    NAVER_KEYWORDS: 'keyword,impressions,clicks,ctr,position',
  }

  return templates[channel] || ''
}
