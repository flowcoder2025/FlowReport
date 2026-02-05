# FlowReport Project Memory

> 마지막 업데이트: 2026-02-05

## 프로젝트 정보

- **프로젝트명**: FlowReport (ReportingOps SaaS)
- **경로**: `C:\Team-jane\FlowReport`
- **목적**: 주간/월간 리포트 자동화 플랫폼

## 기술 스택

- Next.js 14 (App Router)
- Supabase PostgreSQL + Prisma ORM
- NextAuth.js (Google OAuth)
- Zanzibar-based ReBAC
- Vercel 배포

## 아키텍처 결정

### 1. fdp-backend-architect 적용
- 6-component architecture (DB + ORM + Auth + Permissions + Adapter + Deployment)
- Zanzibar 기반 권한 시스템 사용
- Prisma binaryTargets에 `rhel-openssl-3.0.x` 포함 (Vercel 호환)

### 2. 멀티테넌시
- Workspace 기반 데이터 격리
- WorkspaceMembership으로 RBAC (Admin/Editor/Viewer)

### 3. 자격증명 보안
- AES-256-GCM 암호화 (`lib/crypto/credentials.ts`)
- 환경변수로 32-byte 키 관리

## 완료된 Epics

| Epic | 완료일 | 비고 |
|------|--------|------|
| ReportingOps MVP | 2026-02-05 | Phase 1-8 완료 |

## 중요 경로

```
src/
├── lib/
│   ├── auth/           # NextAuth 설정
│   ├── permissions/    # Zanzibar 권한
│   ├── connectors/     # 데이터 소스 커넥터
│   ├── crypto/         # 암호화
│   └── csv/            # CSV 처리
├── app/
│   ├── (auth)/         # 로그인
│   ├── (dashboard)/    # 대시보드
│   └── api/            # API 라우트
└── components/
    └── dashboard/      # 대시보드 UI
```

## Lessons Learned

- Next.js 14 빌드 시 `headers()` 사용하면 dynamic route 필요
- Prisma generate는 빌드 전에 실행 필요
- html-to-image는 클라이언트 전용 (SSR 주의)
