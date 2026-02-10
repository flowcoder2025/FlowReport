import { ChannelProvider } from '@prisma/client'

export interface ChannelConnection {
  id: string
  provider: ChannelProvider
  accountName: string | null
  isActive: boolean
}

export interface SidebarProps {
  workspaceId: string
}

export interface ChannelListProps {
  connections: ChannelConnection[]
  isLoading: boolean
}

export interface ChannelFilterProps {
  connections: ChannelConnection[]
  selectedChannels: ChannelProvider[]
  onSelectionChange: (channels: ChannelProvider[]) => void
}

export interface SidebarToggleProps {
  collapsed: boolean
  onToggle: () => void
}

export const CHANNEL_DISPLAY_NAMES: Record<ChannelProvider, string> = {
  GA4: 'Google Analytics',
  META_INSTAGRAM: 'Instagram',
  META_FACEBOOK: 'Facebook',
  YOUTUBE: 'YouTube',
  SMARTSTORE: '스마트스토어',
  COUPANG: '쿠팡',
  GOOGLE_SEARCH_CONSOLE: 'Google Search Console',
  NAVER_BLOG: '네이버 블로그',
  NAVER_KEYWORDS: '네이버 키워드',
}

export const CHANNEL_ICONS: Record<ChannelProvider, string> = {
  GA4: '📊',
  META_INSTAGRAM: '📷',
  META_FACEBOOK: '👤',
  YOUTUBE: '▶️',
  SMARTSTORE: '🛒',
  COUPANG: '🚀',
  GOOGLE_SEARCH_CONSOLE: '🔍',
  NAVER_BLOG: '📝',
  NAVER_KEYWORDS: '🔑',
}
