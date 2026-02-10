'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, TrendingUp, TrendingDown } from 'lucide-react'

interface ProductItem {
  rank: number
  name: string
  sales: number
  change: number
}

interface ProductRankingPlaceholderProps {
  title?: string
}

/**
 * 상품 순위 Placeholder
 *
 * 향후 상품별 판매 순위를 표시할 영역
 * 현재는 placeholder 데이터로 UI만 구현
 */
export function ProductRankingPlaceholder({
  title = '상품 판매 순위',
}: ProductRankingPlaceholderProps) {
  // Placeholder 데이터 (실제 연동 전까지 사용)
  const placeholderProducts: ProductItem[] = [
    { rank: 1, name: '상품 데이터 연동 대기중', sales: 0, change: 0 },
    { rank: 2, name: '상품 데이터 연동 대기중', sales: 0, change: 0 },
    { rank: 3, name: '상품 데이터 연동 대기중', sales: 0, change: 0 },
  ]

  const isPlaceholder = true // 실제 데이터 연동 시 false로 변경

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Package className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPlaceholder ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground mb-4">
              상품별 판매 데이터를 연동하면 순위가 표시됩니다.
            </div>
            {placeholderProducts.map((product) => (
              <div
                key={product.rank}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                  {product.rank}
                </span>
                <span className="flex-1 text-sm text-muted-foreground">
                  {product.name}
                </span>
                <span className="text-sm text-muted-foreground">-</span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                CSV 업로드 또는 스토어 API 연동으로 상품 데이터를 추가하세요.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {placeholderProducts.map((product) => (
              <div
                key={product.rank}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {product.rank}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {product.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(product.sales)}
                  </span>
                  {product.change !== 0 && (
                    <span
                      className={`flex items-center text-xs ${
                        product.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      )}
                      {Math.abs(product.change)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}
