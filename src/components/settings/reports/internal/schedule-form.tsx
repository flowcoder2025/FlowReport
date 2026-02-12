'use client'

/**
 * Schedule Form Component
 *
 * 리포트 스케줄 생성/수정 폼
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { REPORT_CONFIG, WEEKDAY_LABELS, MONTHLY_DAY_OPTIONS } from '@/constants'

interface ScheduleFormData {
  name: string
  periodType: 'WEEKLY' | 'MONTHLY'
  scheduleDay: number
  scheduleHour: number
  emailEnabled: boolean
  slackEnabled: boolean
  slackWebhook: string
}

interface ScheduleFormProps {
  initialData?: Partial<ScheduleFormData>
  onSubmit: (data: ScheduleFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
}

export function ScheduleForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = '저장',
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: initialData?.name || '',
    periodType: initialData?.periodType || 'WEEKLY',
    scheduleDay: initialData?.scheduleDay ?? 1,
    scheduleHour: initialData?.scheduleHour ?? REPORT_CONFIG.DEFAULT_SCHEDULE_HOUR,
    emailEnabled: initialData?.emailEnabled ?? true,
    slackEnabled: initialData?.slackEnabled ?? false,
    slackWebhook: initialData?.slackWebhook || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const updateField = <K extends keyof ScheduleFormData>(field: K, value: ScheduleFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">스케줄 이름</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="예: 주간 마케팅 리포트"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="periodType">리포트 유형</Label>
          <Select
            value={formData.periodType}
            onValueChange={(value: 'WEEKLY' | 'MONTHLY') => {
              updateField('periodType', value)
              // Reset scheduleDay when changing period type
              updateField('scheduleDay', value === 'WEEKLY' ? 1 : 1)
            }}
          >
            <SelectTrigger id="periodType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">주간 리포트</SelectItem>
              <SelectItem value="MONTHLY">월간 리포트</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduleDay">
            {formData.periodType === 'WEEKLY' ? '발송 요일' : '발송일'}
          </Label>
          <Select
            value={String(formData.scheduleDay)}
            onValueChange={(value) => updateField('scheduleDay', Number(value))}
          >
            <SelectTrigger id="scheduleDay">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formData.periodType === 'WEEKLY' ? (
                Object.entries(WEEKDAY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))
              ) : (
                MONTHLY_DAY_OPTIONS.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    매월 {day}일
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduleHour">발송 시간</Label>
        <Select
          value={String(formData.scheduleHour)}
          onValueChange={(value) => updateField('scheduleHour', Number(value))}
        >
          <SelectTrigger id="scheduleHour">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={String(i)}>
                {String(i).padStart(2, '0')}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Asia/Seoul 타임존 기준
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium">배포 설정</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailEnabled">이메일 발송</Label>
            <p className="text-sm text-muted-foreground">
              등록된 수신자에게 이메일로 리포트 발송
            </p>
          </div>
          <Switch
            id="emailEnabled"
            checked={formData.emailEnabled}
            onCheckedChange={(checked) => updateField('emailEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="slackEnabled">슬랙 알림</Label>
            <p className="text-sm text-muted-foreground">
              슬랙 채널로 리포트 알림 발송
            </p>
          </div>
          <Switch
            id="slackEnabled"
            checked={formData.slackEnabled}
            onCheckedChange={(checked) => updateField('slackEnabled', checked)}
          />
        </div>

        {formData.slackEnabled && (
          <div className="space-y-2">
            <Label htmlFor="slackWebhook">슬랙 Webhook URL</Label>
            <Input
              id="slackWebhook"
              type="url"
              value={formData.slackWebhook}
              onChange={(e) => updateField('slackWebhook', e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
