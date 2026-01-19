import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { redirect } from 'next/navigation'
import { PropsWithChildren, type CSSProperties } from 'react'
import { headers } from 'next/headers'
import ProtectedLayoutClient from './ProtectedLayoutClient'
import '@/styles/daypicker-custom.css'

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  //console.log('[Supabase Auth User]', user)

  if (!user) {
    redirect('/login')
  }

  let { data: userData } = await supabase
    .from('users')
    .select('name, email, role, account_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    const { data: insertedUser } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        role: 'staff-user',
        account_id: null, 
      })
      .select('name, email, role, account_id')
      .single()

    userData = insertedUser
  }

  const { data: accountData } = await supabase
    .from('accounts')
    .select('logo, template, "logo-main"')
    .eq('id', userData?.account_id)
    .single()

  // Buscar avatar individual do user (user_details)
  const { data: userDetails } = await supabase
    .from('user_details')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isOnboarding = pathname.startsWith('/protected/onboarding')

  const headerUser = {
    name: userData?.name ?? '—',
    email: userData?.email ?? user.email,
    role: userData?.role ?? 'client',
    avatarLetter: userData?.name?.charAt(0).toUpperCase() ?? 'U',
    avatarUrl: userDetails?.avatar_url ?? undefined,
    logoUrl: accountData?.logo ?? undefined,
    logoMain: (accountData as any)?.['logo-main'] ?? undefined,
  }

  const themeStyle = accountData?.template
    ? ({ ['--primary' as any]: accountData.template } as CSSProperties)
    : undefined

  return (
    <SupabaseProvider serverSession={null}>
      <div style={themeStyle}>
        <ProtectedLayoutClient user={headerUser} hideLayout={isOnboarding}>
          {children}
        </ProtectedLayoutClient>
      </div>
    </SupabaseProvider>
  )
}