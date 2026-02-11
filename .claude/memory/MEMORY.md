# FlowReport Project Memory

> 마지막 업데이트: 2026-02-11

## 프로젝트 개요

FlowReport는 **ReportingOps SaaS** 플랫폼입니다.
여러 마케팅/판매 채널의 데이터를 통합하여 주간/월간 리포트를 자동화하는 대시보드 서비스.

### 기술 스택
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **DB**: PostgreSQL
- **인증**: NextAuth.js

### 연동 채널
- SNS: YouTube, Instagram, Facebook, 네이버 블로그
- 스토어: 스마트스토어, 쿠팡
- 분석: GA4, Google Search Console

## Active Epic

### menu-ux-improvement (83% 완료)
- **상태**: 🔄 진행중
- **Phase**: 3.5/4 완료
- **목표**: 데이터 대시보드 → 의사결정 대시보드 전환

**완료된 작업:**
- Phase 1-2: 헤드라인 요약, 권장 조치, 경쟁사 비교, 피드백 루프
- Phase 3: Performance-Content 통합 (메뉴 7→6개), 상관관계 차트
- Phase 4 일부: Competitor API 연결, Content 메뉴 제거

**남은 작업:**
- 권장 조치 템플릿 DB화
- API 스키마 문서화

### dashboard-persona-refactoring (완료)
- **상태**: ✅ 배포 준비 완료
- **Phase**: 3/5 완료
- **목표**: 페르소나별 특화 대시보드로 전환

**생성된 모듈:**
```
src/components/dashboard/
├── executive/    # 경영진용 (30초 전략 파악)
├── marketing/    # 마케팅팀용 (채널+콘텐츠)
├── commerce/     # 커머스팀용 (매출 중심)
└── analytics/    # 데이터팀용 (원본 데이터)
```

## P0/P1 이슈 - ✅ 모두 해결 (2026-02-10)

| 대시보드 | 이슈 | 해결방안 | 상태 |
|----------|------|----------|------|
| Executive | 목표값 하드코딩 | `constants/targets.ts` 분리 | ✅ |
| Marketing | 트렌드 빈 배열 | `useDashboardTrendData` 훅 | ✅ |
| Commerce | 반품/취소 0 | `null` + "-" 표시 | ✅ |
| Analytics | API 크기 제한 | `maxRows` 파라미터 | ✅ |
| Analytics P1 | Export maxRows | 10000개 전달 | ✅ |
| Analytics P1 | 잘림 경고 | amber 배너 UI | ✅ |

## 아키텍처 결정

### 폴더 구조 규칙
```
module/
├── index.ts      # Public API (외부 노출)
└── internal/     # Private (외부 import 금지)
    └── *.tsx
```

### 대시보드 분리 전략
- **Option A 선택**: 페르소나별 완전 분리
- **근거**: 점진적 개선보다 명확한 구분이 장기적으로 유리

## 완료된 Epic

| Epic | 완료일 | 요약 |
|------|--------|------|
| dashboard-refactoring | 2026-02-05 | 사이드패널 + 채널 메트릭 |
| dashboard-restructure | 2026-02-10 | 목적 기반 4개 뷰 (→페르소나로 전환) |

## Lessons Learned

### 2026-02-11
1. **Business Panel 분석 효과적**: Drucker, Christensen 등 전문가 페르소나로 UX 문제점 발견
2. **병렬 에이전트 오케스트레이션**: 개발총괄 + 부서별 에이전트 구조로 효율적 개발
3. **CTO 에이전트 코드 리뷰**: 조건부 승인으로 품질 관리 체계화
4. **메뉴 통합 시 하위 호환성**: Content 리다이렉트로 기존 URL 유지

### 2026-02-10
1. **페르소나 분석 먼저**: 대시보드 설계 전 각 사용자 그룹의 요구사항 분석 필수
2. **하드코딩 주의**: placeholder 데이터도 명시적으로 표시 (0 대신 "데이터 없음")
3. **병렬 개발 효과적**: 에이전트 4명 병렬 투입으로 4개 모듈 동시 개발 성공
4. **대규모 리팩토링 시 마이그레이션 완전성 검증 필수**
5. **4개 부서장 페르소나 분석이 문제 발견에 효과적**

## 다음 세션 TODO

1. ~~메뉴 UX 개선 Phase 1-3~~ ✅ 완료 (2026-02-11)
2. Phase 4 완료: 권장 조치 템플릿 DB화, API 문서화
3. Prisma 마이그레이션: `npx prisma migrate dev --name add-competitor-model`
4. Phase 3-4 커밋 및 푸시
5. 프로덕션 배포
