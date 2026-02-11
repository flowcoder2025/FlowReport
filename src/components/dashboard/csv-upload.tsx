'use client'

import { useState, useCallback } from 'react'
import { ChannelProvider } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/use-toast'
import { Upload, Download, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface CsvUploadProps {
  workspaceId: string
  onSuccess?: () => void
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  rowsProcessed?: number
  snapshotsCreated?: number
  snapshotsUpdated?: number
  dateRange?: {
    start: string
    end: string
  }
  error?: string
  errors?: string[]
}

const CHANNELS: { value: ChannelProvider; label: string }[] = [
  { value: 'SMARTSTORE', label: '스마트스토어' },
  { value: 'COUPANG', label: '쿠팡' },
  { value: 'META_INSTAGRAM', label: 'Instagram' },
  { value: 'META_FACEBOOK', label: 'Facebook' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'GA4', label: 'Google Analytics 4' },
  { value: 'NAVER_BLOG', label: '네이버 블로그' },
  { value: 'NAVER_KEYWORDS', label: '네이버 키워드' },
  { value: 'GOOGLE_SEARCH_CONSOLE', label: 'Google Search Console' },
]

export function CsvUpload({ workspaceId, onSuccess }: CsvUploadProps) {
  const { toast } = useToast()
  const [channel, setChannel] = useState<ChannelProvider | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
      setStatus('idle')
      setResult(null)
    } else {
      toast({
        title: '오류',
        description: 'CSV 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      })
    }
  }, [toast])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStatus('idle')
      setResult(null)
    }
  }, [])

  const handleDownloadTemplate = async () => {
    if (!channel) {
      toast({
        title: '오류',
        description: '채널을 먼저 선택하세요.',
        variant: 'destructive',
      })
      return
    }

    window.open(`/api/workspaces/${workspaceId}/csv-templates?channel=${channel}`, '_blank')
  }

  const handleUpload = async () => {
    if (!channel) {
      toast({
        title: '오류',
        description: '채널을 선택하세요.',
        variant: 'destructive',
      })
      return
    }

    if (!file) {
      toast({
        title: '오류',
        description: '파일을 선택하세요.',
        variant: 'destructive',
      })
      return
    }

    setStatus('uploading')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `/api/csv/upload?workspaceId=${workspaceId}&channel=${channel}`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setResult({
          error: data.error,
          errors: data.errors,
        })
        return
      }

      setStatus('success')
      setResult({
        rowsProcessed: data.rowsProcessed,
        snapshotsCreated: data.snapshotsCreated,
        snapshotsUpdated: data.snapshotsUpdated,
        dateRange: data.dateRange,
      })

      toast({
        title: '업로드 완료',
        description: `${data.rowsProcessed}개 행이 처리되었습니다.`,
      })

      onSuccess?.()
    } catch {
      setStatus('error')
      setResult({ error: '업로드 중 오류가 발생했습니다.' })
    }
  }

  const handleReset = () => {
    setFile(null)
    setStatus('idle')
    setResult(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV 데이터 업로드</CardTitle>
        <CardDescription>
          채널별 데이터를 CSV 파일로 업로드하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Select */}
        <div className="space-y-2">
          <Label>채널 선택</Label>
          <div className="flex gap-2">
            <Select
              value={channel ?? undefined}
              onValueChange={(value) => setChannel(value as ChannelProvider)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="채널을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((ch) => (
                  <SelectItem key={ch.value} value={ch.value}>
                    {ch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={!channel}
            >
              <Download className="h-4 w-4 mr-2" />
              템플릿
            </Button>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted'}
            ${status === 'success' ? 'border-green-500 bg-green-50' : ''}
            ${status === 'error' ? 'border-red-500 bg-red-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {status === 'uploading' ? (
            <div className="space-y-2">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <p className="text-muted-foreground">업로드 중...</p>
            </div>
          ) : status === 'success' ? (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="font-medium text-green-700">업로드 완료</p>
              {result && (
                <div className="text-sm text-green-600 space-y-1">
                  <p>처리된 행: {result.rowsProcessed}개</p>
                  <p>생성된 스냅샷: {result.snapshotsCreated}개</p>
                  <p>업데이트된 스냅샷: {result.snapshotsUpdated}개</p>
                  {result.dateRange && (
                    <p>기간: {result.dateRange.start} ~ {result.dateRange.end}</p>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleReset} className="mt-4">
                다른 파일 업로드
              </Button>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="font-medium text-red-700">업로드 실패</p>
              {result && (
                <div className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {result.error && <p>{result.error}</p>}
                  {result.errors?.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleReset} className="mt-4">
                다시 시도
              </Button>
            </div>
          ) : file ? (
            <div className="space-y-2">
              <FileText className="h-12 w-12 mx-auto text-primary" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                파일 제거
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">
                  파일을 드래그하여 놓거나
                </p>
                <label className="cursor-pointer">
                  <span className="text-primary hover:underline">
                    파일을 선택하세요
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                CSV 파일만 가능, 최대 5MB
              </p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {file && status === 'idle' && (
          <Button onClick={handleUpload} className="w-full" disabled={!channel}>
            <Upload className="h-4 w-4 mr-2" />
            업로드
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
