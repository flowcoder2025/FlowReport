'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HorizontalBarChart } from '../../charts'
import {
  Users,
  Plus,
  Trash2,
  Trophy,
  TrendingUp,
  Upload,
  Youtube,
  Instagram,
  Building2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCompetitors,
  createCompetitor,
  deleteCompetitor,
  type Competitor as CompetitorType,
  type CompetitorPlatform,
} from '@/lib/hooks/use-dashboard-data'

// Types
type Platform = 'YOUTUBE' | 'META_INSTAGRAM'

interface CompetitorMetrics {
  followers: number
  engagementRate: number
  uploads: number
}

interface CompetitorComparisonProps {
  /** Workspace ID for API calls */
  workspaceId: string
  /** 내 채널 정보 (비교 기준) */
  myChannel?: {
    name: string
    platform: Platform
    metrics: CompetitorMetrics
  }
}

const MY_CHANNEL_DEFAULT = {
  name: '내 채널',
  platform: 'YOUTUBE' as Platform,
  metrics: {
    followers: 0,
    engagementRate: 0,
    uploads: 0,
  },
}

// Constants
const PLATFORM_OPTIONS = [
  { value: 'YOUTUBE', label: 'YouTube', icon: Youtube },
  { value: 'META_INSTAGRAM', label: 'Instagram', icon: Instagram },
]

const METRIC_LABELS = {
  followers: { label: '팔로워/구독자', icon: Users, unit: '' },
  engagementRate: { label: '참여율', icon: TrendingUp, unit: '%' },
  uploads: { label: '콘텐츠 업로드', icon: Upload, unit: '개' },
}

