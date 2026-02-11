'use client'

import { useState, useEffect } from 'react'
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
import { ArrowLeft, Plus, Loader2, Settings, Link2, Upload, Target } from 'lucide-react'
import { type TargetConfig } from '@/lib/types/targets'

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
  const [isUpdatingTargets, setIsUpdatingTargets] = useState(false)

  const { data: workspaceData, mutate: mutateWorkspace } = useSWR<{ workspace: Workspace }>(
    `/api/workspaces/${workspaceId}`,
    fetcher
  )

  const { data: connectionsData, mutate: mutateConnections } = useSWR<{ connections: Connection[] }>(
    `/api/workspaces/${workspaceId}/connections`,
    fetcher
  )

  const { data: targetsData, mutate: mutateTargets, isLoading: isLoadingTargets } = useSWR<{
    targetConfig: TargetConfig
    defaults: TargetConfig
  }>(
    `/api/workspaces/${workspaceId}/settings/targets`,
    fetcher
  )

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const [targetFormData, setTargetFormData] = useState<TargetConfig>({
    revenueGrowthRate: undefined,
    revenueTarget: undefined,
    engagementTarget: undefined,
    conversionTarget: undefined,
  })

  // Initialize form when workspace data loads
  if (workspaceData?.workspace && !formData.name) {
    setFormData({
      name: workspaceData.workspace.name,
      description: workspaceData.workspace.description || '',
    })
  }

  // Initialize target form when targets data loads
  useEffect(() => {
    if (targetsData?.targetConfig) {
      setTargetFormData({
        revenueGrowthRate: targetsData.targetConfig.revenueGrowthRate,
        revenueTarget: targetsData.targetConfig.revenueTarget,
        engagementTarget: targetsData.targetConfig.engagementTarget,
        conversionTarget: targetsData.targetConfig.conversionTarget,
      })
    }
  }, [targetsData])

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

  const handleTargetsUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingTargets(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/settings/targets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update targets')
      }

      toast({
        title: '저장 완료',
        description: 'KPI 목표값이 업데이트되었습니다.',
      })

      mutateTargets()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '목표값 저장에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingTargets(false)
    }
  }

  const handleTargetChange = (field: keyof TargetConfig, value: string) => {
    const numValue = value === '' ? undefined : Number(value)
    setTargetFormData((prev) => ({ ...prev, [field]: numValue }))
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
          <TabsTrigger value="targets" className="gap-2">
            <Target className="h-4 w-4" />
            목표
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

        {/* KPI Targets */}
        <TabsContent value="targets">
          <Card>
            <CardHeader>
              <CardTitle>KPI 목표값</CardTitle>
              <CardDescription>
                대시보드에서 비교할 KPI 목표값을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTargets ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">목표값 불러오는 중...</span>
                </div>
              ) : (
                <form onSubmit={handleTargetsUpdate} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="revenueGrowthRate">성장률 목표 (%)</Label>
                      <Input
                        id="revenueGrowthRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="예: 10"
                        value={targetFormData.revenueGrowthRate ?? ''}
                        onChange={(e) => handleTargetChange('revenueGrowthRate', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        전년 대비 매출 성장률 목표 (0-100%)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="revenueTarget">매출 목표 (원)</Label>
                      <Input
                        id="revenueTarget"
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="예: 100000000"
                        value={targetFormData.revenueTarget ?? ''}
                        onChange={(e) => handleTargetChange('revenueTarget', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        월간 매출 목표 금액
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="engagementTarget">참여율 목표 (%)</Label>
                      <Input
                        id="engagementTarget"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="예: 5"
                        value={targetFormData.engagementTarget ?? ''}
                        onChange={(e) => handleTargetChange('engagementTarget', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        콘텐츠 참여율 목표 (좋아요, 댓글, 공유 비율)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conversionTarget">전환율 목표 (%)</Label>
                      <Input
                        id="conversionTarget"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="예: 2"
                        value={targetFormData.conversionTarget ?? ''}
                        onChange={(e) => handleTargetChange('conversionTarget', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        방문자 대비 구매 전환율 목표
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isUpdatingTargets}>
                      {isUpdatingTargets && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      목표값 저장
                    </Button>
                  </div>
                </form>
              )}
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
