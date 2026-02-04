import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function assertUuid(value: string, label: string) {
  if (!UUID_RE.test(value)) {
    throw new Error(`Invalid ${label}`)
  }
}

function getAccountContextFromUser(user: any): { accountId: string | null; role: string | null } {
  const role = (user?.user_metadata as any)?.role ?? (user?.app_metadata as any)?.role ?? null

  // Our JWT stores the signed-in user's account id in user_metadata.account_id
  const accountId =
    (user?.user_metadata as any)?.account_id ??
    (user?.app_metadata as any)?.account_id ??
    null

  return { accountId: accountId ? String(accountId) : null, role: role ? String(role) : null }
}

async function canAccessClientAccount(
  supabase: any,
  callerAccountId: string,
  callerRole: string | null,
  targetAccountId: string
): Promise<boolean> {
  // Non-elevated users (client/staff-client/etc) can only access their own account.
  if (callerAccountId === targetAccountId) return true

  const elevated = new Set(['admin', 'superadmin', 'staff-admin'])
  if (!callerRole || !elevated.has(callerRole)) return false

  // Elevated users can access accounts in their tenant (i.e., accounts whose parent_account_id = callerAccountId).
  const { data, error } = await supabase
    .from('accounts')
    .select('id, parent_account_id')
    .eq('id', targetAccountId)
    .maybeSingle()

  if (error || !data) return false

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

    // Debug: list cookie names (do not log values) and auth context seen by Postgres
    try {
      const cookieNames = (cookieStore.getAll?.() ?? []).map((c: any) => c?.name).filter(Boolean)
      console.log('[products.search][cookies]', { count: cookieNames.length, names: cookieNames })
    } catch {
      console.log('[products.search][cookies]', { error: 'unable to list cookies' })
    }

    try {
      const dbg = await (supabase as any).rpc('debug_auth_context')
      console.log('[products.search][auth]', dbg)
    } catch (e) {
      console.log('[products.search][auth]', { error: (e as any)?.message ?? 'debug_auth_context failed' })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const dbg2 = await (supabase as any).rpc('debug_auth_context')
      console.log('[products.search][auth][after_getUser]', dbg2)
    } catch (e) {
      console.log('[products.search][auth][after_getUser]', { error: (e as any)?.message ?? 'debug_auth_context failed' })
    }

    const { accountId: callerAccountId, role: callerRole } = getAccountContextFromUser(user)
    if (!callerAccountId) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    // Tenant parent account id: for client users, data is scoped by their parent account.
    // If the caller is a parent account, parent_account_id will be null and we fall back to callerAccountId.
    let tenantParentAccountId: string = callerAccountId
    try {
      const { data: callerAcct, error: callerAcctErr } = await (supabase as any)
        .from('accounts')
        .select('parent_account_id')
        .eq('id', callerAccountId)
        .maybeSingle()

      if (!callerAcctErr && callerAcct && (callerAcct as any).parent_account_id) {
        tenantParentAccountId = String((callerAcct as any).parent_account_id)
      }
    } catch {
      // ignore
    }

    console.log('[products.search][tenant]', {
      callerAccountId,
      tenantParentAccountId,
    })

    const url = new URL(req.url)
    const clientIdParam = String(url.searchParams.get('clientId') ?? '').trim()
    const warehousePublicId = String(url.searchParams.get('warehouseId') ?? '').trim()
    const shipFromName = String(url.searchParams.get('shipFromName') ?? '').trim()
    const term = String(url.searchParams.get('term') ?? '').trim()

    console.log('[products.search][request]', {
      clientIdParam,
      warehousePublicId,
      shipFromName,
      term,
      callerAccountId,
      callerRole,
    })

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
      .eq('parent_account_id', tenantParentAccountId)
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
        .eq('parent_account_id', tenantParentAccountId)
        .limit(1)

      if (fromAccountErr) {
        return NextResponse.json({ error: fromAccountErr.message }, { status: 500 })
      }

      if (fromAccount && fromAccount.length > 0) {
        effectiveClientId = String((fromAccount[0] as any).client_account_id)
        clientIdResolvedFrom = 'account_id'
      }
    }

    console.log('[products.search][client-resolution]', {
      clientIdParam,
      effectiveClientId,
      clientIdResolvedFrom,
    })

    if (!effectiveClientId) {
      return NextResponse.json({ error: 'Unable to resolve client context' }, { status: 400 })
    }

    const ok = await canAccessClientAccount(supabase, callerAccountId, callerRole, clientIdParam)
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Warehouses are typically owned by the tenant parent account.
    const callerParentAccountId: string | null = tenantParentAccountId !== callerAccountId ? tenantParentAccountId : null

    // Scope the mapping to this tenant: either owned by the caller account or by the caller's parent account.
    const ownerIds = [callerAccountId, tenantParentAccountId].filter(Boolean) as string[]

    const { data: whMap, error: whMapErr } = await (supabase as any)
      .from('v_warehouses')
      .select('public_warehouse_id, billing_warehouse_id, account_id, name')
      .eq('public_warehouse_id', warehousePublicId)
      .in('account_id', ownerIds)
      .maybeSingle()

    if (whMapErr) {
      return NextResponse.json({ error: whMapErr.message }, { status: 500 })
    }

    const billingWarehouseId = String((whMap as any)?.billing_warehouse_id ?? '')
    if (!billingWarehouseId) {
      return NextResponse.json({ error: 'Warehouse mapping not found', warehousePublicId }, { status: 400 })
    }

    const whOwnerAccountId = String((whMap as any)?.account_id ?? '')
    const allowedWarehouseOwners = new Set([callerAccountId, clientIdParam, tenantParentAccountId].filter(Boolean) as string[])
    if (whOwnerAccountId && !allowedWarehouseOwners.has(whOwnerAccountId)) {
      return NextResponse.json({
        error: 'Invalid warehouse for tenant',
        details: {
          whOwnerAccountId,
          callerAccountId,
          callerParentAccountId,
          effectiveClientId,
          warehousePublicId,
        },
      }, { status: 400 })
    }

    console.log('[products.search][warehouse]', {
      warehousePublicId,
      billingWarehouseId,
      whOwnerAccountId,
      ownerIds,
    })

    const selectCols =
      'id, sku, description, pkg_weight_lb, pkg_length_in, pkg_width_in, pkg_height_in, available, on_hand, allocated, warehouse_id, inventory_warehouse_id, parent_account_id, account_id, client_account_id'

    console.log('[products.search][query]', {
      parent_account_id: tenantParentAccountId,
      clientIdParam,
      effectiveClientId,
      billingWarehouseId,
      term,
      warehouseFilter: 'warehouse_id.eq.' + billingWarehouseId,
    })

    // Validate UUID inputs (PostgREST does not accept '::uuid' casts in values)
    assertUuid(tenantParentAccountId, 'tenant parent_account_id')
    assertUuid(clientIdParam, 'clientId')
    assertUuid(billingWarehouseId, 'billing warehouse_id')
    assertUuid(effectiveClientId, 'effective client_account_id')

    // Query A: primary tenant model (account_id)
    // NOTE: Match the known-working SQL: filter by warehouse_id only.
    const qA: any = (supabase as any)
      .from('vw_products_master_enriched')
      .select(selectCols)
      .filter('parent_account_id', 'eq', tenantParentAccountId)
      .filter('account_id', 'eq', clientIdParam)
      .filter('warehouse_id', 'eq', billingWarehouseId)
      .limit(1000)

    // Query B: legacy/internal model (client_account_id)
    const qB: any = (supabase as any)
      .from('vw_products_master_enriched')
      .select(selectCols)
      .filter('parent_account_id', 'eq', tenantParentAccountId)
      .filter('client_account_id', 'eq', effectiveClientId)
      .filter('warehouse_id', 'eq', billingWarehouseId)
      .limit(1000)

    const [{ data: dataA, error: errA }, { data: dataB, error: errB }] = await Promise.all([qA, qB])

    if (errA) {
      return NextResponse.json({ error: errA.message }, { status: 500 })
    }
    if (errB) {
      return NextResponse.json({ error: errB.message }, { status: 500 })
    }

    // Merge and de-dup by id
    const mergedMap = new Map<string, any>()
    for (const row of [...(dataA ?? []), ...(dataB ?? [])]) {
      const rid = String((row as any)?.id ?? '')
      if (!rid) continue
      if (!mergedMap.has(rid)) mergedMap.set(rid, row)
    }

    let merged = Array.from(mergedMap.values())

    // Optional term filter in-memory (keeps the DB query simple/reliable)
    if (term.length > 0) {
      const t = term.toLowerCase()
      merged = merged.filter((r: any) => {
        const sku = String(r?.sku ?? '').toLowerCase()
        const desc = String(r?.description ?? '').toLowerCase()
        return sku.includes(t) || desc.includes(t)
      })
    }

    // Enforce limit
    merged = merged.slice(0, 1000)

    console.log('[products.search][result]', {
      countA: Array.isArray(dataA) ? dataA.length : 0,
      countB: Array.isArray(dataB) ? dataB.length : 0,
      count: merged.length,
      sampleA: Array.isArray(dataA) && dataA.length > 0 ? (dataA as any[]).slice(0, 3).map((r) => ({ id: r.id, sku: r.sku })) : [],
      sampleB: Array.isArray(dataB) && dataB.length > 0 ? (dataB as any[]).slice(0, 3).map((r) => ({ id: r.id, sku: r.sku })) : [],
    })

    return NextResponse.json({
      products: merged,
      shipFromKey,
      effectiveClientId,
      tenantParentAccountId,
      clientIdResolvedFrom,
      warehousePublicId,
      billingWarehouseId,
    })
  } catch (e: any) {
    const msg = e?.message || 'Unexpected error'
    const status = typeof msg === 'string' && msg.startsWith('Invalid ') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}