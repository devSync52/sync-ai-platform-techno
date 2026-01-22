import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

function getAccountContextFromUser(user: any): { accountId: string | null; role: string | null } {
  const role =
    (user?.user_metadata as any)?.role ??
    (user?.app_metadata as any)?.role ??
    null

  const accountId =
    (user?.app_metadata as any)?.parent_account_id ??
    (user?.user_metadata as any)?.parent_account_id ??
    (user?.app_metadata as any)?.account_id ??
    (user?.user_metadata as any)?.account_id ??
    null

  return { accountId: accountId ? String(accountId) : null, role: role ? String(role) : null }
}

async function canAccessClientAccount(
  supabase: any,
  callerAccountId: string,
  callerRole: string | null,
  clientId: string
): Promise<boolean> {
  // Se é o próprio tenant, ok
  if (callerAccountId === clientId) return true

  // Se não for admin/staff-admin/superadmin, nega
  const elevated = new Set(['admin', 'superadmin', 'staff-admin'])
  if (!callerRole || !elevated.has(callerRole)) return false

  // Checa se o clientId é filho do callerAccountId (accounts.parent_account_id)
  // (Se sua tabela/coluna tiver outro nome, ajusta aqui)
  const { data, error } = await supabase
    .from('accounts')
    .select('id, parent_account_id')
    .eq('id', clientId)
    .maybeSingle()

  if (error) return false
  if (!data) return false

  return String((data as any).parent_account_id ?? '') === callerAccountId
}

export async function GET(req: Request) {
  try {
    const cookieStore = (await cookies()) as any

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            try {
              ;(cookieStore as any).delete(name)
            } catch {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 })
            }
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId: callerAccountId, role: callerRole } = getAccountContextFromUser(user)
    if (!callerAccountId) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    const url = new URL(req.url)
    const clientId = String(url.searchParams.get('clientId') ?? '').trim()
    const warehouseId = String(url.searchParams.get('warehouseId') ?? '').trim()
    const shipFromName = String(url.searchParams.get('shipFromName') ?? '').trim()
    const term = String(url.searchParams.get('term') ?? '').trim()

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }
    if (!warehouseId) {
      return NextResponse.json({ error: 'Missing warehouseId' }, { status: 400 })
    }

    const ok = await canAccessClientAccount(supabase, callerAccountId, callerRole, clientId)
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Filter directly by warehouseId from the draft (avoid fragile name matching)
    const resolvedViewWarehouseId = warehouseId

    // Defense-in-depth: ensure the warehouse belongs to the requested client tenant
    // (avoid searching wrong-warehouse results).
    const { data: whCheck, error: whCheckErr } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', warehouseId)
      .eq('account_id', clientId)
      .maybeSingle()

    if (whCheckErr) {
      return NextResponse.json({ error: whCheckErr.message }, { status: 500 })
    }

    if (!whCheck) {
      return NextResponse.json({ error: 'Invalid warehouse for client' }, { status: 400 })
    }

    const shipFromKey = String(shipFromName || '').trim().split(' ')[0] // kept for debugging

    let query = (supabase as any)
      .from('vw_products_master_enriched')
      .select(
        'id, sku, description, pkg_weight_lb, pkg_length_in, pkg_width_in, pkg_height_in, available, on_hand, allocated, warehouse_id, inventory_warehouse_id, parent_account_id, account_id, client_account_id'
      )
      .eq('client_account_id', clientId)
      .eq('parent_account_id', callerAccountId)
      .eq('warehouse_id', resolvedViewWarehouseId)
      .limit(20)

    if (term.length > 0) {
      query = query.or(`sku.ilike.%${term}%,description.ilike.%${term}%`)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: data ?? [],
      resolvedViewWarehouseId,
      shipFromKey,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}