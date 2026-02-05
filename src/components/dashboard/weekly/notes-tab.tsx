'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface NotesTabProps {
  workspaceId: string
}

interface Note {
  id: string
  content: string
}

export function NotesTab({ workspaceId }: NotesTabProps) {
  const [causes, setCauses] = useState<Note[]>([
    { id: '1', content: '신규 프로모션 캠페인 진행으로 트래픽 증가' },
    { id: '2', content: '인스타그램 릴스 바이럴 콘텐츠' },
  ])
  const [improvements, setImprovements] = useState<Note[]>([
    { id: '1', content: '전환율 개선을 위한 랜딩페이지 A/B 테스트' },
  ])
  const [bestPractices, setBestPractices] = useState<Note[]>([])
  const [actionItems, setActionItems] = useState<Note[]>([
    { id: '1', content: '신규 상품 3종 등록' },
    { id: '2', content: '인스타그램 콘텐츠 5개 업로드' },
  ])

  const addNote = (setter: React.Dispatch<React.SetStateAction<Note[]>>) => {
    setter((prev) => [...prev, { id: crypto.randomUUID(), content: '' }])
  }

  const updateNote = (
    setter: React.Dispatch<React.SetStateAction<Note[]>>,
    id: string,
    content: string
  ) => {
    setter((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)))
  }

  const removeNote = (
    setter: React.Dispatch<React.SetStateAction<Note[]>>,
    id: string
  ) => {
    setter((prev) => prev.filter((n) => n.id !== id))
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
        {minRequired > 0 && notes.length < minRequired && (
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
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeNote(setNotes, note.id)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => addNote(setNotes)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          추가
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button>저장</Button>
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
        <NoteSection
          title="차주 반영사항"
          notes={actionItems}
          setNotes={setActionItems}
          minRequired={1}
        />
      </div>
    </div>
  )
}
