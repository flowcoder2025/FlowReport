import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatNumber, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | null
  previousValue?: number | null
  format?: 'number' | 'currency' | 'percent'
  naReason?: string
}

export function KPICard({
  title,
  value,
  previousValue,
  format = 'number',
  naReason,
}: KPICardProps) {
  // N/A case
  if (value === null || naReason) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">N/A</div>
          {naReason && (
            <p className="text-xs text-muted-foreground">{getNAReasonText(naReason)}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const change =
    previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null
  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0

  const formatValue = (v: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW',
          maximumFractionDigits: 0,
        }).format(v)
      case 'percent':
        return `${v.toFixed(1)}%`
      default:
        return formatNumber(v)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change !== null && (
          <div
            className={cn(
              'flex items-center text-xs mt-1',
              isPositive && 'text-green-600',
              isNegative && 'text-red-600',
              !isPositive && !isNegative && 'text-muted-foreground'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <Minus className="h-3 w-3 mr-1" />
            )}
            {formatPercent(change)} vs 전기
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getNAReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    NOT_PROVIDED_BY_CHANNEL: '채널에서 제공하지 않음',
    NOT_CONNECTED: '연동되지 않음',
    NOT_UPLOADED: 'CSV 미업로드',
    NOT_APPLICABLE: '해당 없음',
  }
  return reasonMap[reason] || reason
}
