import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          FlowReport
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px]">
          주간/월간 리포트를 자동으로 생성하고 관리하세요.
          GA4, Meta, YouTube 데이터를 한 곳에서 확인할 수 있습니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">시작하기</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">로그인</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
