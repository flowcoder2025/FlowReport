import { BaseConnector, ConnectorConfig, SyncResult, ConnectionTestResult, MetricData, ContentItemData } from './base'
import { format, eachDayOfInterval, parseISO } from 'date-fns'

export interface YouTubeCredentials {
  accessToken: string
  refreshToken?: string
  channelId?: string
}

interface AnalyticsReportResponse {
  rows?: (string | number)[][]
  columnHeaders?: { name: string }[]
}

interface VideoSearchResponse {
  items?: {
    id: { videoId: string }
    snippet: {
      title: string
      publishedAt: string
    }
  }[]
  nextPageToken?: string
}

interface VideoStatsResponse {
  items?: {
    id: string
    statistics: {
      viewCount: string
      likeCount: string
      commentCount: string
    }
  }[]
}

/**
 * YouTube Connector
 * Uses YouTube Analytics API and Data API
 */
export class YouTubeConnector extends BaseConnector {
  private credentials: YouTubeCredentials
  private baseUrl = 'https://www.googleapis.com/youtube/v3'
  private analyticsUrl = 'https://youtubeanalytics.googleapis.com/v2'

  constructor(config: ConnectorConfig) {
    super('YOUTUBE', config)
    this.credentials = config.credentials as YouTubeCredentials
  }

