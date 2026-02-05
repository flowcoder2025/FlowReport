import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export default async function WorkspacesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              channelConnections: true,
              memberships: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  })

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">워크스페이스</h1>
          <p className="text-muted-foreground mt-1">
            리포트를 관리할 워크스페이스를 선택하세요
          </p>
        </div>
        <Link href="/workspaces/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 워크스페이스
          </Button>
        </Link>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              아직 워크스페이스가 없습니다
            </p>
            <Link href="/workspaces/new">
              <Button>첫 워크스페이스 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => (
            <Link
              key={membership.workspace.id}
              href={`/workspace/${membership.workspace.id}`}
            >
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{membership.workspace.name}</CardTitle>
                  <CardDescription>
                    {membership.workspace.description || '설명 없음'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>
                      {membership.workspace._count.channelConnections} 연동
                    </span>
                    <span>
                      {membership.workspace._count.memberships} 멤버
                    </span>
                    <span className="ml-auto font-medium">
                      {membership.role}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
