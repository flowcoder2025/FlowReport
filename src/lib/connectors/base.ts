import { ChannelProvider } from '@prisma/client'

export interface ConnectorConfig {
  connectionId: string
  workspaceId: string
  credentials: Record<string, any>
}

export interface MetricData {
  date: Date
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  metrics: Record<string, number | string | null>
}

export interface ContentItemData {
  externalId: string
  url: string
  title?: string
  publishedAt: Date
  contentType: 'POST' | 'REEL' | 'STORY' | 'SHORT' | 'VIDEO' | 'ARTICLE' | 'PRODUCT'
  metrics?: Record<string, number>
}

export interface SyncResult {
  success: boolean
  metrics?: MetricData[]
  contentItems?: ContentItemData[]
  error?: string
}

export interface ConnectionTestResult {
  valid: boolean
  error?: string
  accountName?: string
}

/**
 * Base connector class that all data source connectors must extend
 */
export abstract class BaseConnector {
  protected config: ConnectorConfig
  protected provider: ChannelProvider

  constructor(provider: ChannelProvider, config: ConnectorConfig) {
    this.provider = provider
    this.config = config
  }

  /**
   * Test the connection with provided credentials
   */
  abstract testConnection(): Promise<ConnectionTestResult>

  /**
   * Sync metrics for the given date range
   */
  abstract syncMetrics(startDate: Date, endDate: Date): Promise<SyncResult>

  /**
   * Sync content items (posts, videos, etc.) for the given date range
   */
  abstract syncContent(startDate: Date, endDate: Date): Promise<SyncResult>

  /**
   * Get the provider type
   */
  getProvider(): ChannelProvider {
    return this.provider
  }

  /**
   * Get required credential fields for this connector
   */
  abstract getRequiredCredentialFields(): string[]
}
