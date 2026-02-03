import { createServerSupabaseClient } from '@/lib/supabase-server'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  return <OrdersClient userId={user.id} />
}