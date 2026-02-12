'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: React.ReactNode
}

/**
 * NextAuth SessionProvider 래퍼
 *
 * useSession 훅 사용을 위한 Client Component Provider입니다.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
