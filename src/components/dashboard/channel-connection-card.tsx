'use client'

import { useState } from 'react'
import { ChannelProvider, ConnectionStatus } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Youtube,
  Instagram,
  Facebook,
  LineChart,
  ShoppingBag,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ChannelConnectionCardProps {
  workspaceId: string
  connection: {
    id: string
    provider: ChannelProvider
    accountId: string
    accountName: string | null
    providerDisplayName: string
    status: ConnectionStatus
    lastSyncAt: string | null
    lastError: string | null
    syncEnabled: boolean
    isApiSupported: boolean
    isCsvOnly: boolean
  }
  onUpdate: () => void
}

const PROVIDER_ICONS: Record<ChannelProvider, React.ReactNode> = {
  GA4: <BarChart3 className="h-5 w-5 text-orange-500" />,
  META_INSTAGRAM: <Instagram className="h-5 w-5 text-pink-500" />,
  META_FACEBOOK: <Facebook className="h-5 w-5 text-blue-600" />,
  YOUTUBE: <Youtube className="h-5 w-5 text-red-500" />,
  SMARTSTORE: <ShoppingBag className="h-5 w-5 text-green-500" />,
  COUPANG: <ShoppingBag className="h-5 w-5 text-blue-500" />,
  NAVER_BLOG: <LineChart className="h-5 w-5 text-green-600" />,
  NAVER_KEYWORDS: <LineChart className="h-5 w-5 text-green-600" />,
  GOOGLE_SEARCH_CONSOLE: <BarChart3 className="h-5 w-5 text-blue-500" />,
}

const STATUS_CONFIG: Record<ConnectionStatus, { icon: React.ReactNode; text: string; color: string }> = {
  ACTIVE: {
    icon: <CheckCircle className="h-4 w-4" />,
    text: '연결됨',
    color: 'text-green-600',
  },
  ERROR: {
    icon: <AlertCircle className="h-4 w-4" />,
    text: '오류',
    color: 'text-red-600',
  },
  PENDING: {
    icon: <Clock className="h-4 w-4" />,
    text: '대기중',
    color: 'text-yellow-600',
  },
  REVOKED: {
    icon: <AlertCircle className="h-4 w-4" />,
    text: '해지됨',
    color: 'text-gray-600',
  },
  EXPIRED: {
    icon: <AlertCircle className="h-4 w-4" />,
    text: '만료됨',
    color: 'text-orange-600',
  },
}

export function ChannelConnectionCard({
  workspaceId,
  connection,
  onUpdate,
}: ChannelConnectionCardProps) {
  const { toast } = useToast()
  const [isTesting, setIsTesting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const statusConfig = STATUS_CONFIG[connection.status]

  const handleTest = async () => {
    if (connection.isCsvOnly) {
      toast({
        title: '정보',
        description: `${connection.providerDisplayName}는 CSV 업로드 전용입니다.`,
      })
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/connections/${connection.id}/test`,
        { method: 'POST' }
      )
      const data = await response.json()

      if (data.valid) {
        toast({
          title: '연결 성공',
          description: data.accountName
            ? `${data.accountName} 계정에 정상 연결되었습니다.`
            : '연결이 정상입니다.',
        })
      } else {
        toast({
          title: '연결 실패',
          description: data.error || '연결 테스트에 실패했습니다.',
          variant: 'destructive',
        })
      }
      onUpdate()
    } catch {
      toast({
        title: '오류',
        description: '연결 테스트 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncToggle = async (enabled: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/connections/${connection.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syncEnabled: enabled }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      toast({
        title: '설정 변경',
        description: enabled ? '자동 동기화가 활성화되었습니다.' : '자동 동기화가 비활성화되었습니다.',
      })
      onUpdate()
    } catch {
      toast({
        title: '오류',
        description: '설정 변경에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`${connection.providerDisplayName} 연결을 삭제하시겠습니까?\n관련 데이터도 함께 삭제됩니다.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/connections/${connection.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      toast({
        title: '삭제 완료',
        description: '연결이 삭제되었습니다.',
      })
      onUpdate()
    } catch {
      toast({
        title: '오류',
        description: '삭제에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
              {PROVIDER_ICONS[connection.provider]}
            </div>
            <div>
              <h4 className="font-medium">{connection.providerDisplayName}</h4>
              <p className="text-sm text-muted-foreground">
                {connection.accountName || connection.accountId}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1 text-sm ${statusConfig.color}`}>
            {statusConfig.icon}
            <span>{statusConfig.text}</span>
          </div>
        </div>

        {connection.lastError && (
          <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">
            {connection.lastError}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {connection.lastSyncAt ? (
              <span>
                마지막 동기화:{' '}
                {formatDistanceToNow(new Date(connection.lastSyncAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            ) : (
              <span>동기화된 적 없음</span>
            )}
          </div>

          {connection.isApiSupported && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">자동 동기화</span>
              <Switch
                checked={connection.syncEnabled}
                onCheckedChange={handleSyncToggle}
                disabled={isUpdating}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {connection.isApiSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              테스트
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
