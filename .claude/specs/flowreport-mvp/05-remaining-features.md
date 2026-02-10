# Phase 5: 남은 기능 구현

> Epic: [FlowReport MVP](./README.md)
> 상태: 완료 | 업데이트: 2026-02-05

## 목표
PNG 내보내기, 워크스페이스 생성, CSV 업로드 UI, 채널 연결 관리 기능 구현

## Task 목록
- [x] Task 5.1: PNG 내보내기 UI 연결
- [x] Task 5.2: 워크스페이스 생성 페이지
- [x] Task 5.3: CSV 업로드 UI 컴포넌트
- [x] Task 5.4: 채널 연결 관리 API
- [x] Task 5.5: 채널 연결 관리 UI

## 구현 상세

### Task 5.1: PNG 내보내기
**파일:** `src/components/dashboard/monthly/index.tsx`
**변경사항:**
- `generateAndDownloadPNG` 함수 import 및 연결
- `format` 함수로 파일명 생성

### Task 5.2: 워크스페이스 생성 페이지
**파일:** `src/app/(dashboard)/workspaces/new/page.tsx`
**변경사항:**
- 폼 필드: name, slug, description, timezone, weekStart
- 자동 slug 생성 기능
- POST /api/workspaces 호출

### Task 5.3: CSV 업로드 UI
**파일:** `src/components/dashboard/csv-upload.tsx`
**변경사항:**
- 채널 선택 드롭다운
- 드래그 앤 드롭 파일 업로드
- 템플릿 다운로드 버튼
- 업로드 진행/성공/실패 상태 표시

### Task 5.4: 채널 연결 API
**파일:** `src/app/api/workspaces/[workspaceId]/connections/`
**변경사항:**
- GET: 연결 목록 조회
- POST: 새 연결 생성 (자격증명 암호화)
- PUT: 연결 수정
- DELETE: 연결 삭제
- POST /test: 연결 테스트

### Task 5.5: 채널 연결 UI
**파일:** `src/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`
**변경사항:**
- 설정 페이지 (일반/채널연결/CSV 탭)
- `ChannelConnectionCard` 컴포넌트
- `AddChannelModal` 컴포넌트

## 변경된 파일
| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/components/dashboard/monthly/index.tsx` | 수정 | PNG 내보내기 연결 |
| `src/app/(dashboard)/workspaces/new/page.tsx` | 추가 | 워크스페이스 생성 |
| `src/components/dashboard/csv-upload.tsx` | 추가 | CSV 업로드 UI |
| `src/app/api/.../connections/route.ts` | 추가 | 연결 API |
| `src/app/(dashboard)/.../settings/page.tsx` | 추가 | 설정 페이지 |
| `src/components/dashboard/channel-connection-card.tsx` | 추가 | 연결 카드 |
| `src/components/dashboard/add-channel-modal.tsx` | 추가 | 연결 추가 모달 |
| `src/components/ui/input.tsx` | 추가 | Input 컴포넌트 |
| `src/components/ui/label.tsx` | 추가 | Label 컴포넌트 |
| `src/components/ui/select.tsx` | 추가 | Select 컴포넌트 |
| `src/components/ui/dialog.tsx` | 추가 | Dialog 컴포넌트 |
| `src/components/ui/switch.tsx` | 추가 | Switch 컴포넌트 |
| `src/lib/hooks/use-toast.ts` | 추가 | Toast 훅 |
| `prisma/schema.prisma` | 수정 | Session-User 관계 추가 |

## 커밋
- `78b05e6` - feat: FlowReport 남은 기능 구현
