import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { BaseConnector, ConnectorConfig, SyncResult, ConnectionTestResult, MetricData } from './base'
import { format, eachDayOfInterval } from 'date-fns'

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
  private client: BetaAnalyticsDataClient | null = null

  constructor(config: ConnectorConfig) {
    super('GA4', config)
    this.credentials = config.credentials as GA4Credentials
  }

  getRequiredCredentialFields(): string[] {
    return ['serviceAccountJson', 'propertyId']
  }

  /**
   * 서비스 계정으로 GA4 클라이언트 초기화
   */
  private getClient(): BetaAnalyticsDataClient {
    if (!this.client) {
      const serviceAccount = JSON.parse(this.credentials.serviceAccountJson)
      this.client = new BetaAnalyticsDataClient({
        credentials: {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
        },
        projectId: serviceAccount.project_id,
      })
    }
    return this.client
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      // 필수 자격증명 확인
      if (!this.credentials.serviceAccountJson || !this.credentials.propertyId) {
        return {
          valid: false,
          error: 'Missing required credentials: serviceAccountJson and propertyId',
        }
      }

      // JSON 형식 검증
      let serviceAccount
      try {
        serviceAccount = JSON.parse(this.credentials.serviceAccountJson)
      } catch {
        return {
          valid: false,
          error: 'Invalid service account JSON format',
        }
      }

      // 필수 필드 확인
      if (!serviceAccount.client_email || !serviceAccount.private_key) {
        return {
          valid: false,
          error: 'Service account JSON must contain client_email and private_key',
        }
      }

      // Property ID 형식 검증 (숫자)
      if (!/^\d+$/.test(this.credentials.propertyId)) {
        return {
          valid: false,
          error: 'Invalid property ID format (should be numeric)',
        }
      }

      // 실제 API 호출로 연결 테스트
      const client = this.getClient()
      const propertyPath = `properties/${this.credentials.propertyId}`

      // getMetadata API로 속성 접근 권한 확인
      const [metadata] = await client.getMetadata({
        name: `${propertyPath}/metadata`,
      })

      // 속성 이름 가져오기 시도 (실패해도 연결은 성공)
      let accountName = `GA4 Property: ${this.credentials.propertyId}`
      if (metadata && metadata.name) {
        accountName = `GA4: ${this.credentials.propertyId}`
      }

      return {
        valid: true,
        accountName,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // 일반적인 오류 메시지 변환
      if (errorMessage.includes('PERMISSION_DENIED')) {
        return {
          valid: false,
          error: 'Permission denied. Check if the service account has access to this property.',
        }
      }
      if (errorMessage.includes('NOT_FOUND')) {
        return {
          valid: false,
          error: 'Property not found. Check if the property ID is correct.',
        }
      }
      if (errorMessage.includes('INVALID_ARGUMENT')) {
        return {
          valid: false,
          error: 'Invalid property ID format.',
        }
      }

      return {
        valid: false,
        error: errorMessage,
      }
    }
  }

  async syncMetrics(startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      const client = this.getClient()
      const propertyPath = `properties/${this.credentials.propertyId}`

      // GA4 API 호출
      const [response] = await client.runReport({
        property: propertyPath,
        dateRanges: [
          {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
          },
        ],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'engagementRate' },
          { name: 'activeUsers' },
        ],
        orderBys: [
          {
            dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' },
            desc: false,
          },
        ],
      })

      // 응답 파싱
      const metricsMap = new Map<string, MetricData>()

      if (response.rows) {
        for (const row of response.rows) {
          const dateStr = row.dimensionValues?.[0]?.value
          if (!dateStr) continue

          // YYYYMMDD → Date
          const year = parseInt(dateStr.substring(0, 4))
          const month = parseInt(dateStr.substring(4, 6)) - 1
          const day = parseInt(dateStr.substring(6, 8))
          const date = new Date(year, month, day)

          const values = row.metricValues || []

          metricsMap.set(dateStr, {
            date,
            periodType: 'DAILY',
            metrics: {
              sessions: parseFloat(values[0]?.value || '0'),
              totalUsers: parseFloat(values[1]?.value || '0'),
              newUsers: parseFloat(values[2]?.value || '0'),
              screenPageViews: parseFloat(values[3]?.value || '0'),
              averageSessionDuration: parseFloat(values[4]?.value || '0'),
              bounceRate: parseFloat(values[5]?.value || '0') * 100, // 소수 → 퍼센트
              engagementRate: parseFloat(values[6]?.value || '0') * 100,
              activeUsers: parseFloat(values[7]?.value || '0'),
            },
          })
        }
      }

      // 날짜 범위의 모든 날짜에 대해 데이터 생성 (없는 날짜는 0으로)
      const allDates = eachDayOfInterval({ start: startDate, end: endDate })
      const metrics: MetricData[] = allDates.map((date) => {
        const dateStr = format(date, 'yyyyMMdd')
        const existing = metricsMap.get(dateStr)

        if (existing) {
          return existing
        }

        return {
          date,
          periodType: 'DAILY' as const,
          metrics: {
            sessions: 0,
            totalUsers: 0,
            newUsers: 0,
            screenPageViews: 0,
            averageSessionDuration: 0,
            bounceRate: 0,
            engagementRate: 0,
            activeUsers: 0,
          },
        }
      })

      return {
        success: true,
        metrics,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('GA4 syncMetrics error:', errorMessage)

      return {
        success: false,
        error: errorMessage,
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
