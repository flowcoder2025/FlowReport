import { BaseConnector, ConnectorConfig, SyncResult, ConnectionTestResult } from './base'
import { ChannelProvider } from '@prisma/client'

export interface StoreCredentials {
  // CSV 전용이므로 API 자격증명 없음
  // 필요 시 인증 정보 추가 가능
  storeName?: string
  storeId?: string
}

/**
 * 스토어 커넥터 베이스 클래스
 * SmartStore, Coupang 등 CSV 전용 커넥터의 공통 로직
 */
export abstract class StoreBaseConnector extends BaseConnector {
  protected credentials: StoreCredentials

  constructor(provider: ChannelProvider, config: ConnectorConfig) {
    super(provider, config)
    this.credentials = config.credentials as StoreCredentials
  }

  /**
   * CSV 전용이므로 API 연결 테스트 없음
   * 단순히 설정이 유효한지만 확인
   */
  async testConnection(): Promise<ConnectionTestResult> {
    return {
      valid: true,
      accountName: this.credentials.storeName || `${this.provider} Store`,
    }
  }

  /**
   * CSV 전용이므로 API 동기화 없음
   * CSV 업로드를 통해 데이터 입력
   */
  async syncMetrics(): Promise<SyncResult> {
    return {
      success: true,
      metrics: [],
    }
  }

  /**
   * CSV 전용이므로 콘텐츠 동기화 없음
   */
  async syncContent(): Promise<SyncResult> {
    return {
      success: true,
      contentItems: [],
    }
  }

  /**
   * CSV 전용 커넥터는 API 자격증명 필요 없음
   */
  getRequiredCredentialFields(): string[] {
    return []
  }
}
