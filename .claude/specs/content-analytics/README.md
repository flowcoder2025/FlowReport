# Epic: Content Analytics (콘텐츠 분석 강화)

> 시작일: 2026-02-12
> 완료일: 2026-02-12
> 상태: 완료

## 목표

콘텐츠 형식별, 채널별 성과 분석으로 마케팅 콘텐츠 기획 지원

## Phase 구성

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 콘텐츠 타입별 성과 분석 | 완료 |
| Phase 2 | 채널별 최적 발행 시간 | 완료 |

## ContentType (Prisma)

```prisma
enum ContentType {
  POST     // 일반 게시물 (Instagram, Facebook)
  REEL     // 릴스 (Instagram)
  STORY    // 스토리 (Instagram)
  SHORT    // 쇼츠 (YouTube)
  VIDEO    // 동영상 (YouTube)
  ARTICLE  // 기사/블로그 글
  PRODUCT  // 상품
}
```

## 관련 파일

### 핵심 컴포넌트
- `src/components/dashboard/marketing/internal/marketing-view.tsx`
- `src/components/dashboard/marketing/internal/content-highlights.tsx`

### 데이터 레이어
- `prisma/schema.prisma` - ContentItem 모델
- `src/app/api/workspaces/[workspaceId]/metrics/route.ts` - 메트릭 API

## 변경 이력

- 2026-02-12: Epic 생성
