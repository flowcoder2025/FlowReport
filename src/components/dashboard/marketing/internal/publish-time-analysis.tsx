'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Youtube, Instagram, FileText, Calendar } from 'lucide-react'
import { CHANNEL_LABELS } from '@/constants'

interface ContentItem {
  id: string
  title: string
  channel: string
  publishedAt?: string
  views: number
  engagement: number
}

interface PublishTimeAnalysisProps {
  items: ContentItem[]
}

interface TimeSlot {
  slot: string
  count: number
  totalViews: number
  avgViews: number
}

interface DaySlot {
  day: string
  dayIndex: number
  count: number
  totalViews: number
  avgViews: number
}

interface ChannelAnalysis {
  channel: string
  channelLabel: string
  icon: React.ReactNode
  bestTimeSlot: TimeSlot | null
  bestDay: DaySlot | null
  totalContent: number
}

const TIME_SLOTS = [
  { label: '새벽 (0-6시)', start: 0, end: 6 },
  { label: '오전 (6-12시)', start: 6, end: 12 },
  { label: '오후 (12-18시)', start: 12, end: 18 },
  { label: '저녁 (18-24시)', start: 18, end: 24 },
]

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

const CHANNEL_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  YOUTUBE: {
    label: CHANNEL_LABELS.YOUTUBE,
    icon: <Youtube className="h-4 w-4" />,
    color: 'text-red-600',
  },
  META_INSTAGRAM: {
    label: CHANNEL_LABELS.META_INSTAGRAM,
    icon: <Instagram className="h-4 w-4" />,
    color: 'text-pink-600',
  },
  NAVER_BLOG: {
    label: CHANNEL_LABELS.NAVER_BLOG,
    icon: <FileText className="h-4 w-4" />,
    color: 'text-green-600',
  },
}

export function PublishTimeAnalysis({ items }: PublishTimeAnalysisProps) {
  const channelAnalyses = useMemo(() => {
    const itemsWithTime = items.filter((item) => item.publishedAt)
    if (itemsWithTime.length === 0) return []

    // Group by channel
    const channelMap = new Map<string, ContentItem[]>()
    for (const item of itemsWithTime) {
      const existing = channelMap.get(item.channel) || []
      existing.push(item)
      channelMap.set(item.channel, existing)
    }

    // Analyze each channel
    const analyses: ChannelAnalysis[] = []

    for (const [channel, channelItems] of Array.from(channelMap.entries())) {
      const config = CHANNEL_CONFIG[channel]
      if (!config) continue

      // Time slot analysis
      const timeSlots = new Map<string, { count: number; totalViews: number }>()
      for (const slot of TIME_SLOTS) {
        timeSlots.set(slot.label, { count: 0, totalViews: 0 })
      }

      // Day analysis
      const days = new Map<number, { count: number; totalViews: number }>()
      for (let i = 0; i < 7; i++) {
        days.set(i, { count: 0, totalViews: 0 })
      }

      for (const item of channelItems) {
        const date = new Date(item.publishedAt!)
        const hour = date.getHours()
        const dayIndex = date.getDay()

        // Find time slot
        for (const slot of TIME_SLOTS) {
          if (hour >= slot.start && hour < slot.end) {
            const existing = timeSlots.get(slot.label)!
            existing.count++
            existing.totalViews += item.views
            break
          }
        }

        // Day
        const dayData = days.get(dayIndex)!
        dayData.count++
        dayData.totalViews += item.views
      }

      // Find best time slot
      let bestTimeSlot: TimeSlot | null = null
      let bestTimeAvg = 0
      for (const [slot, data] of Array.from(timeSlots.entries())) {
        if (data.count > 0) {
          const avg = data.totalViews / data.count
          if (avg > bestTimeAvg) {
            bestTimeAvg = avg
            bestTimeSlot = {
              slot,
              count: data.count,
              totalViews: data.totalViews,
              avgViews: Math.round(avg),
            }
          }
        }
      }

      // Find best day
      let bestDay: DaySlot | null = null
      let bestDayAvg = 0
      for (const [dayIndex, data] of Array.from(days.entries())) {
        if (data.count > 0) {
          const avg = data.totalViews / data.count
          if (avg > bestDayAvg) {
            bestDayAvg = avg
            bestDay = {
              day: DAYS[dayIndex],
              dayIndex,
              count: data.count,
              totalViews: data.totalViews,
              avgViews: Math.round(avg),
            }
          }
        }
      }

      analyses.push({
        channel,
        channelLabel: config.label,
        icon: config.icon,
        bestTimeSlot,
        bestDay,
        totalContent: channelItems.length,
      })
    }

    // Sort by total content descending
    analyses.sort((a, b) => b.totalContent - a.totalContent)

    return analyses
  }, [items])

  if (channelAnalyses.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          채널별 최적 발행 시간
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {channelAnalyses.map((analysis) => (
            <ChannelTimeCard key={analysis.channel} analysis={analysis} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ChannelTimeCardProps {
  analysis: ChannelAnalysis
}

function ChannelTimeCard({ analysis }: ChannelTimeCardProps) {
  const config = CHANNEL_CONFIG[analysis.channel]

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Channel Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center ${config?.color || 'text-gray-600'}`}
      >
        {analysis.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{analysis.channelLabel}</span>
          <Badge variant="outline" className="text-xs">
            {analysis.totalContent}개 콘텐츠
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {/* Best Time Slot */}
          {analysis.bestTimeSlot && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">최적 시간:</span>
              <span className="font-medium">{analysis.bestTimeSlot.slot}</span>
              <span className="text-xs text-muted-foreground">
                (평균 {formatNumber(analysis.bestTimeSlot.avgViews)})
              </span>
            </div>
          )}

          {/* Best Day */}
          {analysis.bestDay && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">최적 요일:</span>
              <span className="font-medium">{analysis.bestDay.day}요일</span>
              <span className="text-xs text-muted-foreground">
                (평균 {formatNumber(analysis.bestDay.avgViews)})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
