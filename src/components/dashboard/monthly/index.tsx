'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PeriodSelector } from '../period-selector'
import { SummaryTab } from './summary-tab'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Construction } from 'lucide-react'
import { format } from 'date-fns'
import { generateAndDownloadPNG } from '@/lib/export/png-generator'
import { useToast } from '@/lib/hooks/use-toast'

interface MonthlyDashboardProps {
  workspaceId: string
}

export function MonthlyDashboard({ workspaceId }: MonthlyDashboardProps) {
  const [periodStart, setPeriodStart] = useState(() => new Date())
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const { toast } = useToast()

  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true)
    try {
      const period = format(periodStart, 'yyyy-MM')
      const response = await fetch(
        `/api/exports/pdf?workspaceId=${workspaceId}&period=${period}`
      )

      if (!response.ok) {
        throw new Error('PDF export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `monthly-report-${period}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: 'PDF 내보내기 실패',
        description: error instanceof Error ? error.message : 'PDF 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsExportingPDF(false)
    }
  }, [workspaceId, periodStart, toast])

  const handleExportPNG = async () => {
    const filename = `monthly-report-${format(periodStart, 'yyyy-MM')}.png`
    await generateAndDownloadPNG('monthly-summary', filename)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">월간 리포트</h2>
          <PeriodSelector
            periodType="MONTHLY"
            periodStart={periodStart}
            onPeriodChange={setPeriodStart}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPNG}>
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button onClick={handleExportPDF} disabled={isExportingPDF}>
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExportingPDF ? '생성 중...' : 'PDF'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">1pg 요약</TabsTrigger>
          <TabsTrigger value="keyword">키워드</TabsTrigger>
          <TabsTrigger value="sns">SNS</TabsTrigger>
          <TabsTrigger value="blog">블로그</TabsTrigger>
          <TabsTrigger value="store">스토어</TabsTrigger>
          <TabsTrigger value="plan">익월 계획</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab workspaceId={workspaceId} periodStart={periodStart} />
        </TabsContent>

        <TabsContent value="keyword">
          <Card>
            <CardContent className="pt-6">
              <UnimplementedTabPlaceholder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sns">
          <Card>
            <CardContent className="pt-6">
              <UnimplementedTabPlaceholder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardContent className="pt-6">
              <UnimplementedTabPlaceholder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store">
          <Card>
            <CardContent className="pt-6">
              <UnimplementedTabPlaceholder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardContent className="pt-6">
              <UnimplementedTabPlaceholder />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UnimplementedTabPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Construction className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">준비 중인 기능입니다</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        곧 업데이트될 예정입니다
      </p>
    </div>
  )
}
