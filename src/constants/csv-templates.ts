/**
 * CSV Templates - Single Source of Truth
 *
 * CSV 업로드 및 템플릿 다운로드에서 사용하는 상수
 * VALID_CHANNELS와 CSV_TEMPLATES를 중앙 관리
 */

import { ChannelProvider } from '@prisma/client'
import { CHANNEL_GROUPS } from './channels'

/**
 * CSV 업로드 지원 채널 목록
 * CHANNEL_GROUPS.ALL과 동일 (모든 채널 CSV 지원)
 */
export const VALID_CSV_CHANNELS: readonly ChannelProvider[] = CHANNEL_GROUPS.ALL

/**
 * CSV 템플릿 타입
 */
export interface CsvTemplate {
  headers: string
  sample: string
}

/**
 * 채널별 CSV 템플릿 정의 (헤더 + 샘플 데이터)
 */
export const CSV_TEMPLATES: Record<ChannelProvider, CsvTemplate> = {
  SMARTSTORE: {
    headers:
      'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total',
    sample:
      '2026-02-10,1000000,900000,10,15,100000,0,0,0,0,10,850000,50000',
  },
  COUPANG: {
    headers:
      'date,sales_gmv,sales_net,orders_count,units_sold,aov,cancels_count,refunds_count,refunds_amount,returns_count,delivered_count,settlement_expected,fees_total',
    sample:
      '2026-02-10,1000000,900000,10,15,100000,0,0,0,0,10,850000,50000',
  },
  META_INSTAGRAM: {
    headers:
      'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    sample: '2026-02-10,1,5000,3000,500,10000,400,80,20',
  },
  META_FACEBOOK: {
    headers:
      'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    sample: '2026-02-10,1,5000,3000,500,10000,400,80,20',
  },
  YOUTUBE: {
    headers:
      'date,uploads_count,views,reach,engagement,followers,likes,comments,shares',
    sample: '2026-02-10,1,10000,8000,1000,5000,800,150,50',
  },
  GA4: {
    headers:
      'date,sessions,users,new_users,pageviews,avg_session_duration,bounce_rate',
    sample: '2026-02-10,1000,800,200,3000,120,45.5',
  },
  NAVER_BLOG: {
    headers:
      'date,visitors,pageviews,avg_time_on_page,subscribers,new_subscribers,comments,likes,shares,search_visitors,direct_visitors,social_visitors,referral_visitors,posts_published,top_post_url,top_post_views',
    sample:
      '2026-02-10,1500,3200,180,5000,50,25,100,15,800,400,200,100,3,https://blog.naver.com/example/123,500',
  },
  NAVER_KEYWORDS: {
    headers: 'keyword,impressions,clicks,ctr,position',
    sample: '브랜드명,10000,500,5.0,3.5',
  },
  GOOGLE_SEARCH_CONSOLE: {
    headers: 'keyword,impressions,clicks,ctr,position',
    sample: 'brand name,10000,500,5.0,3.5',
  },
}

/**
 * 채널이 유효한 CSV 채널인지 확인
 */
export function isValidCsvChannel(channel: string): channel is ChannelProvider {
  return VALID_CSV_CHANNELS.includes(channel as ChannelProvider)
}

/**
 * CSV 템플릿 문자열 생성 (헤더 + 샘플)
 */
export function getCsvTemplateContent(channel: ChannelProvider): string {
  const template = CSV_TEMPLATES[channel]
  return `${template.headers}\n${template.sample}`
}

/**
 * 상품 데이터 CSV 템플릿 (스마트스토어/쿠팡 공통)
 */
export const PRODUCT_CSV_TEMPLATE: CsvTemplate = {
  headers: 'product_id,product_name,product_url,date,sales_count,sales_amount,units_sold',
  sample: 'PROD001,상품명 예시,https://smartstore.naver.com/example/products/123,2026-02-10,50,500000,55',
}

/**
 * 상품 CSV 템플릿 문자열 생성
 */
export function getProductCsvTemplateContent(): string {
  return `${PRODUCT_CSV_TEMPLATE.headers}\n${PRODUCT_CSV_TEMPLATE.sample}`
}