  getRequiredCredentialFields(): string[] {
    return ['accessToken']
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      if (!this.credentials.accessToken) {
        return {
          valid: false,
          error: 'Missing access token',
        }
      }

      // Test the token by fetching channel info
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet&mine=true`,
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          valid: false,
          error: error.error?.message || 'Invalid access token',
        }
      }

      const data = await response.json()
      const channel = data.items?.[0]

      if (!channel) {
        return {
          valid: false,
          error: 'No channel found for this account',
        }
      }

      // 채널 ID 저장 (나중에 사용)
      this.credentials.channelId = channel.id

      return {
        valid: true,
        accountName: channel.snippet?.title || 'YouTube Channel',
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
      // 채널 ID 확보
      let channelId = this.credentials.channelId
      if (!channelId) {
        const channelResponse = await fetch(
          `${this.baseUrl}/channels?part=id&mine=true`,
          {
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
            },
          }
        )
        if (channelResponse.ok) {
          const channelData = await channelResponse.json()
          channelId = channelData.items?.[0]?.id
        }
      }

      if (!channelId) {
        return {
          success: false,
          error: 'Unable to get channel ID',
        }
      }

      // YouTube Analytics API 호출
      const analyticsUrl = `${this.analyticsUrl}/reports?` +
        `ids=channel==${channelId}&` +
        `startDate=${format(startDate, 'yyyy-MM-dd')}&` +
        `endDate=${format(endDate, 'yyyy-MM-dd')}&` +
        `metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares&` +
        `dimensions=day&` +
        `sort=day`

      const response = await fetch(analyticsUrl, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        // 권한 없는 경우 빈 데이터 반환 (CSV 업로드로 대체 가능)
        if (error.error?.code === 403 || error.error?.code === 401) {
          console.warn('YouTube Analytics API error:', error.error?.message)
          return this.getEmptyMetrics(startDate, endDate)
        }
        throw new Error(error.error?.message || 'Failed to fetch analytics')
      }

      const analyticsData: AnalyticsReportResponse = await response.json()

      // 날짜별 메트릭 맵 생성
      const metricsMap = new Map<string, Record<string, number | null>>()

      // 모든 날짜 초기화
      const allDates = eachDayOfInterval({ start: startDate, end: endDate })
      for (const date of allDates) {
        const dateKey = format(date, 'yyyy-MM-dd')
        metricsMap.set(dateKey, {
          views: null,
          estimatedMinutesWatched: null,
          averageViewDuration: null,
          subscriberGained: null,
          subscriberLost: null,
          likes: null,
          comments: null,
          shares: null,
        })
      }

      // Analytics API 응답 파싱
      if (analyticsData.rows) {
        const headers = analyticsData.columnHeaders?.map((h) => h.name) || []

        for (const row of analyticsData.rows) {
          const dateKey = row[0] as string // day dimension
          const existing = metricsMap.get(dateKey)
          if (existing) {
            headers.forEach((header, index) => {
              if (index > 0 && header) {
                // 첫 번째는 날짜
                const metricName = this.normalizeMetricName(header)
                existing[metricName] = row[index] as number
              }
            })
          }
        }
      }

      // 현재 구독자 수 조회
      const subscribersResponse = await fetch(
        `${this.baseUrl}/channels?part=statistics&id=${channelId}`,
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
          },
        }
      )

      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse.json()
        const stats = subscribersData.items?.[0]?.statistics
        if (stats) {
          // 마지막 날짜에 구독자 수 추가
          const lastDate = format(endDate, 'yyyy-MM-dd')
          const lastMetrics = metricsMap.get(lastDate)
          if (lastMetrics) {
            lastMetrics.followers = parseInt(stats.subscriberCount, 10) || null
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
      console.error('YouTube syncMetrics error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async syncContent(startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      const contentItems: ContentItemData[] = []

      // 채널 ID 확보
      let channelId = this.credentials.channelId
      if (!channelId) {
        const channelResponse = await fetch(
          `${this.baseUrl}/channels?part=id&mine=true`,
          {
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
            },
          }
        )
        if (channelResponse.ok) {
          const channelData = await channelResponse.json()
          channelId = channelData.items?.[0]?.id
        }
      }

      if (!channelId) {
        return {
          success: false,
          error: 'Unable to get channel ID',
        }
      }

      // 비디오 검색 (날짜 범위 내)
      const searchUrl = `${this.baseUrl}/search?` +
        `part=snippet&` +
        `channelId=${channelId}&` +
        `type=video&` +
        `publishedAfter=${startDate.toISOString()}&` +
        `publishedBefore=${endDate.toISOString()}&` +
        `maxResults=50&` +
        `order=date`

      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      })

      if (!searchResponse.ok) {
        // 검색 실패해도 빈 배열 반환 (정상 처리)
        console.warn('YouTube search API failed')
        return {
          success: true,
          contentItems: [],
        }
      }

      const searchData: VideoSearchResponse = await searchResponse.json()
      const videoIds = searchData.items?.map((item) => item.id.videoId) || []

      if (videoIds.length === 0) {
        return {
          success: true,
          contentItems: [],
        }
      }

      // 비디오 통계 조회
      const statsUrl = `${this.baseUrl}/videos?` +
        `part=statistics&` +
        `id=${videoIds.join(',')}`

      const statsResponse = await fetch(statsUrl, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      })

      const statsMap = new Map<string, { views: number; likes: number; comments: number }>()

      if (statsResponse.ok) {
        const statsData: VideoStatsResponse = await statsResponse.json()
        for (const item of statsData.items || []) {
          statsMap.set(item.id, {
            views: parseInt(item.statistics.viewCount, 10) || 0,
            likes: parseInt(item.statistics.likeCount, 10) || 0,
            comments: parseInt(item.statistics.commentCount, 10) || 0,
          })
        }
      }

      // ContentItem 생성
      for (const item of searchData.items || []) {
        const videoId = item.id.videoId
        const publishedAt = new Date(item.snippet.publishedAt)
        const stats = statsMap.get(videoId)

        // Shorts 여부 판단 (제목 또는 URL로)
        const isShort = item.snippet.title.toLowerCase().includes('#shorts')

        contentItems.push({
          externalId: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: item.snippet.title,
          publishedAt,
          contentType: isShort ? 'SHORT' : 'VIDEO',
          metrics: stats || { views: 0, likes: 0, comments: 0 },
        })
      }

      return {
        success: true,
        contentItems,
      }
    } catch (error) {
      console.error('YouTube syncContent error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private normalizeMetricName(name: string): string {
    const mapping: Record<string, string> = {
      views: 'views',
      estimatedMinutesWatched: 'estimatedMinutesWatched',
      averageViewDuration: 'averageViewDuration',
      subscribersGained: 'subscriberGained',
      subscribersLost: 'subscriberLost',
      likes: 'likes',
      comments: 'comments',
      shares: 'shares',
    }
    return mapping[name] || name
  }

  private getEmptyMetrics(startDate: Date, endDate: Date): SyncResult {
    const allDates = eachDayOfInterval({ start: startDate, end: endDate })
    const metrics: MetricData[] = allDates.map((date) => ({
      date,
      periodType: 'DAILY' as const,
      metrics: {
        views: null,
        estimatedMinutesWatched: null,
        averageViewDuration: null,
        subscriberGained: null,
        subscriberLost: null,
        likes: null,
        comments: null,
        shares: null,
      },
    }))

    return {
      success: true,
      metrics,
    }
  }
}
