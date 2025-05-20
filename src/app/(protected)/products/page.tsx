import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import ProductsPage from './ProductsPage'


export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.user?.id) return <div>No session</div>

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('created_by_user_id', session.user.id)
    .maybeSingle()

  if (!account) return <div>No account</div>

  return <ProductsPage accountId={account.id} companyName={account.name || 'Your Company'} />
}