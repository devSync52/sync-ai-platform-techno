import { createServerSupabaseClient } from '@/lib/supabase-server'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  if (!user) {
    throw new Error('User not authenticated')
  }

  return <OrdersClient userId={user.id} />
}