import { supabase } from '@/lib/supabase-browser'

export async function getWarehouseInfo(accountId: string) {

  console.log('🔍 Fetching warehouse for accountId:', accountId)

  const { data, error } = await supabase
    .from('accounts')
    .select('name, address_line_1, address_line_2, city, state, zip_code, country')
    .eq('id', accountId)
    .single()

  if (error || !data) {
    console.error('🛑 Supabase error:', error)
    throw new Error('Warehouse not found')
  }

  return data
}