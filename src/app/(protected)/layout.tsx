import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { redirect } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { headers } from 'next/headers'
import ProtectedLayoutClient from './ProtectedLayoutClient'

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
    .select('name, email, role, logo_url')
    .eq('id', user.id)
    .single()

  const { data: userDetails } = await supabase
    .from('user_details')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isOnboarding = pathname.startsWith('/onboarding')

  const headerUser = {
    name: userData?.name ?? '—',
    email: userData?.email ?? user.email,
    role: userData?.role ?? 'client',
    avatarLetter: userData?.name?.charAt(0).toUpperCase() ?? 'U',
    avatarUrl: userDetails?.avatar_url ?? undefined,
  }

  return (
    <SupabaseProvider serverSession={null}>
      <ProtectedLayoutClient user={headerUser} hideLayout={isOnboarding}>
        {children}
      </ProtectedLayoutClient>
    </SupabaseProvider>
  )
}