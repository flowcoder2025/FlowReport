'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

const TIMEZONES = [
  { value: 'Asia/Seoul', label: '서울 (KST, UTC+9)' },
  { value: 'Asia/Tokyo', label: '도쿄 (JST, UTC+9)' },
  { value: 'America/New_York', label: '뉴욕 (EST, UTC-5)' },
  { value: 'America/Los_Angeles', label: 'LA (PST, UTC-8)' },
  { value: 'Europe/London', label: '런던 (GMT, UTC+0)' },
  { value: 'UTC', label: 'UTC' },
]

const WEEK_STARTS = [
  { value: '0', label: '일요일' },
  { value: '1', label: '월요일' },
  { value: '6', label: '토요일' },
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[가-힣]/g, '') // Remove Korean characters
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export default function NewWorkspacePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [timezone, setTimezone] = useState('Asia/Seoul')
  const [weekStart, setWeekStart] = useState('1')

  const handleNameChange = (value: string) => {
    setName(value)
    if (autoSlug) {
      setSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setAutoSlug(false)
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: '오류',
        description: '워크스페이스 이름을 입력하세요.',
        variant: 'destructive',
      })
      return
    }

    if (!slug.trim()) {
      toast({
        title: '오류',
        description: '슬러그를 입력하세요.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          timezone,
          weekStart: parseInt(weekStart),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '워크스페이스 생성에 실패했습니다.')
      }

      toast({
        title: '생성 완료',
        description: '워크스페이스가 생성되었습니다.',
      })

      router.push(`/workspaces/${data.workspace.id}`)
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '워크스페이스 생성에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Link
        href="/workspaces"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        워크스페이스 목록
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>새 워크스페이스</CardTitle>
          <CardDescription>
            리포트를 관리할 새 워크스페이스를 만듭니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="예: 마케팅팀 리포트"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">슬러그 *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="예: marketing-report"
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground">
                URL에 사용됩니다. 영문 소문자, 숫자, 하이픈만 가능합니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="워크스페이스에 대한 간략한 설명"
                maxLength={500}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">타임존</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="타임존 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekStart">주 시작일</Label>
                <Select value={weekStart} onValueChange={setWeekStart}>
                  <SelectTrigger>
                    <SelectValue placeholder="주 시작일 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_STARTS.map((ws) => (
                      <SelectItem key={ws.value} value={ws.value}>
                        {ws.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                생성
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
