/**
 * Unified format utilities for FlowReport.
 *
 * This module consolidates all number / value formatting that was previously
 * duplicated across 12+ component files.
 */

// ---------------------------------------------------------------------------
// Number formatting (compact: M / K abbreviations)
// ---------------------------------------------------------------------------

/** Format a number with M/K abbreviations (e.g. 1.2M, 3.5K, 1,234). */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

/**
 * Same as `formatNumber` but accepts `null` / `undefined` and returns a dash
 * for missing values. Useful for YouTube metrics and other nullable displays.
 */
export function formatNullableNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return formatNumber(value)
}

// ---------------------------------------------------------------------------
// Currency formatting (KRW)
// ---------------------------------------------------------------------------

/**
 * Format a monetary value in Korean Won.
 *
 * - >= 1 (100M won) -> "1.2"
 * - >= 10,000 -> "1"
 * - Otherwise -> Intl currency format
 */
export function formatCurrency(value: number): string {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억`
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(0)}만원`
  }
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}

// ---------------------------------------------------------------------------
// Percent formatting
// ---------------------------------------------------------------------------

/** Format a percentage value (e.g. "12.3%"). No sign prefix. */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/**
 * Format a duration given in **seconds** as "M:SS" (e.g. "3:05").
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format a duration given in **minutes** as human-readable Korean text.
 *
 * - >= 60 -> "X시간 Y분"
 * - < 60  -> "X분"
 */
export function formatDurationMinutes(minutes: number | null): string {
  if (minutes === null) return '-'
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}시간 ${mins}분`
  }
  return `${Math.round(minutes)}분`
}

// ---------------------------------------------------------------------------
// Generic value formatting by format type
// ---------------------------------------------------------------------------

export type ValueFormat = 'number' | 'currency' | 'percent' | 'duration' | 'compact'

/**
 * Format a numeric value according to the given format type.
 *
 * | format     | behaviour                               |
 * |------------|-----------------------------------------|
 * | `number`   | M/K compact (same as `formatNumber`)    |
 * | `compact`  | M/K compact (alias)                     |
 * | `currency` | Korean Won with 억/만원 abbreviations   |
 * | `percent`  | "12.3%"                                 |
 * | `duration` | "M:SS" from seconds                     |
 */
export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return formatPercent(value)
    case 'duration':
      return formatDuration(value)
    case 'compact':
    case 'number':
    default:
      return formatNumber(value)
  }
}

// ---------------------------------------------------------------------------
// Label-based smart formatting (for executive / department / risk displays)
// ---------------------------------------------------------------------------

/**
 * Infer the format from a Korean/English metric label and format accordingly.
 *
 * - Labels containing 율 / rate / % -> percent
 * - Labels containing 매출 / revenue / 금액 -> currency
 * - Everything else -> compact number
 */
export function formatMetricByLabel(value: number, label: string): string {
  const lower = label.toLowerCase()

  if (lower.includes('율') || lower.includes('rate') || lower.includes('%')) {
    return formatPercent(value)
  }

  if (lower.includes('매출') || lower.includes('revenue') || lower.includes('금액')) {
    return formatCurrency(value)
  }

  return formatNumber(value)
}

// ---------------------------------------------------------------------------
// N/A reason text mapping
// ---------------------------------------------------------------------------

const NA_REASON_MAP: Record<string, string> = {
  NOT_PROVIDED_BY_CHANNEL: '채널에서 제공하지 않음',
  NOT_CONNECTED: '연동되지 않음',
  NOT_UPLOADED: 'CSV 미업로드',
  NOT_APPLICABLE: '해당 없음',
}

/** Translate an NA reason code into a human-readable Korean string. */
export function getNAReasonText(reason?: string): string {
  if (!reason) return ''
  return NA_REASON_MAP[reason] || reason
}
