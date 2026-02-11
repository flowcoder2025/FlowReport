// Blog Dashboard Types
// 블로그 채널 대시보드에서 사용하는 타입 정의

/**
 * 블로그 메트릭 데이터 인터페이스
 * CSV 업로드 또는 API에서 추출된 블로그 메트릭
 */
export interface BlogMetricsData {
  // 기본 지표
  visitors: number | null
  pageviews: number | null
  avgTimeOnPage?: number | null

  // 성장 지표
  subscribers: number | null
  newSubscribers: number | null
  subscriberGrowthRate?: number | null

  // 참여 지표
  comments: number | null
  likes: number | null
  shares: number | null

  // 유입 분석
  searchVisitors: number | null
  directVisitors: number | null
  socialVisitors: number | null
  referralVisitors: number | null

  // 콘텐츠 지표
  postsPublished?: number | null
  topPostUrl?: string | null
  topPostViews?: number | null

  // 계산된 지표
  engagementRate?: number | null
}

/**
 * 유입 경로 데이터
 */
export interface TrafficSourceData {
  searchVisitors: number | null
  directVisitors: number | null
  socialVisitors: number | null
  referralVisitors: number | null
}

/**
 * 트렌드 차트 데이터 포인트
 */
export interface TrendDataPoint {
  period: string
  visitors: number
  pageviews: number
  [key: string]: string | number
}
