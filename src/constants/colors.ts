/**
 * UI Color Constants - Single Source of Truth
 *
 * 모든 UI 컬러 상수는 이 파일에서 관리
 * 채널 컬러는 channels.ts에서 관리 (CHANNEL_COLORS, CHANNEL_BADGE_COLORS)
 */

/**
 * 차트 기본 팔레트 (파이, 버블, 바, 수평바 등 범용)
 */
export const CHART_PALETTE = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
] as const

/**
 * 퍼널 차트 컬러 (블루 그라데이션)
 */
export const FUNNEL_PALETTE = [
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#bfdbfe', // blue-200
  '#dbeafe', // blue-100
] as const

/**
 * 상태 컬러 (증감, 성공/실패)
 */
export const STATUS_COLORS = {
  positive: '#22c55e',  // green-500
  negative: '#ef4444',  // red-500
  neutral: '#6b7280',   // gray-500
  primary: '#3b82f6',   // blue-500
} as const

/**
 * 콘텐츠 타입 컬러
 */
export const CONTENT_TYPE_COLORS: Record<string, string> = {
  POST: '#8b5cf6',    // violet
  REEL: '#ec4899',    // pink
  STORY: '#f97316',   // orange
  SHORT: '#ef4444',   // red
  VIDEO: '#dc2626',   // red-600
  ARTICLE: '#22c55e', // green
}

/**
 * 트래픽 소스 컬러 (블로그 유입 경로)
 */
export const TRAFFIC_SOURCE_COLORS = {
  search: '#3b82f6',   // blue
  direct: '#22c55e',   // green
  social: '#f59e0b',   // amber
  referral: '#8b5cf6', // purple
} as const

/**
 * 블로그 트렌드 라인 컬러
 */
export const BLOG_TREND_COLORS = {
  visitors: '#3b82f6',  // blue
  pageviews: '#22c55e', // green
} as const

/**
 * 메트릭 트렌드 라인 컬러 (성과 개요)
 */
export const METRIC_TREND_COLORS = {
  revenue: '#3b82f6',    // blue
  reach: '#22c55e',      // green
  engagement: '#f59e0b', // amber
} as const
