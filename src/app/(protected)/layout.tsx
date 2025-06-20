import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { redirect } from 'next/navigation'
import { PropsWithChildren } from 'react'
import Sidebar from '@/components/sidebar'
import HeaderTopBar from '@/components/HeaderTopBar'
import AIChatWidget from '@/components/ai/AIChatWidget'

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('name, email, role')
    .eq('id', user.id)
    .single()

  const headerUser = {
    name: userData?.name ?? '—',
    email: userData?.email ?? user.email,
    role: userData?.role ?? 'client',
    avatarLetter: userData?.name?.charAt(0).toUpperCase() ?? 'U',
  }

  return (
    <SupabaseProvider serverSession={null}>
      <div className="flex h-screen">
        <aside className="hidden lg:block w-64">
          <Sidebar />
        </aside>
        <div className="flex-1 flex flex-col">
          <HeaderTopBar title="Dashboard" user={headerUser} />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
            <AIChatWidget />
          </main>
        </div>
      </div>
    </SupabaseProvider>
  )
}