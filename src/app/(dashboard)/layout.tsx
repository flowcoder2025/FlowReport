import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/nav'
import { SWRProvider } from '@/components/providers/swr-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <SWRProvider>
      <div className="min-h-screen bg-white">
        <DashboardNav user={session.user} />
        <main>{children}</main>
      </div>
    </SWRProvider>
  )
}
