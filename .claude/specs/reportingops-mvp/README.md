# Epic: ReportingOps MVP

> 상태: ✅ 완료 | 완료일: 2026-02-05

## 개요

PRD와 fdp-backend-architect 스킬을 기반으로 한 ReportingOps SaaS MVP 구현.
고객사가 주간/월간 리포트 데이터를 연동/업로드하고, 자동 집계/대시보드/PDF 출력을 제공하는 웹 서비스.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Google OAuth)
- **Authorization**: Zanzibar-based ReBAC
- **Deployment**: Vercel

## Phase 목록

| Phase | 이름 | 상태 | 문서 |
|-------|------|------|------|
| 1 | 프로젝트 셋업 | ✅ | [01-project-setup.md](./01-project-setup.md) |
| 2 | DB 스키마 | ✅ | [02-database-schema.md](./02-database-schema.md) |
| 3 | 인증/권한 | ✅ | [03-auth-permissions.md](./03-auth-permissions.md) |
| 4 | 핵심 데이터 레이어 | ✅ | [04-core-data-layer.md](./04-core-data-layer.md) |
| 5 | 커넥터 | ✅ | [05-connectors.md](./05-connectors.md) |
| 6 | 대시보드 UI | ✅ | [06-dashboard-ui.md](./06-dashboard-ui.md) |
| 7-8 | Export/배포 | ✅ | [07-export-deployment.md](./07-export-deployment.md) |

## 핵심 결정

- [MVP 범위 결정](./decisions/2026-02-05-mvp-scope.md)

## 주요 파일

- `prisma/schema.prisma` - 전체 DB 스키마 (15+ 모델)
- `src/lib/permissions/index.ts` - Zanzibar 권한 시스템
- `src/lib/connectors/` - GA4, Meta, YouTube 커넥터
- `src/components/dashboard/` - 대시보드 UI 컴포넌트
