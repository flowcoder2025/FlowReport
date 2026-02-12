# Epic A: 리포트 자동화 구현

> 상태: 완료 | 완료일: 2026-02-12

## 개요
FlowReport에 주간/월간 리포트 자동 생성 및 이메일/슬랙 배포 기능 구현

## Phase 목록
| Phase | 이름 | 상태 | 주요 산출물 |
|-------|------|------|-------------|
| 1 | [DB 스키마 및 상수](./01-db-schema.md) | 완료 | Prisma 모델, 상수 정의 |
| 2 | [이메일 서비스](./02-email-service.md) | 완료 | Resend 기반 이메일 모듈 |
| 3 | [리포트 서비스](./03-report-service.md) | 완료 | 생성/스케줄/배포 서비스 |
| 4 | [API 및 Cron](./04-api-cron.md) | 완료 | REST API, Vercel Cron |
| 5 | [Settings UI](./05-settings-ui.md) | 완료 | 리포트 설정 컴포넌트 |

## 주요 결정사항
- [2026-02-12 Hooks Fix](./decisions/2026-02-12-hooks-fix.md): React Hooks 규칙 준수 수정

## 필요 환경변수
- RESEND_API_KEY
- EMAIL_FROM
- CRON_SECRET
