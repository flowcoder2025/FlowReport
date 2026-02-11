'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { useDashboardProducts, ProductRankingItem } from '@/lib/hooks/use-dashboard-data'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { Skeleton } from '../../skeleton'

interface ProductRankingProps {
  title?: string
  limit?: number
}

/**
 * 상품 판매 순위 TOP 5
 *
 * 상품별 판매 데이터를 표시
 * - 데이터 있을 때: 실제 순위 표시
 * - 데이터 없을 때: placeholder 안내
 */
export function ProductRanking({
  title = '상품 판매 순위 (TOP 5)',
  limit = 5,
}: ProductRankingProps) {
  const { workspaceId, periodType, periodStart } = useDashboardContext()

  const { data, isLoading, error } = useDashboardProducts(
    workspaceId,
    periodType,
    periodStart,
    limit
  )

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
          <div className="text-sm text-muted-foreground">
            데이터를 불러오는데 실패했습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  const products = data?.products ?? []
  const hasData = products.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Package className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {products.map((product, index) => (
              <ProductRow key={product.id} product={product} rank={index + 1} />
            ))}
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
          {product.channel === 'SMARTSTORE' ? '스마트스토어' : '쿠팡'} ·{' '}
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}
