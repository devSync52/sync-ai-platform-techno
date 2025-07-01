import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const role = searchParams.get('role') // 'client', 'admin', 'owner'

  let query = supabase.from('sellercloud_products').select('*')

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'Missing account_id' }), { status: 400 })
  }

  if (role === 'client') {
    query = query.eq('channel_id', accountId)
  } else {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[api/products] 🔥 Erro ao buscar produtos:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ products: data }), { status: 200 })
}