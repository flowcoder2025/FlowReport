import { BaseConnector, ConnectorConfig, SyncResult, ConnectionTestResult, MetricData, ContentItemData } from './base'
import { ChannelProvider } from '@prisma/client'
import { format, eachDayOfInterval, parseISO } from 'date-fns'

export interface MetaCredentials {
  accessToken: string
  pageId?: string
  instagramBusinessAccountId?: string
}

interface InsightsResponse {
  data: {
    name: string
    period: string
    values: { value: number; end_time: string }[]
  }[]
  paging?: { next?: string }
}

interface MediaResponse {
  data: {
    id: string
    media_type: string
    media_url?: string
    permalink: string
    caption?: string
    timestamp: string
    like_count?: number
    comments_count?: number
    insights?: {
      data: { name: string; values: { value: number }[] }[]
    }
  }[]
  paging?: { next?: string }
}

/**
 * Meta (Instagram/Facebook) Connector
 * Uses Graph API to fetch insights and content
 */
export class MetaConnector extends BaseConnector {
  private credentials: MetaCredentials
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(provider: 'META_INSTAGRAM' | 'META_FACEBOOK', config: ConnectorConfig) {
    super(provider, config)
    this.credentials = config.credentials as MetaCredentials
  }

  getRequiredCredentialFields(): string[] {
    return this.provider === 'META_INSTAGRAM'
      ? ['accessToken', 'instagramBusinessAccountId']
      : ['accessToken', 'pageId']
  }

