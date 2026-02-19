'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = '데이터를 불러오는데 실패했습니다.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
      <AlertCircle className="h-8 w-8 text-destructive/60" />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          다시 시도
        </Button>
      )}
    </div>
  )
}
