import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { Toaster } from '@/components/ui/toaster'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <SupabaseProvider serverSession={session}>
      {children}
      <Toaster />
    </SupabaseProvider>
  )
}