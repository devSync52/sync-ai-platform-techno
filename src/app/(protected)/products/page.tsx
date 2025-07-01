import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProductsPage from './ProductsPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) return <div>No session</div>

  // 🔍 Buscar account_id e role do usuário
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('account_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (userError || !userRecord?.account_id || !userRecord?.role) {
    console.error('❌ Failed to fetch user info', userError)
    return <div>Unable to load user data</div>
  }

  const accountId = userRecord.account_id
  const userRole = userRecord.role

  // 🔍 Buscar nome da empresa com base no account_id
  const { data: accountData, error: accountError } = await supabase
    .from('accounts')
    .select('name')
    .eq('id', accountId)
    .maybeSingle()

  if (accountError || !accountData?.name) {
    console.error('❌ Failed to fetch company name', accountError)
    return <div>Unable to load company name</div>
  }

  const companyName = accountData.name

  return (
    <ProductsPage
      accountId={accountId}
      companyName={companyName}
      userRole={userRole}
    />
  )
}