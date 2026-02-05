import { BaseConnector, ConnectorConfig, SyncResult, ConnectionTestResult, MetricData, ContentItemData } from './base'
import { ChannelProvider } from '@prisma/client'

export interface MetaCredentials {
  accessToken: string
  pageId?: string
  instagramBusinessAccountId?: string
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
      const metrics: MetricData[] = []
      const accountId =
        this.provider === 'META_INSTAGRAM'
          ? this.credentials.instagramBusinessAccountId
          : this.credentials.pageId

      if (!accountId) {
        return {
          success: false,
          error: 'Missing account ID',
        }
      }

      // Fetch insights
      // In production, call the actual API:
      // const insightsUrl = `${this.baseUrl}/${accountId}/insights?...`
      // const response = await fetch(insightsUrl)

      // For MVP, return structure for manual data entry or CSV upload
      const current = new Date(startDate)
      while (current <= endDate) {
        metrics.push({
          date: new Date(current),
          periodType: 'DAILY',
          metrics: {
            impressions: null,
            reach: null,
            profile_views: null,
            follower_count: null,
            engagement: null,
          },
        })
        current.setDate(current.getDate() + 1)
      }

      return {
        success: true,
        metrics,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async syncContent(startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      const contentItems: ContentItemData[] = []
      const accountId =
        this.provider === 'META_INSTAGRAM'
          ? this.credentials.instagramBusinessAccountId
          : this.credentials.pageId

      if (!accountId) {
        return {
          success: false,
          error: 'Missing account ID',
        }
      }

      // In production, fetch media/posts from the API
      // const mediaUrl = `${this.baseUrl}/${accountId}/media?fields=...`
      // const response = await fetch(mediaUrl)

      return {
        success: true,
        contentItems,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
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
