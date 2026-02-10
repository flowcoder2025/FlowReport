# FlowReport 대시보드 데이터 연동 구현 계획

## 개요

대시보드 컴포넌트들이 Mock 데이터를 사용 중이므로, API 엔드포인트를 추가하고 실제 데이터 연동을 구현합니다.

**원칙**: API 먼저 → 컴포넌트 연동

---

## Phase 1: API 엔드포인트 추가

### Task 1.1: 메트릭 조회 API

**파일**: `src/app/api/workspaces/[workspaceId]/metrics/route.ts` (신규)

```
GET /api/workspaces/[workspaceId]/metrics?periodType=WEEKLY&periodStart=2024-01-15
```

**구현**:
- `requireWorkspaceViewer(workspaceId)` 권한 확인
- periodStart 기준 기간 범위 계산
- MetricSnapshot 조회 (connectionId별 집계)
- 이전 기간 데이터 조회 (증감율 계산)
- ContentItem 조회 (Top 게시물)

**응답**:
```typescript
{
  overview: { totalRevenue, dau, wau, signups, reach, engagement, followers, uploads }
  previous: { ... }  // 전주/전월
  sns: { channels: [...], topPosts: [...] }
  store: { traffic: {...}, channels: [...] }
}
```

### Task 1.2: Notes/Actions 조회 API

**파일**: `src/app/api/workspaces/[workspaceId]/notes/route.ts` (신규)

```
GET /api/workspaces/[workspaceId]/notes?periodType=WEEKLY&periodStart=2024-01-15
```

**응답**:
```typescript
{
  notes: { causes: [], improvements: [], bestPractices: [] }
  actions: [{ id, title, status, priority }]
}
```

### Task 1.3: Notes/Actions 저장 API

**파일**: 동일 (`notes/route.ts`)

```
POST /api/workspaces/[workspaceId]/notes
```

**요청**:
```typescript
{
  periodType: 'WEEKLY' | 'MONTHLY'
  periodStart: string
  notes: { causes: string[], improvements: string[], bestPractices: string[] }
  actions: [{ id?, title, status? }]
}
```

**구현**:
- `requireWorkspaceEditor(workspaceId)` 권한 확인
- InsightNote: 해당 기간 삭제 후 재생성
- ActionItem: id 유무로 upsert

---

## Phase 2: 서비스 레이어 추가

### Task 2.1: 메트릭 조회 서비스

**파일**: `src/lib/services/metric-query.ts` (신규)

```typescript
// 주간/월간 메트릭 조회
export async function getMetricsForPeriod(
  workspaceId: string,
  periodType: PeriodType,
  periodStart: Date
): Promise<DashboardMetrics>

// Top 게시물 조회
export async function getTopContent(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  limit?: number
): Promise<ContentItem[]>
```

---

## Phase 3: 컴포넌트 데이터 연동

### Task 3.1: 데이터 페칭 훅

**파일**: `src/lib/hooks/use-dashboard-data.ts` (신규)

```typescript
export function useDashboardMetrics(workspaceId, periodType, periodStart)
export function useDashboardNotes(workspaceId, periodType, periodStart)
```

**의존성**: SWR 설치 필요 (`npm install swr`)

### Task 3.2: Weekly 대시보드 연동

**수정 파일**:
- `src/components/dashboard/weekly/index.tsx` - DatePicker 추가
- `src/components/dashboard/weekly/overview-tab.tsx` - Mock → API
- `src/components/dashboard/weekly/sns-tab.tsx` - Mock → API
- `src/components/dashboard/weekly/store-tab.tsx` - Mock → API
- `src/components/dashboard/weekly/notes-tab.tsx` - 저장 기능 연결

**패턴**:
```tsx
// Before
const mockKPIs = [...]

// After
const { data, error, isLoading } = useDashboardMetrics(workspaceId, 'WEEKLY', periodStart)
if (isLoading) return <Skeleton />
if (error) return <ErrorState />
```

### Task 3.3: Monthly 대시보드 연동

**수정 파일**:
- `src/components/dashboard/monthly/index.tsx` - DatePicker 추가
- `src/components/dashboard/monthly/summary-tab.tsx` - Mock → API

---

## 파일 목록

### 신규 파일
| 파일 | 설명 |
|------|------|
| `src/app/api/workspaces/[workspaceId]/metrics/route.ts` | 메트릭 조회 API |
| `src/app/api/workspaces/[workspaceId]/notes/route.ts` | Notes CRUD API |
| `src/lib/services/metric-query.ts` | 메트릭 조회 서비스 |
| `src/lib/hooks/use-dashboard-data.ts` | 데이터 페칭 훅 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/components/dashboard/weekly/index.tsx` | DatePicker, periodStart 상태 |
| `src/components/dashboard/weekly/overview-tab.tsx` | Mock → API 연동 |
| `src/components/dashboard/weekly/sns-tab.tsx` | Mock → API 연동 |
| `src/components/dashboard/weekly/store-tab.tsx` | Mock → API 연동 |
| `src/components/dashboard/weekly/notes-tab.tsx` | 저장 기능 연결 |
| `src/components/dashboard/monthly/index.tsx` | DatePicker, periodStart 상태 |
| `src/components/dashboard/monthly/summary-tab.tsx` | Mock → API 연동 |

---

## 재사용할 기존 코드

| 파일 | 함수 | 용도 |
|------|------|------|
| `src/lib/permissions/workspace-middleware.ts` | `requireWorkspaceViewer/Editor` | 권한 검증 |
| `src/lib/services/metric-snapshot.ts` | 패턴 참조 | Prisma 쿼리 패턴 |
| `src/app/api/workspaces/[workspaceId]/route.ts` | 패턴 참조 | API 라우트 구조 |
| `src/components/dashboard/kpi-card.tsx` | KPICard | KPI 표시 컴포넌트 |

---

## 의존성 순서

```
Task 1 (API) ────────────────────────────────┐
   │                                         │
   ├── Task 1.1: metrics API                 │
   ├── Task 1.2: notes GET API               │
   └── Task 1.3: notes POST API              │
                                             │
Task 2 (Service) ◄───────────────────────────┤
   │                                         │
   └── Task 2.1: metric-query.ts             │
                                             │
Task 3 (Component) ◄─────────────────────────┘
   │
   ├── Task 3.1: use-dashboard-data.ts (SWR 설치)
   ├── Task 3.2: Weekly 컴포넌트 연동
   └── Task 3.3: Monthly 컴포넌트 연동
```

---

## 검증 방법

### API 테스트
```bash
# 메트릭 조회
curl "http://localhost:3000/api/workspaces/{id}/metrics?periodType=WEEKLY&periodStart=2024-01-15"

# Notes 저장
curl -X POST "http://localhost:3000/api/workspaces/{id}/notes" \
  -H "Content-Type: application/json" \
  -d '{"periodType":"WEEKLY","periodStart":"2024-01-15","notes":{"causes":["원인1"]},"actions":[]}'
```

### E2E 시나리오
1. CSV 업로드 → 대시보드 새로고침 → 데이터 표시 확인
2. Notes 입력 → 저장 버튼 클릭 → 새로고침 → 데이터 유지
3. 다른 주 선택 → 해당 주 데이터 표시