  private getAccountId(): string | undefined {
    return this.provider === 'META_INSTAGRAM'
      ? this.credentials.instagramBusinessAccountId
      : this.credentials.pageId
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      if (!this.credentials.accessToken) {
        return {
          valid: false,
          error: 'Missing access token',
        }
      }

      // Test the token by fetching user info
      const response = await fetch(
        `${this.baseUrl}/me?access_token=${this.credentials.accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          valid: false,
          error: error.error?.message || 'Invalid access token',
        }
      }

      const data = await response.json()

      // 계정 ID 확인
      const accountId = this.getAccountId()
      if (accountId) {
        // 계정 접근 권한 확인
        const accountResponse = await fetch(
          `${this.baseUrl}/${accountId}?fields=name,username&access_token=${this.credentials.accessToken}`
        )
        if (accountResponse.ok) {
          const accountData = await accountResponse.json()
          return {
            valid: true,
            accountName: accountData.username || accountData.name || accountId,
          }
        }
      }

      return {
        valid: true,
        accountName: data.name || data.id,
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }
    }
  }

  async syncMetrics(startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      const accountId = this.getAccountId()

      if (!accountId) {
        return {
          success: false,
          error: 'Missing account ID',
        }
      }

      // Instagram과 Facebook의 metrics 이름이 다름
      const metricNames =
        this.provider === 'META_INSTAGRAM'
          ? 'impressions,reach,profile_views,follower_count'
          : 'page_impressions,page_engaged_users,page_fan_adds,page_views_total'

      // Graph API insights 호출
      const insightsUrl = `${this.baseUrl}/${accountId}/insights?` +
        `metric=${metricNames}&` +
        `period=day&` +
        `since=${Math.floor(startDate.getTime() / 1000)}&` +
        `until=${Math.floor(endDate.getTime() / 1000)}&` +
        `access_token=${this.credentials.accessToken}`

      const response = await fetch(insightsUrl)

      if (!response.ok) {
        const error = await response.json()
        // 권한 없거나 기간 제한인 경우 빈 데이터 반환 (정상 처리)
        if (error.error?.code === 100 || error.error?.code === 190) {
          console.warn('Meta insights API error:', error.error?.message)
          return this.getEmptyMetrics(startDate, endDate)
        }
        throw new Error(error.error?.message || 'Failed to fetch insights')
      }

      const insightsData: InsightsResponse = await response.json()

      // 날짜별 메트릭 맵 생성
      const metricsMap = new Map<string, Record<string, number | null>>()

      // 모든 날짜 초기화
      const allDates = eachDayOfInterval({ start: startDate, end: endDate })
      for (const date of allDates) {
        const dateKey = format(date, 'yyyy-MM-dd')
        metricsMap.set(dateKey, {
          impressions: null,
          reach: null,
          followers: null,
          engagement: null,
          profileViews: null,
        })
      }

      // API 응답 파싱
      for (const metric of insightsData.data) {
        const metricName = this.normalizeMetricName(metric.name)
        for (const value of metric.values) {
          const dateKey = value.end_time.split('T')[0]
          const existing = metricsMap.get(dateKey)
          if (existing) {
            existing[metricName] = value.value
          }
        }
      }

      // 팔로워 수 조회 (Instagram만)
      if (this.provider === 'META_INSTAGRAM') {
        const followersResponse = await fetch(
          `${this.baseUrl}/${accountId}?fields=followers_count&access_token=${this.credentials.accessToken}`
        )
        if (followersResponse.ok) {
          const followersData = await followersResponse.json()
          // 마지막 날짜에 팔로워 수 추가
          const lastDate = format(endDate, 'yyyy-MM-dd')
          const lastMetrics = metricsMap.get(lastDate)
          if (lastMetrics) {
            lastMetrics.followers = followersData.followers_count || null
          }
        }
      }

      // MetricData 배열로 변환
      const metrics: MetricData[] = Array.from(metricsMap.entries()).map(([dateStr, data]) => ({
        date: parseISO(dateStr),
        periodType: 'DAILY' as const,
        metrics: data,
      }))

      return {
        success: true,
        metrics,
      }
    } catch (error) {
      console.error('Meta syncMetrics error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async syncContent(startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      const accountId = this.getAccountId()

      if (!accountId) {
        return {
          success: false,
          error: 'Missing account ID',
        }
      }

      const contentItems: ContentItemData[] = []

      // Media endpoint 호출 (Instagram)
      if (this.provider === 'META_INSTAGRAM') {
        const mediaUrl = `${this.baseUrl}/${accountId}/media?` +
          `fields=id,media_type,permalink,caption,timestamp,like_count,comments_count&` +
          `since=${Math.floor(startDate.getTime() / 1000)}&` +
          `until=${Math.floor(endDate.getTime() / 1000)}&` +
          `access_token=${this.credentials.accessToken}`

        const response = await fetch(mediaUrl)

        if (response.ok) {
          const mediaData: MediaResponse = await response.json()

          for (const item of mediaData.data) {
            const publishedAt = new Date(item.timestamp)

            // 날짜 범위 내인지 확인
            if (publishedAt >= startDate && publishedAt <= endDate) {
              contentItems.push({
                externalId: item.id,
                url: item.permalink,
                title: item.caption?.slice(0, 100) || undefined,
                publishedAt,
                contentType: this.mapMediaType(item.media_type),
                metrics: {
                  likes: item.like_count || 0,
                  comments: item.comments_count || 0,
                },
              })
            }
          }
        }
      }
      // Posts endpoint (Facebook)
      else {
        const postsUrl = `${this.baseUrl}/${accountId}/posts?` +
          `fields=id,permalink_url,message,created_time,reactions.summary(true),comments.summary(true),shares&` +
          `since=${Math.floor(startDate.getTime() / 1000)}&` +
          `until=${Math.floor(endDate.getTime() / 1000)}&` +
          `access_token=${this.credentials.accessToken}`

        const response = await fetch(postsUrl)

        if (response.ok) {
          const postsData = await response.json()

          for (const post of postsData.data || []) {
            const publishedAt = new Date(post.created_time)

            if (publishedAt >= startDate && publishedAt <= endDate) {
              contentItems.push({
                externalId: post.id,
                url: post.permalink_url || `https://facebook.com/${post.id}`,
                title: post.message?.slice(0, 100) || undefined,
                publishedAt,
                contentType: 'POST',
                metrics: {
                  likes: post.reactions?.summary?.total_count || 0,
                  comments: post.comments?.summary?.total_count || 0,
                  shares: post.shares?.count || 0,
                },
              })
            }
          }
        }
      }

      return {
        success: true,
        contentItems,
      }
    } catch (error) {
      console.error('Meta syncContent error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private normalizeMetricName(name: string): string {
    const mapping: Record<string, string> = {
      impressions: 'impressions',
      reach: 'reach',
      profile_views: 'profileViews',
      follower_count: 'followers',
      page_impressions: 'impressions',
      page_engaged_users: 'engagement',
      page_fan_adds: 'followers',
      page_views_total: 'profileViews',
    }
    return mapping[name] || name
  }

  private mapMediaType(mediaType: string): ContentItemData['contentType'] {
    const mapping: Record<string, ContentItemData['contentType']> = {
      IMAGE: 'POST',
      VIDEO: 'VIDEO',
      CAROUSEL_ALBUM: 'POST',
      REELS: 'REEL',
    }
    return mapping[mediaType] || 'POST'
  }

  private getEmptyMetrics(startDate: Date, endDate: Date): SyncResult {
    const allDates = eachDayOfInterval({ start: startDate, end: endDate })
    const metrics: MetricData[] = allDates.map((date) => ({
      date,
      periodType: 'DAILY' as const,
      metrics: {
        impressions: null,
        reach: null,
        followers: null,
        engagement: null,
        profileViews: null,
      },
    }))

    return {
      success: true,
      metrics,
    }
  }
}

/**
 * Factory function to create Meta connector
 */
export function createMetaConnector(
  provider: ChannelProvider,
  config: ConnectorConfig
): MetaConnector | null {
  if (provider === 'META_INSTAGRAM' || provider === 'META_FACEBOOK') {
    return new MetaConnector(provider, config)
  }
  return null
}
