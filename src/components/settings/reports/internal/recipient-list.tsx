'use client'

/**
 * Recipient List Component
 *
 * 리포트 수신자 목록 관리
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/hooks/use-toast'
import { Loader2, Plus, Trash2, Mail, User } from 'lucide-react'
import type { ReportRecipient } from './use-report-schedules'
import { REPORT_CONFIG } from '@/constants'

interface RecipientListProps {
  workspaceId: string
  scheduleId: string
  recipients: ReportRecipient[]
  onUpdate: () => void
}

export function RecipientList({ workspaceId, scheduleId, recipients, onUpdate }: RecipientListProps) {
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmail) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/reports/schedules/${scheduleId}/recipients`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail, name: newName || undefined }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '수신자 추가에 실패했습니다.')
      }

      toast({
        title: '추가 완료',
        description: '수신자가 추가되었습니다.',
      })

      setNewEmail('')
      setNewName('')
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '수신자 추가에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRecipient = async (recipientId: string) => {
    setDeletingId(recipientId)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/reports/schedules/${scheduleId}/recipients`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId }),
        }
      )

      if (!response.ok) {
        throw new Error('수신자 삭제에 실패했습니다.')
      }

      toast({
        title: '삭제 완료',
        description: '수신자가 삭제되었습니다.',
      })

      onUpdate()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '수신자 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const canAddMore = recipients.length < REPORT_CONFIG.MAX_RECIPIENTS

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">수신자 목록</h4>
          <p className="text-sm text-muted-foreground">
            {recipients.length}/{REPORT_CONFIG.MAX_RECIPIENTS}명
          </p>
        </div>
        {canAddMore && !isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            추가
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddRecipient} className="p-4 border rounded-lg space-y-4 bg-muted/50">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newEmail">이메일 *</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newName">이름 (선택)</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setNewEmail('')
                setNewName('')
              }}
            >
              취소
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !newEmail}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              추가
            </Button>
          </div>
        </form>
      )}

      {recipients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>등록된 수신자가 없습니다.</p>
          {canAddMore && (
            <Button variant="link" size="sm" onClick={() => setIsAdding(true)}>
              수신자 추가하기
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y">
          {recipients.map((recipient) => (
            <li key={recipient.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {recipient.name || recipient.email}
                  </p>
                  {recipient.name && (
                    <p className="text-sm text-muted-foreground">{recipient.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {recipient.isActive ? (
                  <Badge variant="secondary">활성</Badge>
                ) : (
                  <Badge variant="outline">비활성</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteRecipient(recipient.id)}
                  disabled={deletingId === recipient.id}
                >
                  {deletingId === recipient.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
