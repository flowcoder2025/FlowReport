# FlowReport Project Memory

> 마지막 업데이트: 2026-02-10

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

### dashboard-persona-refactoring (진행중)
- **상태**: ⚠️ 조건부 승인 (P0 해결 필요)
- **Phase**: 2/5 완료
- **목표**: 페르소나별 특화 대시보드로 전환

**생성된 모듈:**
```
src/components/dashboard/
├── executive/    # 경영진용 (30초 전략 파악)
├── marketing/    # 마케팅팀용 (채널+콘텐츠)
├── commerce/     # 커머스팀용 (매출 중심)
└── analytics/    # 데이터팀용 (원본 데이터)
```

## P0 이슈 (배포 전 필수)

| 대시보드 | 이슈 | 해결방안 |
|----------|------|----------|
| Executive | 목표값 하드코딩 | config/DB에서 읽기 |
| Marketing | 트렌드 데이터 빈 배열 | API 연결 |
| Commerce | 반품/취소 0 하드코딩 | 실제 데이터 연결 |
| Analytics | API 크기 제한 없음 | maxRows 설정 |

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

### 2026-02-10
1. **페르소나 분석 먼저**: 대시보드 설계 전 각 사용자 그룹의 요구사항 분석 필수
2. **하드코딩 주의**: placeholder 데이터도 명시적으로 표시 (0 대신 "데이터 없음")
3. **병렬 개발 효과적**: 에이전트 4명 병렬 투입으로 4개 모듈 동시 개발 성공
4. **대규모 리팩토링 시 마이그레이션 완전성 검증 필수**
5. **4개 부서장 페르소나 분석이 문제 발견에 효과적**

## 다음 세션 TODO

1. P0 이슈 해결 (Executive → Marketing → Commerce → Analytics)
2. 레거시 views 폴더와 라우팅 통합
3. 프로덕션 배포 (Week 1-3)
