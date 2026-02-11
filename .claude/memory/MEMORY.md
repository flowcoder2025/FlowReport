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

### blog-channel (50% 완료)
- **상태**: 🔄 Phase 1 완료
- **Phase**: 1/2 완료
- **목표**: 블로그 채널 데이터 수집 및 분석 강화

**Phase 1: 네이버 블로그 CSV 고도화 ✅ (완료)**
- blogMetricSchema 16개 필드로 확장
- CSV 템플릿 다운로드 API
- 블로그 대시보드 뷰 구현

**Phase 2: 티스토리 API 연동 (다음 스프린트)**
- 티스토리 Open API 연동
- OAuth 인증 구현

### menu-ux-improvement (100% 완료)
- **상태**: ✅ 완료
- **Phase**: 4/4 완료
- **목표**: 데이터 대시보드 → 의사결정 대시보드 전환

**완료된 작업:**
- Phase 1-2: 헤드라인 요약, 권장 조치, 경쟁사 비교, 피드백 루프
- Phase 3: Performance-Content 통합 (메뉴 7→6개), 상관관계 차트
- Phase 4: 권장 조치 템플릿 DB화, OpenAPI 문서화

## 최근 완료된 스프린트

### 목표값 관리 UI (2026-02-11)
- Workspace에 targetConfig JSON 필드 추가
- 목표값 설정 API (GET/PATCH /settings/targets)
- Settings 페이지에 "목표" 탭 추가
- Executive Dashboard에서 API 목표값 연동

**TODO (다음 스프린트):**
- TargetConfig 타입 통합 (4곳 → 1곳)
- 에러 처리 클래스화

## 아키텍처 결정

### 폴더 구조 규칙
```
module/
├── index.ts      # Public API (외부 노출)
└── internal/     # Private (외부 import 금지)
    └── *.tsx
```

### 에이전트 모델 정책
| 업무 유형 | 모델 |
|----------|------|
| 탐색/검색 | haiku |
| 코드 작성 | **opus** |
| 판단/의사결정 | **opus** |

### 스프린트 워크플로우
```
부서 의견 수렴 (opus)
    ↓
개발총괄 종합
    ↓
CTO 기술 리뷰 (opus)
    ↓
공동창업자 승인 (opus)
    ↓
개발 (opus)
    ↓
CTO 코드 리뷰 (opus)
    ↓
배포
```

## 완료된 Epic

| Epic | 완료일 | 요약 |
|------|--------|------|
| menu-ux-improvement | 2026-02-11 | 의사결정 대시보드 전환, 메뉴 7→6개 |
| dashboard-persona-refactoring | 2026-02-10 | 페르소나별 특화 대시보드 |
| dashboard-refactoring | 2026-02-05 | 사이드패널 + 채널 메트릭 |

## Lessons Learned

### 2026-02-11
1. **에이전트 모델 정책 중요**: 판단/의사결정에 haiku 사용 시 품질 저하
2. **부서별 의견 수렴 효과적**: 4개 부서 관점으로 요구사항 명확화
3. **CTO 코드 리뷰 필수**: 보안/타입 이슈 사전 발견

### 2026-02-10
1. **페르소나 분석 먼저**: 대시보드 설계 전 사용자 그룹 요구사항 분석 필수
2. **병렬 개발 효과적**: 에이전트 4명 병렬 투입으로 동시 개발 성공

## 다음 세션 TODO

1. **Blog 채널 Phase 2: 티스토리 API 연동**
   - 티스토리 Open API 연동
   - OAuth 인증 구현
   - 자동 동기화 커넥터
2. **기술 부채 해결**
   - CSV 템플릿 상수 통합
   - 채널명 하드코딩 제거
