'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, TrendingUp, TrendingDown, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useDashboardProducts, ProductRankingItem } from '@/lib/hooks/use-dashboard-data'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { Skeleton } from '../../skeleton'
import { CHANNEL_LABELS } from '@/constants'
import { ErrorState } from '@/components/common'
import { formatCurrency } from '@/lib/utils/format'

type SortKey = 'revenue' | 'units' | 'change'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'revenue', label: '매출순' },
  { key: 'units', label: '판매수량순' },
  { key: 'change', label: '변화율순' },
]

const CHANNEL_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'SMARTSTORE', label: CHANNEL_LABELS.SMARTSTORE },
  { value: 'COUPANG', label: CHANNEL_LABELS.COUPANG },
]

interface ProductRankingProps {
  title?: string
  limit?: number
}

/**
 * 상품 판매 순위
 *
 * 상품별 판매 데이터를 표시
 * - 데이터 있을 때: 실제 순위 표시 (기본 TOP 5, 더보기 가능)
 * - 데이터 없을 때: placeholder 안내
 * - 채널 필터: 전체/스마트스토어/쿠팡
 * - 정렬: 매출순/판매수량순/변화율순
 */
export function ProductRanking({
  title = '상품 판매 순위',
  limit = 5,
}: ProductRankingProps) {
  const { workspaceId, periodType, periodStart } = useDashboardContext()
  const [showAll, setShowAll] = useState(false)
  const [channelFilter, setChannelFilter] = useState<string>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('revenue')

  // Fetch enough data to support "show all" - request higher limit
  const { data, isLoading, error } = useDashboardProducts(
    workspaceId,
    periodType,
    periodStart,
    50
  )

  const products = data?.products ?? []

  // Apply channel filter
  const filteredProducts = useMemo(() => {
    if (channelFilter === 'ALL') return products
    return products.filter((p) => p.channel === channelFilter)
  }, [products, channelFilter])

  // Apply sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortKey) {
        case 'revenue':
          return b.revenue - a.revenue
        case 'units':
          return b.units - a.units
        case 'change':
          return (b.change ?? -Infinity) - (a.change ?? -Infinity)
        default:
          return 0
      }
    })
  }, [filteredProducts, sortKey])

  // Apply limit unless showAll
  const displayProducts = showAll ? sortedProducts : sortedProducts.slice(0, limit)
  const hasMore = sortedProducts.length > limit
  const hasData = products.length > 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Package className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Package className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Package className="h-4 w-4" />
          {title}
        </CardTitle>
        {hasData && (
          <div className="flex items-center gap-2 mt-2">
            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-background text-foreground"
            >
              {CHANNEL_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Sort options */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="text-xs border rounded px-2 py-1 bg-background text-foreground"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {displayProducts.map((product, index) => (
              <ProductRow key={product.id} product={product} rank={index + 1} />
            ))}
            {/* Show more / show less toggle */}
            {hasMore && (
              <button
                onClick={() => setShowAll((prev) => !prev)}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border-t mt-2 pt-3"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    더보기 ({sortedProducts.length - limit}개 더)
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <ProductPlaceholder />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 상품 행 컴포넌트
 */
function ProductRow({
  product,
  rank,
}: {
  product: ProductRankingItem
  rank: number
}) {
  const isPositive = product.change !== null && product.change > 0
  const isNegative = product.change !== null && product.change < 0

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {/* 순위 */}
      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
          rank <= 3
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {rank}
      </span>

      {/* 상품 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium truncate">{product.name}</span>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {CHANNEL_LABELS[product.channel as keyof typeof CHANNEL_LABELS] || product.channel} ·{' '}
          {product.units.toLocaleString()}개 판매
        </div>
      </div>

      {/* 판매액 & 변화율 */}
      <div className="text-right">
        <span className="text-sm font-medium">
          {formatCurrency(product.revenue)}
        </span>
        {product.change !== null && (
          <div
            className={`flex items-center justify-end text-xs ${
              isPositive
                ? 'text-green-600'
                : isNegative
                  ? 'text-red-600'
                  : 'text-muted-foreground'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            ) : null}
            {isPositive ? '+' : ''}
            {product.change.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 데이터 없을 때 placeholder
 */
function ProductPlaceholder() {
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-4">
        상품별 판매 데이터를 연동하면 순위가 표시됩니다.
      </div>
      {[1, 2, 3].map((rank) => (
        <div
          key={rank}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
            {rank}
          </span>
          <span className="flex-1 text-sm text-muted-foreground">
            상품 데이터 연동 대기중
          </span>
          <span className="text-sm text-muted-foreground">-</span>
        </div>
      ))}
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          CSV 업로드 시 product_id, product_name, sales_count, sales_amount
          컬럼을 포함하세요.
        </p>
      </div>
    </div>
  )
}

