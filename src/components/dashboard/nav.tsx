'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings } from 'lucide-react'

interface DashboardNavProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/workspaces" className="text-xl font-bold">
          FlowReport
        </Link>

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
