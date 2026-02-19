'use client'

import { ChevronsUpDown } from 'lucide-react'
import { ChannelProvider } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardUrl } from '@/lib/hooks/use-dashboard-url'
import { useConnections } from '@/lib/hooks/use-connections'
import { CHANNEL_LABELS } from '@/constants'

const CHANNEL_DISPLAY_NAMES = CHANNEL_LABELS

export function ChannelMultiSelect() {
  const { workspaceId, selectedChannels, setSelectedChannels } = useDashboardContext()
  const { updateUrl } = useDashboardUrl()
  const { data } = useConnections(workspaceId)

  const availableChannels = (data?.connections || [])
    .filter((c) => c.isActive)
    .map((c) => c.provider)

  const uniqueChannels: ChannelProvider[] = []
  availableChannels.forEach((ch) => {
    if (!uniqueChannels.includes(ch)) {
      uniqueChannels.push(ch)
    }
  })

  const toggleChannel = (channel: ChannelProvider) => {
    const newSelection = selectedChannels.includes(channel)
      ? selectedChannels.filter((c) => c !== channel)
      : [...selectedChannels, channel]

    setSelectedChannels(newSelection)
    updateUrl({ channels: newSelection.length > 0 ? newSelection.join(',') : undefined })
  }

  const isSelected = (channel: ChannelProvider) => {
    return selectedChannels.length === 0 || selectedChannels.includes(channel)
  }

  const displayLabel = () => {
    if (selectedChannels.length === 0 || selectedChannels.length === uniqueChannels.length) {
      return '전체 채널'
    }
    if (selectedChannels.length === 1) {
      return CHANNEL_DISPLAY_NAMES[selectedChannels[0]]
    }
    return `${selectedChannels.length}개 채널`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-8 w-[160px] justify-between text-sm font-normal"
        >
          {displayLabel()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>채널 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex gap-1 px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs flex-1"
            onClick={() => {
              setSelectedChannels(uniqueChannels)
              updateUrl({ channels: uniqueChannels.join(',') })
            }}
          >
            전체 선택
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs flex-1"
            onClick={() => {
              setSelectedChannels([])
              updateUrl({ channels: undefined })
            }}
          >
            전체 선택 (초기화)
          </Button>
        </div>
        <DropdownMenuSeparator />
        {uniqueChannels.map((channel) => (
          <DropdownMenuCheckboxItem
            key={channel}
            checked={isSelected(channel)}
            onCheckedChange={() => toggleChannel(channel)}
          >
            {CHANNEL_DISPLAY_NAMES[channel]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