export function CompetitorComparison({ workspaceId, myChannel = MY_CHANNEL_DEFAULT }: CompetitorComparisonProps) {
  const { competitors: apiCompetitors, isLoading, error, mutate } = useCompetitors(workspaceId)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    platform: 'YOUTUBE' as Platform,
    channelId: '',
  })

  // API 데이터를 컴포넌트 형식으로 변환
  const competitors = useMemo(() => {
    return apiCompetitors.map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform as Platform,
      channelId: c.channelId,
      metrics: {
        followers: c.followers ?? 0,
        engagementRate: c.engagementRate ?? 0,
        uploads: c.uploads ?? 0,
      },
    }))
  }, [apiCompetitors])

  // 경쟁사 추가
  const handleAddCompetitor = useCallback(async () => {
    if (!newCompetitor.name || !newCompetitor.channelId) return

    setIsSubmitting(true)
    try {
      await createCompetitor(workspaceId, {
        name: newCompetitor.name,
        platform: newCompetitor.platform as CompetitorPlatform,
        channelId: newCompetitor.channelId,
      })
      setNewCompetitor({ name: '', platform: 'YOUTUBE', channelId: '' })
      setIsAddDialogOpen(false)
      mutate()
    } catch (err) {
      console.error('Failed to add competitor:', err)
      alert(err instanceof Error ? err.message : '경쟁사 추가에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }, [workspaceId, newCompetitor, mutate])

  // 경쟁사 삭제
  const handleDeleteCompetitor = useCallback(async (id: string) => {
    setDeleteLoadingId(id)
    try {
      await deleteCompetitor(workspaceId, id)
      mutate()
    } catch (err) {
      console.error('Failed to delete competitor:', err)
      alert(err instanceof Error ? err.message : '경쟁사 삭제에 실패했습니다.')
    } finally {
      setDeleteLoadingId(null)
    }
  }, [workspaceId, mutate])

  // 비교 데이터 생성
  const comparisonData = useMemo(() => {
    const allChannels = [
      { name: myChannel.name, metrics: myChannel.metrics, isMe: true },
      ...competitors
        .filter((c) => c.metrics)
        .map((c) => ({ name: c.name, metrics: c.metrics!, isMe: false })),
    ]

    return {
      followers: allChannels
        .map((c) => ({
          name: c.name,
          value: c.metrics.followers,
          color: c.isMe ? '#3b82f6' : undefined,
        }))
        .sort((a, b) => b.value - a.value),
      engagementRate: allChannels
        .map((c) => ({
          name: c.name,
          value: c.metrics.engagementRate,
          color: c.isMe ? '#3b82f6' : undefined,
        }))
        .sort((a, b) => b.value - a.value),
      uploads: allChannels
        .map((c) => ({
          name: c.name,
          value: c.metrics.uploads,
          color: c.isMe ? '#3b82f6' : undefined,
        }))
        .sort((a, b) => b.value - a.value),
    }
  }, [competitors, myChannel])

  // 내 채널 순위 계산
  const myRankings = useMemo(() => {
    return {
      followers: comparisonData.followers.findIndex((c) => c.name === myChannel.name) + 1,
      engagementRate: comparisonData.engagementRate.findIndex((c) => c.name === myChannel.name) + 1,
      uploads: comparisonData.uploads.findIndex((c) => c.name === myChannel.name) + 1,
    }
  }, [comparisonData, myChannel.name])

  const totalChannels = competitors.length + 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            경쟁사 비교 분석
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                경쟁사 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>경쟁사 채널 추가</DialogTitle>
                <DialogDescription>
                  비교 분석할 경쟁사 채널 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="competitor-name">채널명</Label>
                  <Input
                    id="competitor-name"
                    placeholder="경쟁사 이름"
                    value={newCompetitor.name}
                    onChange={(e) =>
                      setNewCompetitor((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competitor-platform">플랫폼</Label>
                  <Select
                    value={newCompetitor.platform}
                    onValueChange={(value: Platform) =>
                      setNewCompetitor((prev) => ({ ...prev, platform: value }))
                    }
                  >
                    <SelectTrigger id="competitor-platform">
                      <SelectValue placeholder="플랫폼 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competitor-channel-id">채널 ID / 핸들</Label>
                  <Input
                    id="competitor-channel-id"
                    placeholder="@username 또는 채널 ID"
                    value={newCompetitor.channelId}
                    onChange={(e) =>
                      setNewCompetitor((prev) => ({ ...prev, channelId: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                  취소
                </Button>
                <Button
                  onClick={handleAddCompetitor}
                  disabled={!newCompetitor.name || !newCompetitor.channelId || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  추가
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 에러 상태 */}
        {error && !isLoading && (
          <div className="py-8 text-center text-destructive">
            <p>데이터를 불러오는데 실패했습니다.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => mutate()}>
              다시 시도
            </Button>
          </div>
        )}

        {/* 경쟁사 목록 */}
        {!isLoading && !error && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">등록된 경쟁사</h4>
          <div className="flex flex-wrap gap-2">
            {/* 내 채널 */}
            <CompetitorChip
              name={myChannel.name}
              platform={myChannel.platform}
              isMyChannel
            />
            {/* 경쟁사 목록 */}
            {competitors.map((competitor) => (
              <CompetitorChip
                key={competitor.id}
                name={competitor.name}
                platform={competitor.platform}
                onDelete={() => handleDeleteCompetitor(competitor.id)}
                isDeleting={deleteLoadingId === competitor.id}
              />
            ))}
          </div>
        </div>
        )}

        {/* 순위 요약 */}
        {!isLoading && !error && (
        <div className="grid gap-3 md:grid-cols-3">
          <RankingCard
            label="팔로워/구독자"
            rank={myRankings.followers}
            total={totalChannels}
            icon={<Users className="h-4 w-4" />}
          />
          <RankingCard
            label="참여율"
            rank={myRankings.engagementRate}
            total={totalChannels}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <RankingCard
            label="콘텐츠 업로드"
            rank={myRankings.uploads}
            total={totalChannels}
            icon={<Upload className="h-4 w-4" />}
          />
        </div>
        )}

        {/* 비교 차트 */}
        {!isLoading && !error && competitors.length > 0 && (
          <div className="space-y-6">
            <MetricComparisonChart
              title="팔로워/구독자 비교"
              data={comparisonData.followers}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricComparisonChart
              title="참여율 비교"
              data={comparisonData.engagementRate}
              icon={<TrendingUp className="h-4 w-4" />}
              valueFormatter={(v) => `${v.toFixed(1)}%`}
            />
            <MetricComparisonChart
              title="콘텐츠 업로드 수 비교"
              data={comparisonData.uploads}
              icon={<Upload className="h-4 w-4" />}
              valueFormatter={(v) => `${v}개`}
            />
          </div>
        )}

        {!isLoading && !error && competitors.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>등록된 경쟁사가 없습니다.</p>
            <p className="text-sm">상단의 &quot;경쟁사 추가&quot; 버튼을 눌러 비교할 채널을 추가하세요.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 경쟁사 칩 컴포넌트
interface CompetitorChipProps {
  name: string
  platform: Platform
  isMyChannel?: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

function CompetitorChip({ name, platform, isMyChannel, onDelete, isDeleting }: CompetitorChipProps) {
  const PlatformIcon = platform === 'YOUTUBE' ? Youtube : Instagram
  const platformColor = platform === 'YOUTUBE' ? 'text-red-500' : 'text-pink-500'

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm',
        isMyChannel
          ? 'bg-blue-50 border-blue-200 text-blue-700'
          : 'bg-muted/50 border-border',
        isDeleting && 'opacity-50'
      )}
    >
      <PlatformIcon className={cn('h-3.5 w-3.5', platformColor)} />
      <span className="font-medium">{name}</span>
      {isMyChannel && (
        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded">내 채널</span>
      )}
      {!isMyChannel && onDelete && (
        <button
          onClick={onDelete}
          className="ml-1 p-0.5 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
          aria-label={`${name} 삭제`}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          )}
        </button>
      )}
    </div>
  )
}

// 순위 카드 컴포넌트
interface RankingCardProps {
  label: string
  rank: number
  total: number
  icon: React.ReactNode
}

function RankingCard({ label, rank, total, icon }: RankingCardProps) {
  const isFirst = rank === 1
  const isTop3 = rank <= 3

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {isFirst && <Trophy className="h-5 w-5 text-yellow-500" />}
        <span
          className={cn(
            'text-2xl font-bold',
            isFirst ? 'text-yellow-600' : isTop3 ? 'text-blue-600' : 'text-foreground'
          )}
        >
          {rank}위
        </span>
        <span className="text-sm text-muted-foreground">/ {total}개 채널</span>
      </div>
    </div>
  )
}

// 지표 비교 차트 컴포넌트
interface MetricComparisonChartProps {
  title: string
  data: Array<{ name: string; value: number; color?: string }>
  icon: React.ReactNode
  valueFormatter?: (value: number) => string
}

function MetricComparisonChart({ title, data, icon, valueFormatter }: MetricComparisonChartProps) {
  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </h4>
      <HorizontalBarChart
        data={data}
        height={Math.max(150, data.length * 40)}
      />
      {/* 순위 테이블 */}
      <div className="text-sm">
        {data.map((item, index) => (
          <div
            key={item.name}
            className={cn(
              'flex items-center justify-between py-1.5 px-2 rounded',
              item.color && 'bg-blue-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium',
                  index === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : index === 1
                      ? 'bg-gray-100 text-gray-700'
                      : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-muted text-muted-foreground'
                )}
              >
                {index + 1}
              </span>
              <span className={cn(item.color && 'font-medium text-blue-700')}>
                {item.name}
              </span>
            </div>
            <span className="font-medium">
              {valueFormatter ? valueFormatter(item.value) : formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 숫자 포맷팅 유틸
function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
