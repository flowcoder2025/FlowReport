import { BaseConnector, ConnectorConfig, SyncResult, ConnectionTestResult, MetricData, ContentItemData } from './base'
import { ChannelProvider } from '@prisma/client'
import { format, eachDayOfInterval, parseISO } from 'date-fns'

export interface MetaCredentials {
  accessToken: string
  pageId?: string
  pageAccessToken?: string
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

  /**
   * Get the best available access token (page token preferred)
   */
  private getAccessToken(): string {
    return this.credentials.pageAccessToken || this.credentials.accessToken
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const token = this.getAccessToken()
      if (!token) {
        return {
          valid: false,
          error: 'Missing access token',
        }
      }

      const accountId = this.getAccountId()
      if (!accountId) {
        return {
          valid: false,
          error: this.provider === 'META_INSTAGRAM'
            ? 'Instagram 비즈니스 계정 ID가 없습니다. 재연결해주세요.'
            : 'Facebook 페이지 ID가 없습니다. 재연결해주세요.',
        }
      }

      // 계정 접근 권한 확인
      const fields = this.provider === 'META_INSTAGRAM'
        ? 'id,username,name'
        : 'id,name'
      const accountResponse = await fetch(
        `${this.baseUrl}/${accountId}?fields=${fields}&access_token=${token}`
      )

      if (!accountResponse.ok) {
        const error = await accountResponse.json()
        return {
          valid: false,
          error: error.error?.message || '계정에 접근할 수 없습니다. 재연결이 필요합니다.',
        }
      }

      const accountData = await accountResponse.json()
      return {
        valid: true,
        accountName: accountData.username || accountData.name || accountId,
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
          : 'page_impressions,page_post_engagements,page_fan_adds,page_views_total'

      // Graph API insights 호출
      const insightsUrl = `${this.baseUrl}/${accountId}/insights?` +
        `metric=${metricNames}&` +
        `period=day&` +
        `since=${Math.floor(startDate.getTime() / 1000)}&` +
        `until=${Math.floor(endDate.getTime() / 1000)}&` +
        `access_token=${this.getAccessToken()}`

      const response = await fetch(insightsUrl)

      if (!response.ok) {
        const error = await response.json()
        console.warn('Meta insights API error:', JSON.stringify(error, null, 2))
        console.warn('Request URL:', insightsUrl.replace(/access_token=[^&]+/, 'access_token=***'))

        // 토큰 만료
        if (error.error?.code === 190) {
          return {
            success: false,
            error: 'API 권한 오류: 재연결이 필요합니다',
            keepExistingData: true,
            metrics: [],
          }
        }

        // 잘못된 메트릭 또는 새 페이지 (데이터 없음) - 빈 데이터 반환
        if (error.error?.code === 100) {
          console.warn('Insights not available yet (new page or invalid metrics)')
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
          `${this.baseUrl}/${accountId}?fields=followers_count&access_token=${this.getAccessToken()}`
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
          `access_token=${this.getAccessToken()}`

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
          `access_token=${this.getAccessToken()}`

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
      page_post_engagements: 'engagement',
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
