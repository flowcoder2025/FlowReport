'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, ChevronDown, Building2 } from 'lucide-react'

interface Workspace {
  id: string
  name: string
}

interface DashboardNavProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardNav({ user }: DashboardNavProps) {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params?.workspaceId as string | undefined

  const { data: workspacesData } = useSWR<{ workspaces: Workspace[] }>(
    '/api/workspaces',
    fetcher
  )
  const workspaces = workspacesData?.workspaces || []
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId)

  const handleWorkspaceChange = (id: string) => {
    router.push(`/workspaces/${id}`)
  }

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/workspaces" className="text-xl font-bold">
            FlowReport
          </Link>

          {workspaceId && workspaces.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4" />
                  <span>{currentWorkspace?.name || '워크스페이스'}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleWorkspaceChange(workspace.id)}
                    className={workspace.id === workspaceId ? 'bg-muted' : ''}
                  >
                    {workspace.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/workspaces">모든 워크스페이스 보기</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="hidden md:inline">{user.name || user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
