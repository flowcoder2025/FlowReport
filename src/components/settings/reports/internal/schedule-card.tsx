'use client'

/**
 * Schedule Card Component
 *
 * 리포트 스케줄 카드
 */
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/use-toast'
import { WEEKDAY_LABELS, type WeekdayKey } from '@/constants'
import {
  Calendar,
  Clock,
  Mail,
  Send,
  Settings,
  Trash2,
  Users,
  Loader2,
} from 'lucide-react'
import type { ReportSchedule } from './use-report-schedules'
import { RecipientList } from './recipient-list'
import { ScheduleForm } from './schedule-form'

interface ScheduleCardProps {
  workspaceId: string
  schedule: ReportSchedule
  onUpdate: () => void
  onDelete: () => void
}

export function ScheduleCard({ workspaceId, schedule, onUpdate, onDelete }: ScheduleCardProps) {
  const { toast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false)
  const [isTestOpen, setIsTestOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)

  const periodTypeLabel = schedule.periodType === 'WEEKLY' ? '주간' : '월간'
  const scheduleDayLabel =
    schedule.periodType === 'WEEKLY'
      ? WEEKDAY_LABELS[schedule.scheduleDay as WeekdayKey]
      : `매월 ${schedule.scheduleDay}일`

  const handleToggleActive = async (isActive: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/reports/schedules/${schedule.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        }
      )

      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.')
      }

      toast({
        title: isActive ? '활성화됨' : '비활성화됨',
        description: `스케줄이 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
      })

      onUpdate()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '상태 변경에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEdit = async (data: {
    name: string
    periodType: 'WEEKLY' | 'MONTHLY'
    scheduleDay: number
    scheduleHour: number
    emailEnabled: boolean
    slackEnabled: boolean
    slackWebhook: string
  }) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/reports/schedules/${schedule.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '수정에 실패했습니다.')
      }

      toast({
        title: '저장 완료',
        description: '스케줄이 수정되었습니다.',
      })

      setIsEditOpen(false)
      onUpdate()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '수정에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 스케줄을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/reports/schedules/${schedule.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.')
      }

      toast({
        title: '삭제 완료',
        description: '스케줄이 삭제되었습니다.',
      })

      onDelete()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '삭제에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!testEmail) return

    setIsSendingTest(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/reports/schedules/${schedule.id}/test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '테스트 발송에 실패했습니다.')
      }

      toast({
        title: '발송 완료',
        description: `테스트 리포트가 ${testEmail}로 발송되었습니다.`,
      })

      setIsTestOpen(false)
      setTestEmail('')
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '테스트 발송에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const formatNextRun = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{schedule.name}</CardTitle>
                <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                  {schedule.isActive ? '활성' : '비활성'}
                </Badge>
              </div>
              <CardDescription>{periodTypeLabel} 리포트</CardDescription>
            </div>
            <Switch
              checked={schedule.isActive}
              onCheckedChange={handleToggleActive}
              disabled={isUpdating}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{scheduleDayLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{String(schedule.scheduleHour).padStart(2, '0')}:00</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>수신자 {schedule.recipients?.length || 0}명</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{schedule.emailEnabled ? '이메일 발송' : '발송 안함'}</span>
            </div>
          </div>

          {schedule.nextRunAt && schedule.isActive && (
            <div className="pt-2 border-t text-sm">
              <span className="text-muted-foreground">다음 발송: </span>
              <span className="font-medium">{formatNextRun(schedule.nextRunAt)}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRecipientsOpen(true)}>
              <Users className="h-4 w-4 mr-1" />
              수신자 관리
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsTestOpen(true)}>
              <Send className="h-4 w-4 mr-1" />
              테스트 발송
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Settings className="h-4 w-4 mr-1" />
              설정
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>스케줄 수정</DialogTitle>
            <DialogDescription>
              리포트 발송 스케줄을 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm
            initialData={{
              name: schedule.name,
              periodType: schedule.periodType,
              scheduleDay: schedule.scheduleDay,
              scheduleHour: schedule.scheduleHour,
              emailEnabled: schedule.emailEnabled,
              slackEnabled: schedule.slackEnabled,
              slackWebhook: schedule.slackWebhook || '',
            }}
            onSubmit={handleEdit}
            onCancel={() => setIsEditOpen(false)}
            submitLabel="수정"
          />
        </DialogContent>
      </Dialog>

      {/* Recipients Dialog */}
      <Dialog open={isRecipientsOpen} onOpenChange={setIsRecipientsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>수신자 관리</DialogTitle>
            <DialogDescription>
              리포트를 받을 이메일 주소를 관리합니다.
            </DialogDescription>
          </DialogHeader>
          <RecipientList
            workspaceId={workspaceId}
            scheduleId={schedule.id}
            recipients={schedule.recipients || []}
            onUpdate={onUpdate}
          />
        </DialogContent>
      </Dialog>

      {/* Test Send Dialog */}
      <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>테스트 발송</DialogTitle>
            <DialogDescription>
              현재 데이터로 테스트 리포트를 생성하여 발송합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendTest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">수신 이메일</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTestOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSendingTest || !testEmail}>
                {isSendingTest && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                발송
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
