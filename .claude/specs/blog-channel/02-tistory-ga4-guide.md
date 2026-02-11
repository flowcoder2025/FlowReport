# Phase 2: 티스토리 GA4 연동 가이드

> 상태: ✅ 완료 | 기간: 2026-02-11

## 개요

티스토리 Open API 종료(2024.02)로 인해 직접 API 연동 대신 GA4 기반 연동 가이드를 제공.

## 스코프 변경 이력

| 항목 | 기존 계획 | 변경 후 |
|------|----------|--------|
| 목표 | 티스토리 Open API 연동 | GA4 연동 가이드 제공 |
| 사유 | - | API 2024.02 종료 |
| 대안 | - | GA4 통합 경로 활용 |

## 완료된 Tasks

### Task 1: 티스토리 GA4 연동 가이드 문서

**신규 파일:**
- `docs/guides/tistory-ga4-integration.md`

**가이드 구성:**
1. 개요 - API 종료 안내, GA4 장점
2. 사전 준비 - Google Analytics 계정/속성 생성
3. 티스토리 GA4 설정 - 추적 코드 삽입 방법
4. FlowReport 연동 - 서비스 계정 설정
5. 데이터 확인 - 연동 후 확인 방법
6. 문제 해결 - 일반적인 오류 및 해결

---

### Task 2: 블로그 연동 안내 UI 개선

**신규 파일:**
- `src/constants/blog-guide.ts`

**수정 파일:**
- `src/constants/index.ts`
- `src/components/dashboard/blog/internal/blog-view.tsx`
- `src/components/dashboard/csv-upload.tsx`

**BLOG_GUIDE 상수:**
```typescript
export const BLOG_GUIDE = {
  NAVER_BLOG: {
    title: '네이버 블로그',
    description: 'CSV 업로드로 데이터를 입력하세요.',
    instruction: '템플릿 다운로드 후 네이버 블로그 통계 데이터를 입력하세요.',
  },
  TISTORY: {
    title: '티스토리',
    description: 'GA4 연동 후 GA4 채널에서 확인하세요.',
    instruction: '티스토리 Open API가 종료되어 직접 연동이 불가합니다.',
    recommendation: 'GA4 연동을 권장합니다.',
  },
  GUIDE_URL: '/docs/blog-integration-guide',
  EMPTY_DATA: {
    title: '블로그 데이터가 없습니다',
    description: '아래 방법으로 블로그 데이터를 연동하세요.',
  },
} as const
```

**UI 변경:**
- 블로그 대시보드: 데이터 없을 때 연동 안내 배너 표시
- CSV 업로드: 채널별 안내 메시지 추가

---

## CTO 기술 리뷰

**결과:** ✅ 승인

| 항목 | 평가 |
|------|------|
| 문서 품질 | 9/10 - 상세하고 실용적 |
| 코드 품질 | 8/10 - 상수 분리, 하드코딩 없음 |
| 아키텍처 | 준수 - module/index.ts 구조 |

---

## Git Commit

```
dfe3c67 feat: 블로그 채널 Phase 2 - 티스토리 GA4 연동 가이드 및 UI 개선
```

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `docs/guides/tistory-ga4-integration.md` | 신규 |
| `docs/README.md` | 수정 |
| `src/constants/blog-guide.ts` | 신규 |
| `src/constants/index.ts` | 수정 |
| `src/components/dashboard/blog/internal/blog-view.tsx` | 수정 |
| `src/components/dashboard/csv-upload.tsx` | 수정 |
