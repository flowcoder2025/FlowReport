'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { ErrorState } from '@/components/common'
import { useDashboardNotes, saveDashboardNotes } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../skeleton'
import { mutate } from 'swr'
import { format } from 'date-fns'

interface NotesTabProps {
  workspaceId: string
  periodStart: Date
  canEdit?: boolean
}

interface Note {
  id: string
  content: string
}

interface ActionItem {
  id?: string
  title: string
  status: string
}

export function NotesTab({ workspaceId, periodStart, canEdit = true }: NotesTabProps) {
  const { data, error, isLoading } = useDashboardNotes(
    workspaceId,
    'WEEKLY',
    periodStart
  )

  const [causes, setCauses] = useState<Note[]>([])
  const [improvements, setImprovements] = useState<Note[]>([])
  const [bestPractices, setBestPractices] = useState<Note[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync state with fetched data
  useEffect(() => {
    if (data) {
      setCauses(data.notes.causes.map((c, i) => ({ id: `cause-${i}`, content: c })))
      setImprovements(data.notes.improvements.map((c, i) => ({ id: `imp-${i}`, content: c })))
      setBestPractices(data.notes.bestPractices.map((c, i) => ({ id: `bp-${i}`, content: c })))
      setActionItems(data.actions.map((a) => ({ id: a.id, title: a.title, status: a.status })))
      setHasChanges(false)
    }
  }, [data])

  const addNote = (setter: React.Dispatch<React.SetStateAction<Note[]>>) => {
    setter((prev) => [...prev, { id: crypto.randomUUID(), content: '' }])
    setHasChanges(true)
  }

  const updateNote = (
    setter: React.Dispatch<React.SetStateAction<Note[]>>,
    id: string,
    content: string
  ) => {
    setter((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)))
    setHasChanges(true)
  }

  const removeNote = (
    setter: React.Dispatch<React.SetStateAction<Note[]>>,
    id: string
  ) => {
    setter((prev) => prev.filter((n) => n.id !== id))
    setHasChanges(true)
  }

  const addAction = () => {
    setActionItems((prev) => [...prev, { title: '', status: 'PENDING' }])
    setHasChanges(true)
  }

  const updateAction = (index: number, title: string) => {
    setActionItems((prev) =>
      prev.map((a, i) => (i === index ? { ...a, title } : a))
    )
    setHasChanges(true)
  }

  const removeAction = (index: number) => {
    setActionItems((prev) => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveDashboardNotes(
        workspaceId,
        'WEEKLY',
        periodStart,
        {
          causes: causes.map((n) => n.content).filter(Boolean),
          improvements: improvements.map((n) => n.content).filter(Boolean),
          bestPractices: bestPractices.map((n) => n.content).filter(Boolean),
        },
        actionItems
          .filter((a) => a.title.trim())
          .map((a) => ({
            id: a.id?.startsWith('action-') ? undefined : a.id,
            title: a.title,
            status: a.status,
          }))
      )

      // Revalidate the data
      const periodStartStr = format(periodStart, 'yyyy-MM-dd')
      await mutate(`/api/workspaces/${workspaceId}/notes?periodType=WEEKLY&periodStart=${periodStartStr}`)
      setHasChanges(false)
    } catch (err) {
      console.error('Failed to save notes:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <NotesSkeleton />
  }

  if (error) {
    return <ErrorState />
  }

  const NoteSection = ({
    title,
    notes,
    setNotes,
    minRequired = 0,
  }: {
    title: string
    notes: Note[]
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>
    minRequired?: number
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {canEdit && minRequired > 0 && notes.filter((n) => n.content.trim()).length < minRequired && (
          <span className="text-xs text-orange-600">
            최소 {minRequired}개 필요
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="flex gap-2">
            <input
              type="text"
              value={note.content}
              onChange={(e) => updateNote(setNotes, note.id, e.target.value)}
              placeholder="내용을 입력하세요..."
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!canEdit}
              readOnly={!canEdit}
            />
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeNote(setNotes, note.id)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addNote(setNotes)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            추가
          </Button>
        )}
      </CardContent>
    </Card>
  )

  // 최소 요건 충족 여부 확인
  const causesCount = causes.filter((n) => n.content.trim()).length
  const improvementsCount = improvements.filter((n) => n.content.trim()).length
  const actionsCount = actionItems.filter((a) => a.title.trim()).length
  const meetsMinRequirements = causesCount >= 1 && improvementsCount >= 1 && actionsCount >= 1

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {!canEdit && (
          <span className="text-sm text-muted-foreground self-center px-2 py-1 bg-muted rounded">
            읽기 전용
          </span>
        )}
        {canEdit && !meetsMinRequirements && (
          <span className="text-sm text-orange-600 self-center">
            최소 입력 요건을 충족해주세요
          </span>
        )}
        {canEdit && hasChanges && meetsMinRequirements && (
          <span className="text-sm text-muted-foreground self-center">변경사항 있음</span>
        )}
        {canEdit && (
          <Button onClick={handleSave} disabled={isSaving || !meetsMinRequirements}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <NoteSection
          title="증감 원인"
          notes={causes}
          setNotes={setCauses}
          minRequired={1}
        />
        <NoteSection
          title="개선사항"
          notes={improvements}
          setNotes={setImprovements}
          minRequired={1}
        />
        <NoteSection
          title="베스트 프랙티스"
          notes={bestPractices}
          setNotes={setBestPractices}
        />

        {/* Action Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">차주 반영사항</CardTitle>
            {canEdit && actionItems.filter((a) => a.title.trim()).length < 1 && (
              <span className="text-xs text-orange-600">최소 1개 필요</span>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {actionItems.map((action, index) => (
              <div key={action.id || `new-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={action.title}
                  onChange={(e) => updateAction(index, e.target.value)}
                  placeholder="액션 아이템을 입력하세요..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={addAction}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                추가
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NotesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    </div>
  )
}
