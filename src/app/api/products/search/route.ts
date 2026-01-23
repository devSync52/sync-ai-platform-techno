import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

function getAccountContextFromUser(user: any): { accountId: string | null; role: string | null } {
  const role = (user?.user_metadata as any)?.role ?? (user?.app_metadata as any)?.role ?? null

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
  if (callerAccountId === clientId) return true

  const elevated = new Set(['admin', 'superadmin', 'staff-admin'])
  if (!callerRole || !elevated.has(callerRole)) return false

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
    const clientIdParam = String(url.searchParams.get('clientId') ?? '').trim()
    const warehousePublicId = String(url.searchParams.get('warehouseId') ?? '').trim()
    const shipFromName = String(url.searchParams.get('shipFromName') ?? '').trim()
    const term = String(url.searchParams.get('term') ?? '').trim()

    if (!clientIdParam) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    if (!warehousePublicId) {
      return NextResponse.json({ error: 'Missing warehouseId' }, { status: 400 })
    }

    // Kept only for debugging/UI context
    const shipFromKey = String(shipFromName || '').trim().split(' ')[0] // e.g. "Miami"

    // Resolve to an effective client_account_id (scoped to this caller's parent account)
    let effectiveClientId = clientIdParam
    let clientIdResolvedFrom: 'client_account_id' | 'account_id' | 'unknown' = 'unknown'

    const { data: directClient, error: directClientErr } = await (supabase as any)
      .from('vw_products_master_enriched')
      .select('client_account_id, parent_account_id')
      .eq('client_account_id', clientIdParam)
      .eq('parent_account_id', callerAccountId)
      .limit(1)

    if (directClientErr) {
      return NextResponse.json({ error: directClientErr.message }, { status: 500 })
    }

    if (directClient && directClient.length > 0) {
      effectiveClientId = String((directClient[0] as any).client_account_id)
      clientIdResolvedFrom = 'client_account_id'
    } else {
      const { data: fromAccount, error: fromAccountErr } = await (supabase as any)
        .from('vw_products_master_enriched')
        .select('client_account_id, parent_account_id')
        .eq('account_id', clientIdParam)
        .eq('parent_account_id', callerAccountId)
        .limit(1)

      if (fromAccountErr) {
        return NextResponse.json({ error: fromAccountErr.message }, { status: 500 })
      }

      if (fromAccount && fromAccount.length > 0) {
        effectiveClientId = String((fromAccount[0] as any).client_account_id)
        clientIdResolvedFrom = 'account_id'
      }
    }

    if (!effectiveClientId) {
      return NextResponse.json({ error: 'Unable to resolve client context' }, { status: 400 })
    }

    const ok = await canAccessClientAccount(supabase, callerAccountId, callerRole, effectiveClientId)
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Map public warehouse id (draft) -> billing warehouse id (used by vw_products_master_enriched)
    const { data: whMap, error: whMapErr } = await (supabase as any)
      .from('v_warehouses')
      .select('public_warehouse_id, billing_warehouse_id, account_id, name')
      .eq('public_warehouse_id', warehousePublicId)
      .maybeSingle()

    if (whMapErr) {
      return NextResponse.json({ error: whMapErr.message }, { status: 500 })
    }

    const billingWarehouseId = String((whMap as any)?.billing_warehouse_id ?? '')
    if (!billingWarehouseId) {
      return NextResponse.json({ error: 'Warehouse mapping not found', warehousePublicId }, { status: 400 })
    }

    const whOwnerAccountId = String((whMap as any)?.account_id ?? '')
    if (whOwnerAccountId && whOwnerAccountId !== callerAccountId && whOwnerAccountId !== effectiveClientId) {
      return NextResponse.json({ error: 'Invalid warehouse for tenant' }, { status: 400 })
    }

    const candidateWarehouseIds = [billingWarehouseId]

    let query = (supabase as any)
      .from('vw_products_master_enriched')
      .select(
        'id, sku, description, pkg_weight_lb, pkg_length_in, pkg_width_in, pkg_height_in, available, on_hand, allocated, warehouse_id, inventory_warehouse_id, parent_account_id, account_id, client_account_id'
      )
      .eq('client_account_id', effectiveClientId)
      .eq('parent_account_id', callerAccountId)
      .or(
        `warehouse_id.in.(${candidateWarehouseIds.join(',')}),inventory_warehouse_id.in.(${candidateWarehouseIds.join(',')})`
      )
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
      shipFromKey,
      effectiveClientId,
      clientIdResolvedFrom,
      warehousePublicId,
      billingWarehouseId,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}