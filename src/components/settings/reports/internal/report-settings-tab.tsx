'use client'

/**
 * Report Settings Tab Component
 *
 * 리포트 설정 메인 탭
 */
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/hooks/use-toast'
import { Loader2, Plus, FileText, History, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useReportSchedules, useReportHistory } from './use-report-schedules'
import { ScheduleCard } from './schedule-card'
import { ScheduleForm } from './schedule-form'

interface ReportSettingsTabProps {
  workspaceId: string
}

export function ReportSettingsTab({ workspaceId }: ReportSettingsTabProps) {
  const { toast } = useToast()
  const { schedules, isLoading, mutate } = useReportSchedules(workspaceId)
  const { reports: history, isLoading: isLoadingHistory } = useReportHistory(workspaceId)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const hasWeeklySchedule = schedules.some((s) => s.periodType === 'WEEKLY')
  const hasMonthlySchedule = schedules.some((s) => s.periodType === 'MONTHLY')
  const canCreateWeekly = !hasWeeklySchedule
  const canCreateMonthly = !hasMonthlySchedule

  const handleCreate = async (data: {
    name: string
    periodType: 'WEEKLY' | 'MONTHLY'
    scheduleDay: number
    scheduleHour: number
    emailEnabled: boolean
    slackEnabled: boolean
    slackWebhook: string
  }) => {
    setIsCreating(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/reports/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          slackWebhook: data.slackWebhook || null,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '스케줄 생성에 실패했습니다.')
      }

      toast({
        title: '생성 완료',
        description: '리포트 스케줄이 생성되었습니다.',
      })

      setIsCreateOpen(false)
      mutate()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '스케줄 생성에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '대기 중'
      case 'GENERATING':
        return '생성 중'
      case 'GENERATED':
        return '생성됨'
      case 'SENDING':
        return '발송 중'
      case 'COMPLETED':
        return '완료'
      case 'FAILED':
        return '실패'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">로딩 중...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules" className="gap-2">
            <FileText className="h-4 w-4" />
            스케줄
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            발송 이력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>리포트 스케줄</CardTitle>
                  <CardDescription>
                    자동으로 생성되고 발송되는 리포트를 설정합니다.
                  </CardDescription>
                </div>
                {(canCreateWeekly || canCreateMonthly) && (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    스케줄 추가
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    등록된 리포트 스케줄이 없습니다.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 스케줄 만들기
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {schedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      workspaceId={workspaceId}
                      schedule={schedule}
                      onUpdate={() => mutate()}
                      onDelete={() => mutate()}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>발송 이력</CardTitle>
              <CardDescription>
                최근 리포트 발송 내역을 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>발송된 리포트가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(report.status)}
                        <div>
                          <p className="font-medium text-sm">
                            {report.schedule.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={report.periodType === 'WEEKLY' ? 'default' : 'secondary'}>
                          {report.periodType === 'WEEKLY' ? '주간' : '월간'}
                        </Badge>
                        <div className="text-right text-sm">
                          <p className="font-medium">{getStatusLabel(report.status)}</p>
                          {report.status === 'COMPLETED' && (
                            <p className="text-muted-foreground">
                              {report.emailsSent}건 발송
                            </p>
                          )}
                          {report.status === 'FAILED' && report.error && (
                            <p className="text-red-500 text-xs max-w-[200px] truncate">
                              {report.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>리포트 스케줄 추가</DialogTitle>
            <DialogDescription>
              새로운 자동 리포트 발송 스케줄을 생성합니다.
              {!canCreateWeekly && !canCreateMonthly && (
                <span className="block mt-2 text-amber-500">
                  주간 및 월간 스케줄이 모두 등록되어 있습니다.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm
            initialData={{
              periodType: canCreateWeekly ? 'WEEKLY' : 'MONTHLY',
            }}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={isCreating}
            submitLabel="스케줄 생성"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
