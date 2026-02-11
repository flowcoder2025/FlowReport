# Phase 3-4: 구조 개선 및 안정화

> Epic: [워크플레이스 메뉴 UX 개선](./README.md)
> 상태: 🔄 진행중 (Phase 3 완료, Phase 4 일부) | 업데이트: 2026-02-11

## 목표

- 메뉴 구조 단순화 (7개 → 6개)
- 데이터 분석 기능 강화 (상관관계 차트)
- Mock 데이터 → 실제 API 연결

## Task 목록

### Phase 3 (개선)
- [x] Task 3.1: Performance-Content 메뉴 통합
- [x] Task 3.2: Analytics 상관관계 차트 구현

### Phase 4 (안정화)
- [x] Task 4.1: CompetitorComparison API 연결
- [ ] Task 4.2: 권장 조치 템플릿 DB화
- [ ] Task 4.3: API 스키마 문서화

## 구현 상세

### Task 3.1: Performance-Content 통합

**파일:** `src/components/dashboard/views/internal/performance-view.tsx`

**변경사항:**
- shadcn/ui Tabs 컴포넌트로 2개 탭 구조
  - "성과 개요" 탭: 기존 Performance 내용
  - "콘텐츠 분석" 탭: ContentView 핵심 요소
- URL 파라미터로 탭 상태 관리 (`?tab=content`)
- `defaultTab` prop 추가

**메뉴 변경:**
```
Before: Overview | Performance | Content | Commerce | 경영진 | 마케팅 | 분석
After:  Overview | Performance | Commerce | 경영진 | 마케팅 | 분석
```

### Task 3.2: CorrelationChart 컴포넌트

**파일:** `src/components/dashboard/analytics/internal/correlation-chart.tsx`

```typescript
interface CorrelationChartProps {
  data: RawMetricData[]
  selectedMetrics: SelectedMetric[]
  height?: number
}
```

**주요 기능:**
- X/Y축 메트릭 선택 드롭다운
- recharts ScatterChart 산점도
- Pearson 상관계수 계산 및 표시
- 최소제곱법 기반 추세선
- 상관관계 강도 해석 (8단계)

**핵심 함수:**
```typescript
function calculateCorrelation(xValues: number[], yValues: number[]): number
function calculateLinearRegression(xValues: number[], yValues: number[]): { slope: number; intercept: number }
function interpretCorrelation(r: number): { strength: string; description: string; color: string }
```

### Task 4.1: Competitor API 연결

**Prisma 스키마:**
```prisma
model Competitor {
  id             String          @id @default(cuid())
  workspaceId    String
  name           String
  platform       ChannelProvider
  channelId      String
  followers      Int?
  engagementRate Float?
  uploads        Int?

  workspace Workspace @relation(...)
  @@unique([workspaceId, platform, channelId])
}
```

**API 엔드포인트:**
- `GET /api/workspaces/[id]/competitors` - 목록
- `POST /api/workspaces/[id]/competitors` - 생성
- `GET/PUT/DELETE /api/workspaces/[id]/competitors/[id]` - CRUD

**훅:**
```typescript
export function useCompetitors(workspaceId: string)
export async function createCompetitor(workspaceId, data)
export async function deleteCompetitor(workspaceId, competitorId)
```

## 변경된 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `views/internal/performance-view.tsx` | 수정 | 탭 구조 추가 |
| `dashboard-view-renderer.tsx` | 수정 | Content 리다이렉트 |
| `layout/internal/top-nav.tsx` | 수정 | Content 메뉴 제거 |
| `views/index.ts` | 수정 | ContentView deprecated |
| `analytics/internal/correlation-chart.tsx` | 추가 | 상관관계 차트 |
| `analytics/internal/analytics-view.tsx` | 수정 | 차트 통합 |
| `prisma/schema.prisma` | 수정 | Competitor 모델 |
| `api/.../competitors/route.ts` | 추가 | CRUD API |
| `marketing/internal/competitor-comparison.tsx` | 수정 | API 연결 |
| `hooks/use-dashboard-data.ts` | 수정 | useCompetitors 훅 |

## 다음 Phase로 넘기는 것

- Task 4.2: 권장 조치 템플릿 DB화 (하드코딩 → DB)
- Task 4.3: API 스키마 문서화 (OpenAPI/Swagger)
