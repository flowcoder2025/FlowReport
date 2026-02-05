import { StoreBaseConnector, StoreCredentials } from './store-base'
import { ConnectorConfig, ConnectionTestResult } from './base'

export interface SmartStoreCredentials extends StoreCredentials {
  storeName?: string
  storeId?: string
}

/**
 * 네이버 스마트스토어 커넥터
 * CSV 업로드 전용 - API 연동 없음
 *
 * 지원 메트릭:
 * - sales_gmv: 결제금액
 * - sales_net: 순매출
 * - orders_count: 주문 수
 * - units_sold: 판매 수량
 * - aov: 객단가
 * - cancels_count: 취소 수
 * - refunds_count: 환불 수
 * - refunds_amount: 환불 금액
 * - returns_count: 반품 수
 * - delivered_count: 배송완료 수
 * - settlement_expected: 정산예정금
 * - fees_total: 수수료
 */
export class SmartStoreConnector extends StoreBaseConnector {
  constructor(config: ConnectorConfig) {
    super('SMARTSTORE', config)
    this.credentials = config.credentials as SmartStoreCredentials
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const creds = this.credentials as SmartStoreCredentials
    return {
      valid: true,
      accountName: creds.storeName || '스마트스토어',
    }
  }
}
