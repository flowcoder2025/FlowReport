# ReportingOps SaaS 구현 계획

## 개요

PRD와 fdp-backend-architect 스킬을 기반으로 한 ReportingOps SaaS 플랫폼 구현 계획입니다.

### 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Authorization**: Zanzibar-based ReBAC
- **Deployment**: Vercel

---

## Phase 1: 프로젝트 셋업 및 인프라 (1-2주)

### 1.1 프로젝트 구조

```
C:\Team-jane\FlowReport\
├── app/
│   ├── (auth)/login/, signup/
│   ├── (dashboard)/workspace/, settings/, reports/
│   └── api/auth/, workspaces/, connectors/, metrics/, exports/
├── components/
│   ├── ui/          # shadcn/ui
│   ├── dashboard/   # 대시보드 컴포넌트
│   └── shared/
├── lib/
│   ├── auth/        # NextAuth
│   ├── db/          # Prisma client
│   ├── permissions/ # Zanzibar
│   ├── connectors/  # 데이터 소스 커넥터
│   └── crypto/      # 자격증명 암호화
├── prisma/
└── types/
```

### 1.2 핵심 의존성

```json
{
  "next": "^14.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "next-auth": "^4.24.0",
  "@auth/prisma-adapter": "^1.0.0",
  "zod": "^3.22.0",
  "recharts": "^2.8.0",
  "react-pdf": "^7.0.0"
}
```

### 1.3 환경 변수

```env
DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
ENCRYPTION_KEY (32-byte for AES-256-GCM)
```

---

## Phase 2: 데이터베이스 스키마 설계 (2주)

### 2.1 핵심 모델

**기본 테이블** (fdp-backend-architect 확장):
- `User`, `Account` (NextAuth)
- `RelationTuple`, `RelationDefinition` (Zanzibar)

**비즈니스 테이블**:
- `Workspace` - 멀티테넌트 워크스페이스
- `WorkspaceMembership` - RBAC (ADMIN/EDITOR/VIEWER)
- `ChannelConnection` - 데이터 소스 연동 (암호화된 자격증명)
- `MetricDefinition` - SSOT 지표 정의
- `MetricSnapshot` - 일/주/월 집계 스냅샷
- `SnapshotVersion` - LIVE/SNAPSHOT/LOCKED 버전
- `ContentItem` - 게시물/콘텐츠
- `InsightNote` - 원인/개선/베스트 프랙티스
- `ActionItem` - 차주/익월 계획
- `CsvUpload` - CSV 업로드 기록

### 2.2 주요 스키마 설계

```prisma
model Workspace {
  id        String @id @default(cuid())
  name      String
  slug      String @unique
  timezone  String @default("Asia/Seoul")
  weekStart Int    @default(1)  // 월요일
}

model ChannelConnection {
  provider              ChannelProvider
  encryptedCredentials  String @db.Text  // AES-256-GCM
  status                ConnectionStatus
}

model MetricSnapshot {
  periodType   PeriodType  // DAILY, WEEKLY, MONTHLY
  periodStart  DateTime
  data         Json        // 모든 지표
  source       DataSource  // CONNECTOR, CSV_UPLOAD, MANUAL
}

model SnapshotVersion {
  status      VersionStatus  // LIVE, SNAPSHOT, LOCKED
  frozenData  Json
}
```

---

## Phase 3: 인증 및 권한 (1주)

### 3.1 NextAuth.js 설정 ✅ 확정

**파일**: `lib/auth/auth-options.ts`
- **Google OAuth만** (MVP)
- Prisma Adapter
- Database session strategy

> GitHub OAuth는 Post-MVP에서 필요시 추가

### 3.2 Zanzibar 권한 시스템

**파일**: `lib/permissions/index.ts`
- `check(userId, namespace, objectId, relation)`: 권한 확인
- `grant(namespace, objectId, relation, subjectType, subjectId)`: 권한 부여
- `revoke(...)`: 권한 해제
- 권한 상속: owner → admin → editor → viewer

### 3.3 Workspace RBAC 미들웨어

**파일**: `lib/permissions/workspace-middleware.ts`
- `requireWorkspaceAdmin(workspaceId)`
- `requireWorkspaceEditor(workspaceId)`
- `requireWorkspaceViewer(workspaceId)`

---

## Phase 4: 핵심 데이터 레이어 (2주)

### 4.1 Workspace 관리 API

**파일**: `app/api/workspaces/route.ts`
- POST: 워크스페이스 생성 + 기본 SSOT 정의 생성
- GET: 사용자 워크스페이스 목록
- 멤버 초대/권한 관리

### 4.2 자격증명 암호화

**파일**: `lib/crypto/credentials.ts`
- AES-256-GCM 암호화
- 형식: `iv:authTag:ciphertext` (Base64)
- 감사 로그 (ConnectionAuditLog)

### 4.3 CSV 업로드 및 검증

