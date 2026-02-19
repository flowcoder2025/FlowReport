'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label,
} from 'recharts'
import { TrendingUp, Info } from 'lucide-react'
import { ChannelProvider } from '@prisma/client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils/format'
import { CHANNEL_COLORS } from '@/constants'
import type { SelectedMetric } from './metric-selector'
import type { RawMetricData } from './data-explorer'

interface CorrelationChartProps {
  data: RawMetricData[]
  selectedMetrics: SelectedMetric[]
  height?: number
}

interface ScatterDataPoint {
  x: number
  y: number
  channel: ChannelProvider
  channelName: string
  date: string
}

/**
 * Pearson 상관계수 계산
 * r = Σ((xi - x̄)(yi - ȳ)) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)
 */
function calculateCorrelation(xValues: number[], yValues: number[]): number {
  if (xValues.length !== yValues.length || xValues.length < 2) {
    return 0
  }

  const n = xValues.length
  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const meanX = sumX / n
  const meanY = sumY / n

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (let i = 0; i < n; i++) {
    const diffX = xValues[i] - meanX
    const diffY = yValues[i] - meanY
    numerator += diffX * diffY
    sumSqX += diffX * diffX
    sumSqY += diffY * diffY
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)

  if (denominator === 0) {
    return 0
  }

  return numerator / denominator
}

/**
 * 선형 회귀 계산 (최소제곱법)
 * y = mx + b
 */
function calculateLinearRegression(
  xValues: number[],
  yValues: number[]
): { slope: number; intercept: number } {
  if (xValues.length !== yValues.length || xValues.length < 2) {
    return { slope: 0, intercept: 0 }
  }

  const n = xValues.length
  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0)
  const sumXX = xValues.reduce((acc, x) => acc + x * x, 0)

  const denominator = n * sumXX - sumX * sumX

  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n }
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

/**
 * 상관관계 강도 해석
 */
function interpretCorrelation(r: number): {
  strength: string
  description: string
  color: string
} {
  const absR = Math.abs(r)

  if (absR >= 0.8) {
    return {
      strength: '매우 강함',
      description: r > 0 ? '강한 양의 상관관계' : '강한 음의 상관관계',
      color: r > 0 ? 'text-green-600' : 'text-red-600',
    }
  }
  if (absR >= 0.6) {
    return {
      strength: '강함',
      description: r > 0 ? '양의 상관관계' : '음의 상관관계',
      color: r > 0 ? 'text-green-500' : 'text-red-500',
    }
  }
  if (absR >= 0.4) {
    return {
      strength: '보통',
      description: r > 0 ? '약한 양의 상관관계' : '약한 음의 상관관계',
      color: r > 0 ? 'text-yellow-600' : 'text-orange-500',
    }
  }
  if (absR >= 0.2) {
    return {
      strength: '약함',
      description: r > 0 ? '미약한 양의 상관관계' : '미약한 음의 상관관계',
      color: 'text-gray-500',
    }
  }
  return {
    strength: '없음',
    description: '상관관계 없음',
    color: 'text-gray-400',
  }
}

