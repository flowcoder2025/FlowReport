import { z } from 'zod'
import { ChannelProvider } from '@prisma/client'

// Date format validation
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')

// Store metrics schema (SmartStore, Coupang, etc.)
export const storeMetricSchema = z.object({
  date: dateString,
  sales_gmv: z.number().optional().nullable(),
  sales_net: z.number().optional().nullable(),
  orders_count: z.number().int().optional().nullable(),
  units_sold: z.number().int().optional().nullable(),
  aov: z.number().optional().nullable(),
  cancels_count: z.number().int().optional().nullable(),
  refunds_count: z.number().int().optional().nullable(),
  refunds_amount: z.number().optional().nullable(),
  returns_count: z.number().int().optional().nullable(),
  delivered_count: z.number().int().optional().nullable(),
  settlement_expected: z.number().optional().nullable(),
  fees_total: z.number().optional().nullable(),
})

// SNS metrics schema (Instagram, Facebook, YouTube)
export const snsMetricSchema = z.object({
  date: dateString,
  uploads_count: z.number().int().optional().nullable(),
  views: z.number().int().optional().nullable(),
  reach: z.number().int().optional().nullable(),
  engagement: z.number().int().optional().nullable(),
  followers: z.number().int().optional().nullable(),
  likes: z.number().int().optional().nullable(),
  comments: z.number().int().optional().nullable(),
  shares: z.number().int().optional().nullable(),
})

// Blog metrics schema (Naver Blog extended)
export const blogMetricSchema = z.object({
  date: dateString,

  // 기본 지표 (Basic Metrics)
  visitors: z.number().int().optional().nullable(),
  pageviews: z.number().int().optional().nullable(),
  avg_time_on_page: z.number().optional().nullable(), // seconds

  // 성장 지표 (Growth Metrics)
  subscribers: z.number().int().optional().nullable(),
  new_subscribers: z.number().int().optional().nullable(),
  subscriber_growth_rate: z.number().optional().nullable(), // percentage

  // 참여 지표 (Engagement Metrics)
  comments: z.number().int().optional().nullable(),
  likes: z.number().int().optional().nullable(),
  shares: z.number().int().optional().nullable(),

  // 유입 분석 (Traffic Source Metrics)
  search_visitors: z.number().int().optional().nullable(),
  direct_visitors: z.number().int().optional().nullable(),
  social_visitors: z.number().int().optional().nullable(),
  referral_visitors: z.number().int().optional().nullable(),

  // 콘텐츠 지표 (Content Metrics)
  posts_published: z.number().int().optional().nullable(),
  top_post_url: z.string().url().optional().nullable(),
  top_post_views: z.number().int().optional().nullable(),
})

// Keyword/SEO metrics schema
export const keywordMetricSchema = z.object({
  keyword: z.string().min(1),
  impressions: z.number().int().optional().nullable(),
  clicks: z.number().int().optional().nullable(),
  ctr: z.number().optional().nullable(),
  position: z.number().optional().nullable(),
})

// Traffic metrics schema (GA4)
export const trafficMetricSchema = z.object({
  date: dateString,
  sessions: z.number().int().optional().nullable(),
  users: z.number().int().optional().nullable(),
  new_users: z.number().int().optional().nullable(),
  pageviews: z.number().int().optional().nullable(),
  avg_session_duration: z.number().optional().nullable(),
  bounce_rate: z.number().optional().nullable(),
})

// Content item schema
export const contentItemSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  published_at: dateString,
  content_type: z.enum(['POST', 'REEL', 'STORY', 'SHORT', 'VIDEO', 'ARTICLE', 'PRODUCT']),
  views: z.number().int().optional().nullable(),
  likes: z.number().int().optional().nullable(),
  comments: z.number().int().optional().nullable(),
})

// Product metrics schema (for store product ranking)
export const productMetricSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  product_url: z.string().url().optional().nullable(),
  date: dateString,
  sales_count: z.number().int().optional().nullable(),
  sales_amount: z.number().optional().nullable(),
  units_sold: z.number().int().optional().nullable(),
})

// Map channel providers to their schemas
export const channelSchemas: Record<ChannelProvider, z.ZodSchema> = {
  GA4: trafficMetricSchema,
  META_INSTAGRAM: snsMetricSchema,
  META_FACEBOOK: snsMetricSchema,
  YOUTUBE: snsMetricSchema,
  SMARTSTORE: storeMetricSchema,
  COUPANG: storeMetricSchema,
  GOOGLE_SEARCH_CONSOLE: keywordMetricSchema,
  NAVER_BLOG: blogMetricSchema,
  NAVER_KEYWORDS: keywordMetricSchema,
}

export type StoreMetric = z.infer<typeof storeMetricSchema>
export type SnsMetric = z.infer<typeof snsMetricSchema>
export type BlogMetric = z.infer<typeof blogMetricSchema>
export type KeywordMetric = z.infer<typeof keywordMetricSchema>
export type TrafficMetric = z.infer<typeof trafficMetricSchema>
export type ContentItemInput = z.infer<typeof contentItemSchema>
export type ProductMetric = z.infer<typeof productMetricSchema>
