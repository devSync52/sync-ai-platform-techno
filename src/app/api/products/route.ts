import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const role = searchParams.get('role') // 'client', 'admin', 'owner', 'staff-client'
  const sourceParam = searchParams.get('source')?.trim().toLowerCase()

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'Missing account_id' }), { status: 400 })
  }

  // base query on the view
  let baseQuery =
    sourceParam === 'sellercloud'
      ? supabase.from('sellercloud_products').select('*')
      : supabase.from('vw_products_master_enriched').select('*')

  if (role === 'client' || role === 'staff-client') {
    // client vê apenas os produtos da própria conta (account_id da view)
    baseQuery = baseQuery.eq('account_id', accountId)
  } else {
    // admin/owner vê todos os produtos relacionados a esse tenant:
    // tanto os que batem no parent_account_id quanto os que batem no account_id
    baseQuery =
      sourceParam === 'sellercloud'
        ? baseQuery.eq('account_id', accountId)
        : baseQuery.or(`parent_account_id.eq.${accountId},account_id.eq.${accountId}`)
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

  const products =
    sourceParam === 'sellercloud'
      ? all.map((row: any) => ({
          // Normalize to match ProductList UI expectations
          id: row.id,
          parent_account_id: row.account_id ?? '',
          client_account_id: row.account_id ?? '',
          sku: row.sku ?? '',
          upc: row.upc ?? null,
          description: row.description ?? row.name ?? null,
          uom: null,
          pkg_length_in: null,
          pkg_width_in: null,
          pkg_height_in: null,
          pkg_weight_lb: row.weight ?? row.shipping_weight ?? row.package_weight_lbs ?? null,
          volume_cuft: null,
          track_serial: false,
          has_item_storage_rate: false,
          product_source: 'sellercloud',
          source_item_id: row.external_id ?? null,
          created_at: row.created_at ?? '',
          updated_at: row.updated_at ?? '',
          carton_units: null,
          is_wrapping: false,
          client_id: row.account_id ?? '',
          client_name: row.company_name ?? '',
          client_source: 'sellercloud',
          wms_customer_id: '',
          client_is_active: true,
          warehouse_id: '',
          billing_method: null,
          external_ids: null,
          account_id: row.account_id ?? '',
          account_name: row.company_name ?? '',
          account_external_id: row.company_id ? String(row.company_id) : null,
          account_source: 'sellercloud',
          account_status: row.is_active === false ? 'inactive' : 'active',
          image_url: row.image_url ?? null,
          quantity_available: row.quantity_available ?? null,
          quantity_physical: row.quantity_physical ?? null,
          site_price: row.site_price ?? row.price ?? null,
          available: row.quantity_available ?? null,
          on_hold: null,
          warehouse_name: row.warehouse_name ?? '',
        }))
      : all

  // Fetch available integration sources for the account to drive UI filters
  const { data: integrations, error: integrationsError } = await supabase
    .from('account_integrations')
    .select('type')
    .eq('account_id', accountId)

  if (integrationsError) {
    console.error('[api/products] ⚠️ Failed to fetch account integrations:', integrationsError.message)
  }

  const sources = Array.from(
    new Set(
      (integrations || [])
        .map((row: any) => String(row?.type ?? '').trim().toLowerCase())
        .filter(Boolean)
    )
  )

  return new Response(JSON.stringify({ products, sources }), { status: 200 })
}
