import { ChannelProvider } from '@prisma/client'
import { CHANNEL_LABELS } from '@/constants'

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

export const CHANNEL_DISPLAY_NAMES = CHANNEL_LABELS

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
