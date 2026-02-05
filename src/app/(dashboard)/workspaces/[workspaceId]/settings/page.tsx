'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChannelConnectionCard } from '@/components/dashboard/channel-connection-card'
import { AddChannelModal } from '@/components/dashboard/add-channel-modal'
import { CsvUpload } from '@/components/dashboard/csv-upload'
import { useToast } from '@/lib/hooks/use-toast'
import { ArrowLeft, Plus, Loader2, Settings, Link2, Upload } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Connection {
  id: string
  provider: string
  accountId: string
  accountName: string | null
  providerDisplayName: string
  status: string
  lastSyncAt: string | null
  lastError: string | null
  syncEnabled: boolean
  isApiSupported: boolean
  isCsvOnly: boolean
}

interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  timezone: string
  weekStart: number
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workspaceId = params.workspaceId as string

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const { data: workspaceData, mutate: mutateWorkspace } = useSWR<{ workspace: Workspace }>(
    `/api/workspaces/${workspaceId}`,
    fetcher
  )

  const { data: connectionsData, mutate: mutateConnections } = useSWR<{ connections: Connection[] }>(
    `/api/workspaces/${workspaceId}/connections`,
    fetcher
  )

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  // Initialize form when workspace data loads
  if (workspaceData?.workspace && !formData.name) {
    setFormData({
      name: workspaceData.workspace.name,
      description: workspaceData.workspace.description || '',
    })
  }

  const handleWorkspaceUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update workspace')
      }

      toast({
        title: '저장 완료',
        description: '워크스페이스 정보가 업데이트되었습니다.',
      })

      mutateWorkspace()
    } catch {
      toast({
        title: '오류',
        description: '저장에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const workspace = workspaceData?.workspace
  const connections = connectionsData?.connections || []

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link
        href={`/workspaces/${workspaceId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        대시보드로 돌아가기
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">워크스페이스 설정</h1>
        <p className="text-muted-foreground mt-1">
          {workspace?.name || '로딩 중...'}
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            일반
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-2">
            <Link2 className="h-4 w-4" />
            채널 연결
          </TabsTrigger>
          <TabsTrigger value="csv" className="gap-2">
            <Upload className="h-4 w-4" />
            CSV 업로드
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                워크스페이스의 기본 정보를 수정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWorkspaceUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>슬러그</Label>
                  <Input value={workspace?.slug || ''} disabled />
                  <p className="text-sm text-muted-foreground">
                    슬러그는 변경할 수 없습니다.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    저장
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Connections */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>채널 연결</CardTitle>
                  <CardDescription>
                    데이터를 가져올 채널을 연결합니다.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  채널 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    연결된 채널이 없습니다.
                  </p>
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 채널 연결하기
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {connections.map((connection) => (
                    <ChannelConnectionCard
                      key={connection.id}
                      workspaceId={workspaceId}
                      connection={connection as any}
                      onUpdate={() => mutateConnections()}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <AddChannelModal
            workspaceId={workspaceId}
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            onSuccess={() => mutateConnections()}
          />
        </TabsContent>

        {/* CSV Upload */}
        <TabsContent value="csv">
          <CsvUpload workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
