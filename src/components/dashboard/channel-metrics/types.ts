import {
  YouTubeMetrics,
  InstagramMetrics,
  StoreMetrics,
  HighlightItem,
} from '@/lib/hooks/use-dashboard-data'

export type { YouTubeMetrics, InstagramMetrics, StoreMetrics, HighlightItem }

export interface MetricBoxProps {
  label: string
  value: number | null
  change?: number | null
  format?: 'number' | 'currency' | 'percent' | 'duration'
  size?: 'sm' | 'md' | 'lg'
}

export interface YouTubeCardProps {
  metrics: YouTubeMetrics
}

export interface InstagramCardProps {
  metrics: InstagramMetrics
}

export interface StoreCardProps {
  metrics: StoreMetrics
  name: string
}

export interface HighlightBannerProps {
  highlights: HighlightItem[]
}
