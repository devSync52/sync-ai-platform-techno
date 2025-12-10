import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const role = searchParams.get('role') // 'client', 'admin', 'owner', 'staff-client'

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'Missing account_id' }), { status: 400 })
  }

  // base query on the view
  let baseQuery = supabase.from('vw_products_master_enriched').select('*')

  if (role === 'client' || role === 'staff-client') {
    // client vê apenas os produtos da própria conta (account_id da view)
    baseQuery = baseQuery.eq('account_id', accountId)
  } else {
    // admin/owner vê todos os produtos relacionados a esse tenant:
    // tanto os que batem no parent_account_id quanto os que batem no account_id
    baseQuery = baseQuery.or(
      `parent_account_id.eq.${accountId},account_id.eq.${accountId}`
    )
  }

  const PAGE_SIZE = 1000
  let from = 0
  let all: any[] = []

  while (true) {
    const { data, error } = await baseQuery.range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('[api/products] 🔥 Erro ao buscar produtos (paginado):', error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    if (!data || data.length === 0) {
      break
    }

    all = all.concat(data)

    if (data.length < PAGE_SIZE) {
      // última página
      break
    }

    from += PAGE_SIZE
  }

  return new Response(JSON.stringify({ products: all }), { status: 200 })
}