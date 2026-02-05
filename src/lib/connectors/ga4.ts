import { BaseConnector, ConnectorConfig, SyncResult, ConnectionTestResult, MetricData } from './base'

export interface GA4Credentials {
  serviceAccountJson: string
  propertyId: string
}

/**
 * Google Analytics 4 Connector
 * Uses GA4 Data API to fetch traffic and user metrics
 */
export class GA4Connector extends BaseConnector {
  private credentials: GA4Credentials

  constructor(config: ConnectorConfig) {
    super('GA4', config)
    this.credentials = config.credentials as GA4Credentials
  }

  getRequiredCredentialFields(): string[] {
    return ['serviceAccountJson', 'propertyId']
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      // In production, use @google-analytics/data library
      // For MVP, we simulate the connection test
      if (!this.credentials.serviceAccountJson || !this.credentials.propertyId) {
        return {
          valid: false,
          error: 'Missing required credentials: serviceAccountJson and propertyId',
        }
      }

      // Validate JSON format
      try {
        JSON.parse(this.credentials.serviceAccountJson)
      } catch {
        return {
          valid: false,
          error: 'Invalid service account JSON format',
        }
      }

      // Validate property ID format (should be numeric)
      if (!/^\d+$/.test(this.credentials.propertyId)) {
        return {
          valid: false,
          error: 'Invalid property ID format (should be numeric)',
        }
      }

      return {
        valid: true,
        accountName: `GA4 Property: ${this.credentials.propertyId}`,
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async syncMetrics(startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      // In production, implement actual GA4 API call:
      // const { BetaAnalyticsDataClient } = require('@google-analytics/data')
      // const client = new BetaAnalyticsDataClient({ credentials: JSON.parse(this.credentials.serviceAccountJson) })
      // const [response] = await client.runReport({ property: `properties/${this.credentials.propertyId}`, ... })

      // For MVP, return mock data structure
      const metrics: MetricData[] = []
      const current = new Date(startDate)

      while (current <= endDate) {
        metrics.push({
          date: new Date(current),
          periodType: 'DAILY',
          metrics: {
            sessions: null, // Will be filled by actual API
            users: null,
            new_users: null,
            pageviews: null,
            avg_session_duration: null,
            bounce_rate: null,
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

  async syncContent(): Promise<SyncResult> {
    // GA4 doesn't have content items
    return {
      success: true,
      contentItems: [],
    }
  }
}
