/**
 * Metric Constants - Single Source of Truth
 *
 * 모든 메트릭 관련 상수는 이 파일에서 관리
 * - 메트릭 한글 라벨
 * - 메트릭 카테고리 분류
 * - 양성/음성 메트릭 판별
 * - 하이라이트 임계값
 */

/**
 * 메트릭 카테고리 타입
 */
export type MetricCategory =
  | 'engagement'
  | 'reach'
  | 'revenue'
  | 'traffic'
  | 'growth'
  | 'content'

/**
 * 메트릭 한글 라벨
 */
export const METRIC_LABELS: Record<string, string> = {
  views: '조회수',
  reach: '도달',
  engagement: '참여',
  engagements: '참여',
  followers: '팔로워',
  subscriberGained: '구독자',
  revenue: '매출',
  orders: '주문',
  sales: '매출',
  impressions: '노출',
  estimatedMinutesWatched: '시청시간',
  likes: '좋아요',
  comments: '댓글',
  shares: '공유',
  dau: 'DAU',
  wau: 'WAU',
  mau: 'MAU',
  sessions: '세션',
  totalUsers: '전체 사용자',
  newUsers: '신규 사용자',
  conversionRate: '전환율',
  avgOrderValue: '객단가',
  subscriberCount: '구독자 수',
  averageViewDuration: '평균 시청 시간',
}

/**
 * 메트릭 카테고리 매핑
 */
export const METRIC_CATEGORIES: Record<string, MetricCategory> = {
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

/**
 * 카테고리 한글 라벨
 */
export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  engagement: '참여',
  reach: '도달/노출',
  revenue: '매출',
  traffic: '트래픽',
  growth: '성장',
  content: '콘텐츠',
}

/**
 * 양성 메트릭 (증가 = 긍정)
 */
export const POSITIVE_METRICS: readonly string[] = [
  'views',
  'reach',
  'engagement',
  'engagements',
  'followers',
  'subscriberGained',
  'revenue',
  'orders',
  'sales',
  'impressions',
  'estimatedMinutesWatched',
] as const

/**
 * 하이라이트 변동 임계값 (%)
 */
export const HIGHLIGHT_THRESHOLD = 10

/**
 * 메트릭 증감 방향에 따른 severity 판별
 */
export function getMetricSeverity(
  metricKey: string,
  change: number
): 'positive' | 'negative' | 'neutral' {
  if (POSITIVE_METRICS.includes(metricKey)) {
    return change > 0 ? 'positive' : 'negative'
  }
  return 'neutral'
}
