'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/common'
import { formatNumber } from '@/lib/utils/format'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  useContentAnalytics,
  ContentTypeStats,
} from '@/lib/hooks/use-dashboard-data'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { Skeleton } from '../../skeleton'
import { BarChart3, Trophy, Video, Image, FileText, Zap } from 'lucide-react'
import { CONTENT_TYPE_COLORS } from '@/constants'

const CONTENT_TYPE_LABELS: Record<string, string> = {
  POST: '포스트',
  REEL: '릴스',
  STORY: '스토리',
  SHORT: '쇼츠',
  VIDEO: '동영상',
  ARTICLE: '기사/블로그',
}

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  POST: <Image className="h-4 w-4" />,
  REEL: <Zap className="h-4 w-4" />,
  STORY: <Zap className="h-4 w-4" />,
  SHORT: <Video className="h-4 w-4" />,
  VIDEO: <Video className="h-4 w-4" />,
  ARTICLE: <FileText className="h-4 w-4" />,
}

export function ContentTypeAnalysis() {
  const { workspaceId, periodType, periodStart } = useDashboardContext()

  const { data, isLoading, error } = useContentAnalytics(
    workspaceId,
    periodType,
    periodStart
  )

  const chartData = useMemo(() => {
    if (!data?.byType) return []
    return data.byType.map((item) => ({
      name: CONTENT_TYPE_LABELS[item.contentType] || item.contentType,
      contentType: item.contentType,
      avgViews: item.avgViews,
      avgEngagement: item.avgEngagement,
      avgEngagementRate: item.avgEngagementRate,
      count: item.count,
    }))
  }, [data?.byType])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            콘텐츠 타입별 성과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px]" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            콘텐츠 타입별 성과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState />
        </CardContent>
      </Card>
    )
  }

  if (data.totalContent === 0 || chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            콘텐츠 타입별 성과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            아직 콘텐츠 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Best Performer Highlight */}
      {data.bestPerformer && (
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-900">
                    {CONTENT_TYPE_LABELS[data.bestPerformer.contentType] ||
                      data.bestPerformer.contentType}
                  </span>
                  <Badge className="bg-purple-100 text-purple-700">
                    최고 성과
                  </Badge>
                </div>
                <p className="text-sm text-purple-700">
                  {data.bestPerformer.reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              콘텐츠 타입별 평균 조회수
            </CardTitle>
            <Badge variant="outline">{data.totalContent}개 콘텐츠</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name === 'avgViews' ? '평균 조회수' : name,
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="avgViews" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CONTENT_TYPE_COLORS[entry.contentType] || '#6b7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Type Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.byType.slice(0, 6).map((stats, index) => (
          <ContentTypeCard key={stats.contentType} stats={stats} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

interface ContentTypeCardProps {
  stats: ContentTypeStats
  rank: number
}

function ContentTypeCard({ stats, rank }: ContentTypeCardProps) {
  const label = CONTENT_TYPE_LABELS[stats.contentType] || stats.contentType
  const color = CONTENT_TYPE_COLORS[stats.contentType] || '#6b7280'
  const icon = CONTENT_TYPE_ICONS[stats.contentType] || <FileText className="h-4 w-4" />

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {/* Rank */}
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center text-white"
            style={{ backgroundColor: color }}
          >
            {rank}
          </span>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color }}>{icon}</span>
              <span className="font-medium">{label}</span>
              <Badge variant="outline" className="text-xs">
                {stats.count}개
              </Badge>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">평균 조회</p>
                <p className="font-medium">{formatNumber(stats.avgViews)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">평균 참여</p>
                <p className="font-medium">{formatNumber(stats.avgEngagement)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">참여율</p>
                <p className="font-medium">{stats.avgEngagementRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

