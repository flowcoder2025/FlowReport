# FlowReport Project Memory

> 마지막 업데이트: 2026-02-12

## 프로젝트 정보
- **이름**: FlowReport
- **유형**: ReportingOps SaaS
- **스택**: Next.js 14, Prisma, PostgreSQL (Supabase)
- **배포**: Vercel (Hobby 플랜)
- **운영 URL**: https://flowreport.vercel.app

## 완료된 Epics
- **Epic A: 리포트 자동화** (2026-02-12 완료)

## 아키텍처 결정
- **모듈 구조**: index.ts (Public API) + internal/ (Private)
- **이메일**: Resend 사용
- **Cron**: Vercel Cron (Hobby: 하루 1회 제한)
- **Meta OAuth**: 장기 토큰 교환 + Page Access Token 우선 사용
- **Meta 앱 통합**: FlowReport_ins 앱 하나로 Facebook+Instagram 모두 처리 (페이지 권한 필요)

## 주의사항
- **React Hooks**: early return 전에 모든 hooks 호출 필수
- **Tooltip formatter**: `(value, name) => [formattedValue, name]` 형식 사용
- **Vercel Hobby 플랜**: cron은 하루 1회만 가능 (매시간 불가)
- **커밋 전 확인**: 새 파일이 다른 파일에서 import되면 반드시 함께 커밋
- **GA4 자격증명**: serviceAccountJson (문자열), serviceAccount (객체) 혼동 주의

## 환경변수
- ENCRYPTION_KEY, DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET ✅
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ✅
- META_APP_ID, META_APP_SECRET ✅ (FlowReport_ins 앱 - 907963014925273)
- CRON_SECRET ✅ (로컬), Vercel에도 설정 필요
- RESEND_API_KEY, EMAIL_FROM ❌ (Resend 대시보드 발급 필요)

## 채널 연동 상태 (2026-02-12)
| 채널 | 상태 | 비고 |
|------|------|------|
| GA4 | ✅ 코드 수정 완료 | 서비스 계정 JSON 필요 |
| YouTube | ✅ 동작 | FlowCoder 채널 연결됨 |
| Instagram | ✅ 동작 | FlowReport_ins 앱 사용 |
| Facebook | ✅ 동작 | FlowReport_ins 앱 사용 (FlowCoder 페이지) |
| 스마트스토어 | ✅ CSV 전용 | |
| 쿠팡 | ✅ CSV 전용 | |
| 네이버 블로그 | ✅ CSV 전용 | |

## QA 수정 (2026-02-12)
- 28건 이슈 수정 완료 (High 4, Medium 14, Low 10)
- SessionProvider root layout 추가
- 감사 로그 보존 (connectionId nullable)

## 최근 작업
- 2026-02-12: Meta 채널 연동 완료 (Facebook + Instagram 동기화 성공)
- 2026-02-12: Facebook 카드 컴포넌트 추가, 인사이트 에러 처리 개선
