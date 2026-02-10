'use client'

import { ChannelFilterProps, CHANNEL_DISPLAY_NAMES, CHANNEL_ICONS } from '../types'
import { cn } from '@/lib/utils'
import { ChannelProvider } from '@prisma/client'

export function ChannelFilter({
  connections,
  selectedChannels,
  onSelectionChange,
}: ChannelFilterProps) {
  const handleToggle = (provider: ChannelProvider) => {
    if (selectedChannels.includes(provider)) {
      onSelectionChange(selectedChannels.filter((c) => c !== provider))
    } else {
      onSelectionChange([...selectedChannels, provider])
    }
  }

  const handleSelectAll = () => {
    if (selectedChannels.length === connections.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(connections.map((c) => c.provider))
    }
  }

  if (connections.length === 0) {
    return null
  }

  const allSelected = selectedChannels.length === connections.length
  const noneSelected = selectedChannels.length === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          채널 필터
        </span>
        <button
          onClick={handleSelectAll}
          className="text-xs text-primary hover:underline"
        >
          {allSelected || noneSelected ? '전체 선택' : '선택 해제'}
        </button>
      </div>

      <div className="space-y-1">
        {connections.map((connection) => {
          const isSelected = selectedChannels.includes(connection.provider)
          return (
            <label
              key={connection.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
                isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(connection.provider)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">
                {CHANNEL_ICONS[connection.provider]}
              </span>
              <span className="text-sm truncate">
                {connection.accountName || CHANNEL_DISPLAY_NAMES[connection.provider]}
              </span>
            </label>
          )
        })}
      </div>

      {noneSelected && (
        <p className="text-xs text-muted-foreground">
          필터를 선택하지 않으면 전체 채널 데이터를 표시합니다
        </p>
      )}
    </div>
  )
}