**파일**: `lib/csv/upload-handler.ts`
- 채널별 템플릿 스키마 (Zod)
- 유효성 검사 + 오류 보고
- 템플릿 다운로드 제공

---

## Phase 5: 커넥터 구현 (2주)

### 5.1 커넥터 아키텍처

**베이스 인터페이스**: `lib/connectors/base.ts`
```typescript
abstract class BaseConnector {
  abstract testConnection(): Promise<{valid: boolean; error?: string}>
  abstract syncMetrics(startDate, endDate): Promise<SyncResult>
  abstract syncContent(startDate, endDate): Promise<SyncResult>
}
```

### 5.2 MVP 커넥터 (3개) ✅ 확정

| 커넥터 | 인증 방식 | 수집 데이터 |
|--------|----------|------------|
| **GA4** | 서비스 계정 JSON | 세션, 사용자, DAU, WAU |
| **Meta** | OAuth (Facebook Login) | 조회, 도달, 상호작용, 팔로워 |
| **YouTube** | OAuth (Google) | 조회, 시청시간, 구독자 |

> SmartStore/Coupang은 Post-MVP에서 추가 예정

### 5.3 동기화 스케줄러

**파일**: `lib/connectors/scheduler.ts`
- Vercel Cron: 매일 03:00 KST
- 수동 동기화 버튼 지원

---

## Phase 6: 대시보드 및 시각화 (2주)

### 6.1 대시보드 구조

**단일 페이지 + 탭 구성**:
```
상위 탭: [주간] [월간]

주간 서브탭:
- Overview: KPI 카드 + 추세 차트 + 인사이트 Top3
- SNS: 채널별 요약표 + Top 게시물
- Store: 채널별 매출/주문 + DAU/WAU (GA4)
- Notes: 원인/개선/차주 반영사항 입력

월간 서브탭:
- 1pg 요약: 핵심 KPI + 채널 믹스
- 키워드: Top N 키워드 성과
- SNS/Blog/Store: 상세 지표
- 계획: 익월 반영사항
- Export: PDF/PNG
```

### 6.2 핵심 컴포넌트

- `KPICard`: 값 + 전주/전월 대비 + N/A 사유 코드
- `TrendChart`: 라인 차트 (recharts)
- `ContentList`: 게시물 리스트 (기본 5개 + 전체보기)
- `VersionSelector`: Live/Snapshot/Locked 선택

---

## Phase 7: Export 및 공유 (1주)

### 7.1 PDF 생성

**파일**: `lib/export/pdf-generator.ts`
- @react-pdf/renderer 사용
- 월간 1pg 요약 템플릿

### 7.2 PNG 생성

**파일**: `lib/export/png-generator.ts`
- Client: html-to-image
- Server: Puppeteer (optional)

### 7.3 Export API

**파일**: `app/api/exports/pdf/route.ts`
- GET: PDF 다운로드
- 권한 체크 (requireWorkspaceViewer)

---

## Phase 8: 배포 및 테스트 (1주)

### 8.1 Vercel 설정

```json
{
  "buildCommand": "prisma generate && next build",
  "crons": [
    { "path": "/api/cron/sync", "schedule": "0 18 * * *" },
    { "path": "/api/cron/snapshots", "schedule": "0 0 * * 1" }
  ]
}
```

### 8.2 Prisma 설정

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

---

## 구현 일정 (MVP 10주)

| 주차 | 단계 | 산출물 |
|------|------|--------|
| 1-2 | Phase 1-2 | 프로젝트 셋업, Prisma 스키마, 마이그레이션 |
| 3 | Phase 3 | NextAuth, Zanzibar 권한 |
| 4-5 | Phase 4 | Workspace API, CSV 업로드, 암호화 |
| 6-7 | Phase 5 | GA4 + Meta 커넥터, 스케줄러 |
| 8-9 | Phase 6 | 대시보드 UI (주간/월간 탭) |
| 10 | Phase 7-8 | PDF Export, Vercel 배포 |

---

## 주요 파일 목록

1. `prisma/schema.prisma` - 전체 데이터베이스 스키마
2. `lib/permissions/index.ts` - Zanzibar 권한 시스템
3. `lib/connectors/base.ts` - 커넥터 추상 인터페이스
4. `lib/crypto/credentials.ts` - 자격증명 암호화
5. `app/(dashboard)/workspace/[workspaceId]/page.tsx` - 메인 대시보드

---

## 검증 방법

1. **단위 테스트**: 권한 시스템, 암호화, CSV 검증
2. **통합 테스트**: 커넥터 동기화, Workspace CRUD
3. **E2E 테스트** (Playwright): 온보딩, 대시보드, CSV 업로드, Export
4. **수동 검증**:
   - 워크스페이스 생성 → 멤버 초대 → 권한 확인
   - CSV 업로드 → 데이터 반영 확인
   - 대시보드 KPI → 전주/전월 대비 정확성
   - PDF Export 다운로드 확인
