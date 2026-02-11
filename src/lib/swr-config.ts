import type { SWRConfiguration } from 'swr'

/**
 * 전역 SWR 설정
 *
 * 개별 훅에서 오버라이드 가능하지만, 일관성을 위해
 * 가능한 전역 설정을 사용하는 것을 권장합니다.
 */
export const swrConfig: SWRConfiguration = {
  // 1분 - 동일 키에 대한 중복 요청 방지
  dedupingInterval: 60000,

  // 포커스 시 재검증 비활성화 (대시보드 데이터는 명시적 갱신 선호)
  revalidateOnFocus: false,

  // 재연결 시 재검증 비활성화
  revalidateOnReconnect: false,

  // 새 데이터 로드 중 이전 데이터 유지 (깜빡임 방지)
  keepPreviousData: true,

  // 에러 시 3회 재시도
  errorRetryCount: 3,
}
