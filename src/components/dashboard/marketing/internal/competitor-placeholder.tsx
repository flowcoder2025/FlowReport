'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, BarChart3, Lock, Sparkles } from 'lucide-react'

interface CompetitorPlaceholderProps {
  onRequestAccess?: () => void
}

export function CompetitorPlaceholder({ onRequestAccess }: CompetitorPlaceholderProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          경쟁사 비교 분석
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-xs font-medium text-purple-700">
            <Sparkles className="h-3 w-3" />
            Coming Soon
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Blurred Preview Content */}
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <CompetitorPreviewCard
                name="경쟁사 A"
                followers="125K"
                growth="+5.2%"
              />
              <CompetitorPreviewCard
                name="경쟁사 B"
                followers="89K"
                growth="+3.8%"
              />
              <CompetitorPreviewCard
                name="경쟁사 C"
                followers="203K"
                growth="+2.1%"
              />
            </div>

            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <BarChart3 className="h-24 w-24 text-muted-foreground/30" />
            </div>
          </div>

          {/* Overlay with CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background/60 via-background/80 to-background/60">
            <div className="text-center space-y-4 max-w-md px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  경쟁사 분석 기능 준비 중
                </h3>
                <p className="text-sm text-muted-foreground">
                  경쟁사의 SNS 채널 성과를 비교 분석하고,
                  <br />
                  시장 내 포지션을 파악할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <FeaturePreviewItem text="경쟁사 팔로워/구독자 추이 비교" />
                <FeaturePreviewItem text="콘텐츠 발행 빈도 및 참여율 분석" />
                <FeaturePreviewItem text="해시태그 및 키워드 트렌드" />
              </div>

              {onRequestAccess && (
                <Button
                  onClick={onRequestAccess}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  얼리 액세스 신청
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CompetitorPreviewCardProps {
  name: string
  followers: string
  growth: string
}

function CompetitorPreviewCard({ name, followers, growth }: CompetitorPreviewCardProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <span className="font-medium">{name}</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-lg font-bold">{followers}</span>
        <span className="text-sm text-green-600 flex items-center gap-0.5">
          <TrendingUp className="h-3 w-3" />
          {growth}
        </span>
      </div>
    </div>
  )
}

interface FeaturePreviewItemProps {
  text: string
}

function FeaturePreviewItem({ text }: FeaturePreviewItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
        <span className="text-purple-600 text-xs">&#10003;</span>
      </span>
      {text}
    </div>
  )
}