export function CorrelationChart({
  data,
  selectedMetrics,
  height = 300,
}: CorrelationChartProps) {
  // 기본 X/Y 축 메트릭 설정 (선택된 메트릭 중 첫 번째, 두 번째)
  const [xMetricKey, setXMetricKey] = useState<string>(
    selectedMetrics[0]?.key || ''
  )
  const [yMetricKey, setYMetricKey] = useState<string>(
    selectedMetrics[1]?.key || ''
  )

  // 선택된 메트릭이 변경되면 축 메트릭도 업데이트
  useEffect(() => {
    if (selectedMetrics.length >= 2) {
      if (!selectedMetrics.find((m) => m.key === xMetricKey)) {
        setXMetricKey(selectedMetrics[0].key)
      }
      if (!selectedMetrics.find((m) => m.key === yMetricKey)) {
        setYMetricKey(selectedMetrics[1].key)
      }
    }
  }, [selectedMetrics]) // eslint-disable-line react-hooks/exhaustive-deps

  const xMetric = selectedMetrics.find((m) => m.key === xMetricKey)
  const yMetric = selectedMetrics.find((m) => m.key === yMetricKey)

  // 산점도 데이터 생성
  const scatterData = useMemo<ScatterDataPoint[]>(() => {
    if (!xMetric || !yMetric || !data || data.length === 0) {
      return []
    }

    return data
      .filter((row) => {
        const xVal = row[xMetricKey]
        const yVal = row[yMetricKey]
        return (
          typeof xVal === 'number' &&
          typeof yVal === 'number' &&
          !isNaN(xVal) &&
          !isNaN(yVal)
        )
      })
      .map((row) => ({
        x: row[xMetricKey] as number,
        y: row[yMetricKey] as number,
        channel: row.channel,
        channelName: row.channelName,
        date: row.date,
      }))
  }, [data, xMetricKey, yMetricKey, xMetric, yMetric])

  // 상관계수 및 회귀선 계산
  const { correlation, rSquared, sampleSize, regression, interpretation } = useMemo(() => {
    if (scatterData.length < 2) {
      return {
        correlation: 0,
        rSquared: 0,
        sampleSize: scatterData.length,
        regression: { slope: 0, intercept: 0 },
        interpretation: interpretCorrelation(0),
      }
    }

    const xValues = scatterData.map((d) => d.x)
    const yValues = scatterData.map((d) => d.y)

    const r = calculateCorrelation(xValues, yValues)
    const reg = calculateLinearRegression(xValues, yValues)

    return {
      correlation: r,
      rSquared: r * r,
      sampleSize: scatterData.length,
      regression: reg,
      interpretation: interpretCorrelation(r),
    }
  }, [scatterData])

  // 추세선 시작점과 끝점 계산
  const trendLinePoints = useMemo(() => {
    if (scatterData.length < 2) return null

    const xValues = scatterData.map((d) => d.x)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)

    return {
      x1: minX,
      y1: regression.slope * minX + regression.intercept,
      x2: maxX,
      y2: regression.slope * maxX + regression.intercept,
    }
  }, [scatterData, regression])

  // 메트릭이 2개 미만인 경우
  if (selectedMetrics.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            2개 이상의 메트릭을 선택하면 상관관계 차트가 표시됩니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 축 선택 드롭다운 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">X축:</span>
          <Select value={xMetricKey} onValueChange={setXMetricKey}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="메트릭 선택" />
            </SelectTrigger>
            <SelectContent>
              {selectedMetrics.map((metric) => (
                <SelectItem
                  key={metric.key}
                  value={metric.key}
                  disabled={metric.key === yMetricKey}
                >
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Y축:</span>
          <Select value={yMetricKey} onValueChange={setYMetricKey}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="메트릭 선택" />
            </SelectTrigger>
            <SelectContent>
              {selectedMetrics.map((metric) => (
                <SelectItem
                  key={metric.key}
                  value={metric.key}
                  disabled={metric.key === xMetricKey}
                >
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 상관계수 표시 */}
        <div className="ml-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            r ={' '}
            <span className={cn('font-bold', interpretation.color)}>
              {correlation.toFixed(3)}
            </span>
          </span>
          <span className="text-sm text-muted-foreground">|</span>
          <span className="text-sm">
            R&sup2; = <span className="font-semibold">{rSquared.toFixed(3)}</span>
          </span>
          <span className="text-sm text-muted-foreground">|</span>
          <span className="text-sm">
            n = <span className="font-semibold">{sampleSize}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            ({interpretation.description})
          </span>
        </div>
      </div>

      {/* 산점도 차트 */}
      {scatterData.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="x"
              name={xMetric?.label || 'X'}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
            >
              <Label
                value={xMetric?.label || 'X'}
                offset={-10}
                position="insideBottom"
                style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              name={yMetric?.label || 'Y'}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
            >
              <Label
                value={yMetric?.label || 'Y'}
                angle={-90}
                position="insideLeft"
                style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
            </YAxis>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string) => [
                formatNumber(value),
                name === 'x' ? xMetric?.label : yMetric?.label,
              ]}
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  const point = payload[0].payload as ScatterDataPoint
                  return `${point.channelName} (${point.date})`
                }
                return ''
              }}
            />

            {/* 추세선 */}
            {trendLinePoints && (
              <ReferenceLine
                segment={[
                  { x: trendLinePoints.x1, y: trendLinePoints.y1 },
                  { x: trendLinePoints.x2, y: trendLinePoints.y2 },
                ]}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                ifOverflow="extendDomain"
              />
            )}

            <Scatter data={scatterData} fill="#8884d8">
              {scatterData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHANNEL_COLORS[entry.channel] || '#8884d8'}
                  fillOpacity={0.7}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <div
          className="flex items-center justify-center rounded-lg border border-dashed bg-muted/50"
          style={{ height }}
        >
          <span className="text-muted-foreground">
            선택한 메트릭의 데이터가 없습니다
          </span>
        </div>
      )}

      {/* 채널별 범례 */}
      {scatterData.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground">채널:</span>
          {Array.from(new Set(scatterData.map((d) => d.channel))).map(
            (channel) => {
              const point = scatterData.find((d) => d.channel === channel)
              return (
                <div key={channel} className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHANNEL_COLORS[channel] }}
                  />
                  <span>{point?.channelName || channel}</span>
                </div>
              )
            }
          )}
          <span className="ml-2 text-muted-foreground">|</span>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-primary" />
            <span className="text-muted-foreground">추세선</span>
          </div>
        </div>
      )}
    </div>
  )
}
