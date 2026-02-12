'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface ContentRow {
  id: string
  title: string
  channel: string
  publishedAt: string
  views: number
  likes: number
  comments: number
  engagementRate: number
  url?: string
}

interface ContentTableProps {
  title?: string
  data: ContentRow[]
  pageSize?: number
}

type SortField = 'publishedAt' | 'views' | 'likes' | 'comments' | 'engagementRate'
type SortDir = 'asc' | 'desc'

export function ContentTable({
  title = '콘텐츠 목록',
  data,
  pageSize = 10,
}: ContentTableProps) {
  const [sortField, setSortField] = useState<SortField>('views')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1" />
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium">제목</th>
                <th className="text-left py-2 px-2 font-medium">채널</th>
                <th
                  className="text-right py-2 px-2 font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSort('publishedAt')}
                >
                  게시일
                  <SortIcon field="publishedAt" />
                </th>
                <th
                  className="text-right py-2 px-2 font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSort('views')}
                >
                  조회수
                  <SortIcon field="views" />
                </th>
                <th
                  className="text-right py-2 px-2 font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSort('likes')}
                >
                  좋아요
                  <SortIcon field="likes" />
                </th>
                <th
                  className="text-right py-2 px-2 font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSort('engagementRate')}
                >
                  참여율
                  <SortIcon field="engagementRate" />
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    콘텐츠가 없습니다.
                  </td>
                </tr>
              )}
              {paginatedData.map((row) => (
                <tr key={row.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-2 max-w-[200px] truncate">{row.title}</td>
                  <td className="py-2 px-2">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-xs">
                      {row.channel}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    {row.publishedAt}
                  </td>
                  <td className="py-2 px-2 text-right">{formatNumber(row.views)}</td>
                  <td className="py-2 px-2 text-right">{formatNumber(row.likes)}</td>
                  <td className="py-2 px-2 text-right">{row.engagementRate.toFixed(1)}%</td>
                  <td className="py-2 px-2">
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              {data.length}개 중 {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.length)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
