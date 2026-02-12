import { StoreBaseConnector, StoreCredentials } from './store-base'
import { ConnectorConfig, ConnectionTestResult } from './base'
import { CHANNEL_LABELS } from '@/constants'

export interface CoupangCredentials extends StoreCredentials {
  vendorId?: string
  storeName?: string
}

/**
 * 쿠팡 커넥터
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
export class CoupangConnector extends StoreBaseConnector {
  constructor(config: ConnectorConfig) {
    super('COUPANG', config)
    this.credentials = config.credentials as CoupangCredentials
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const creds = this.credentials as CoupangCredentials
    return {
      valid: true,
      accountName: creds.storeName || creds.vendorId || CHANNEL_LABELS.COUPANG,
    }
  }
}
