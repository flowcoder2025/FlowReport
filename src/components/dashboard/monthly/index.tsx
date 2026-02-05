'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SummaryTab } from './summary-tab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface MonthlyDashboardProps {
  workspaceId: string
}

export function MonthlyDashboard({ workspaceId }: MonthlyDashboardProps) {
  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export PDF')
  }

  const handleExportPNG = () => {
    // TODO: Implement PNG export
    console.log('Export PNG')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleExportPNG}>
          <Download className="h-4 w-4 mr-2" />
          PNG
        </Button>
        <Button onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">1pg 요약</TabsTrigger>
          <TabsTrigger value="keyword">키워드</TabsTrigger>
          <TabsTrigger value="sns">SNS</TabsTrigger>
          <TabsTrigger value="blog">블로그</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="plan">익월 계획</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="keyword">
          <Card>
            <CardHeader>
              <CardTitle>키워드 성과</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                키워드 데이터를 CSV로 업로드하거나 Google Search Console을 연동하세요.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sns">
          <Card>
            <CardHeader>
              <CardTitle>SNS 상세</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                월간 SNS 성과 상세 데이터가 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>블로그</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                블로그 데이터를 CSV로 업로드하세요.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store 상세</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                월간 스토어 성과 상세 데이터가 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardHeader>
              <CardTitle>익월 반영사항 및 계획</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">목표</h4>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="익월 목표를 입력하세요..."
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">실행 항목</h4>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="실행 계획을 입력하세요..."
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">리스크</h4>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="예상되는 리스크를 입력하세요..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
