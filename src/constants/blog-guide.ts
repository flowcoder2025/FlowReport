/**
 * 블로그 채널 연동 안내 상수
 *
 * 티스토리 Open API 종료로 인한 연동 방법 안내
 */

export const BLOG_GUIDE = {
  /** 네이버 블로그 안내 */
  NAVER_BLOG: {
    title: '네이버 블로그',
    description: 'CSV 업로드로 데이터를 입력하세요.',
    instruction: '템플릿 다운로드 후 네이버 블로그 통계 데이터를 입력하세요.',
  },
  /** 티스토리 안내 */
  TISTORY: {
    title: '티스토리',
    description: 'GA4 연동 후 GA4 채널에서 확인하세요.',
    instruction: '티스토리 Open API가 종료되어 직접 연동이 불가합니다. GA4를 연동하여 트래픽을 추적하세요.',
    recommendation: 'GA4 연동을 권장합니다.',
  },
  /** 가이드 문서 링크 */
  GUIDE_URL: '/docs/blog-integration-guide',
  /** 빈 데이터 안내 */
  EMPTY_DATA: {
    title: '블로그 데이터가 없습니다',
    description: '아래 방법으로 블로그 데이터를 연동하세요.',
  },
} as const

export type BlogGuideKey = keyof typeof BLOG_GUIDE
