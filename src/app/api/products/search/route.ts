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

function toNum(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
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

    // Prefer DB account context (users -> accounts.parent_account_id) for consistency
    // with billing routes. Metadata can be stale or child-scoped.
    const { data: meRow, error: meErr } = await (supabase as any)
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (meErr || !meRow?.account_id) {
      return NextResponse.json({ error: meErr?.message || 'Missing account context' }, { status: 403 })
    }

    const { data: accountRow } = await (supabase as any)
      .from('accounts')
      .select('parent_account_id')
      .eq('id', String(meRow.account_id))
      .maybeSingle()

    const callerAccountId = String((accountRow as any)?.parent_account_id ?? meRow.account_id)
    const callerRole = String((meRow as any)?.role ?? (getAccountContextFromUser(user).role ?? '')).trim() || null

    const url = new URL(req.url)
    const clientIdParam = String(url.searchParams.get('clientId') ?? '').trim()
    const warehousePublicId = String(url.searchParams.get('warehouseId') ?? '').trim()
    const shipFromName = String(url.searchParams.get('shipFromName') ?? '').trim()
    const term = String(url.searchParams.get('term') ?? '').trim()
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const pageSizeRaw = Math.max(1, Number(url.searchParams.get('pageSize') ?? 10) || 10)
    const pageSize = Math.min(pageSizeRaw, 50)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

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
    let clientIdResolvedFrom: 'client_account_id' | 'account_id' | 'user_id' | 'unknown' = 'unknown'

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

    if (clientIdResolvedFrom === 'unknown') {
      // As a fallback, treat clientId as a user/customer id and resolve account_id.
      const { data: userRow, error: userErr } = await (supabase as any)
        .from('users')
        .select('account_id')
        .eq('id', clientIdParam)
        .maybeSingle()

      if (userErr) {
        return NextResponse.json({ error: userErr.message }, { status: 500 })
      }

      if (userRow?.account_id) {
        effectiveClientId = String((userRow as any).account_id)
        clientIdResolvedFrom = 'user_id'
      }
    }

    if (!effectiveClientId) {
      return NextResponse.json({ error: 'Unable to resolve client context' }, { status: 400 })
    }

    const ok = await canAccessClientAccount(supabase, callerAccountId, callerRole, effectiveClientId)
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Map public warehouse id (draft) -> billing warehouse id (used by vw_products_master_enriched).
    // Some flows already pass the billing warehouse id directly, so we support both.
    const { data: whMap, error: whMapErr } = await (supabase as any)
      .from('v_warehouses')
      .select('public_warehouse_id, billing_warehouse_id, account_id, name')
      .eq('public_warehouse_id', warehousePublicId)
      .maybeSingle()

    if (whMapErr) {
      return NextResponse.json({ error: whMapErr.message }, { status: 500 })
    }

    let billingWarehouseId = String((whMap as any)?.billing_warehouse_id ?? '').trim()
    let warehouseName = String((whMap as any)?.name ?? '').trim()
    let whOwnerAccountId = String((whMap as any)?.account_id ?? '').trim()

    if (!billingWarehouseId) {
      // Fallback: request may already contain billing warehouse id.
      const { data: whBillingRow, error: whBillingErr } = await (supabase as any)
        .from('v_billing_warehouses')
        .select('id, name, parent_account_id')
        .eq('id', warehousePublicId)
        .maybeSingle()

      if (whBillingErr) {
        return NextResponse.json({ error: whBillingErr.message }, { status: 500 })
      }

      billingWarehouseId = String((whBillingRow as any)?.id ?? '').trim()
      warehouseName = String((whBillingRow as any)?.name ?? '').trim()
      whOwnerAccountId = String((whBillingRow as any)?.parent_account_id ?? '').trim()
    }

    if (!billingWarehouseId) {
      return NextResponse.json({ error: 'Warehouse mapping not found', warehousePublicId }, { status: 400 })
    }

    if (whOwnerAccountId && whOwnerAccountId !== callerAccountId && whOwnerAccountId !== effectiveClientId) {
      return NextResponse.json({ error: 'Invalid warehouse for tenant' }, { status: 400 })
    }

    const { data: integrations, error: integrationsErr } = await (supabase as any)
      .from('account_integrations')
      .select('type,status')
      .eq('account_id', callerAccountId)

    if (integrationsErr) {
      return NextResponse.json({ error: integrationsErr.message }, { status: 500 })
    }

    const integrationTypes = new Set(
      (integrations ?? [])
        .filter((row: any) => String(row?.status ?? '').trim().toLowerCase() === 'active')
        .map((row: any) => String(row?.type ?? '').trim().toLowerCase())
        .filter(Boolean)
    )
    const hasSellercloud = integrationTypes.has('sellercloud')
    const hasExtensiv = integrationTypes.has('extensiv')

    // If Extensiv is active, prefer ext. products table directly
    if (hasExtensiv) {
      let extQuery = (supabase as any)
        .from('extensiv_products_n')
        .select(
          'id, sku, description, pkg_weight_lb, pkg_length_in, pkg_width_in, pkg_height_in, quantity_available, available, on_hold, warehouse_name, parent_account_id, client_account_id',
          { count: 'exact' }
        )
        .or(`parent_account_id.eq.${callerAccountId},client_account_id.eq.${effectiveClientId}`)
        .range(from, to)

      if (term.length > 0) {
        extQuery = extQuery.or(`sku.ilike.%${term}%,description.ilike.%${term}%`)
      }

      const { data: extData, error: extErr, count: extCount } = await extQuery
      if (extErr) {
        return NextResponse.json({ error: extErr.message }, { status: 500 })
      }

      const products = extData ?? []
      const totalCount = extCount ?? (extData ?? []).length

      return NextResponse.json({
        products,
        pagination: {
          page,
          pageSize,
          total: totalCount,
          totalPages: Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
        },
      })
    }

    const candidateWarehouseIds = [billingWarehouseId]

    let query = (supabase as any)
      .from('vw_products_master_enriched')
      .select(
        'id, sku, description, pkg_weight_lb, pkg_length_in, pkg_width_in, pkg_height_in, available, on_hand, allocated, warehouse_id, inventory_warehouse_id, parent_account_id, account_id, client_account_id',
        { count: 'exact' }
      )
      .eq('client_account_id', effectiveClientId)
      .eq('parent_account_id', callerAccountId)
      .or(
        `warehouse_id.in.(${candidateWarehouseIds.join(',')}),inventory_warehouse_id.in.(${candidateWarehouseIds.join(',')})`
      )
      .range(from, to)

    if (term.length > 0) {
      query = query.or(`sku.ilike.%${term}%,description.ilike.%${term}%`)
    }

    const { data, error, count } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Primary result set
    let products = data ?? []
    let totalCount = count ?? products.length

    // Fallback: Billing products synced from Sellercloud now live in public.products.
    // If enriched view has no rows for this context, search in products table.
    if (products.length === 0 && hasSellercloud) {
      let scQuery = (supabase as any)
        .from('sellercloud_products')
        .select(
          'id, sku, description, warehouse_name, quantity_available, quantity_physical, site_price, price, weight, shipping_weight, package_weight_lbs, account_id',
          { count: 'exact' }
        )
        .eq('account_id', callerAccountId)
        .range(from, to)

      if (term.length > 0) {
        scQuery = scQuery.or(`sku.ilike.%${term}%,description.ilike.%${term}%`)
      }

      if (warehouseName) {
        scQuery = scQuery.ilike('warehouse_name', `%${warehouseName}%`)
      }

      const { data: scData, error: scErr, count: scCount } = await scQuery
      if (scErr) {
        return NextResponse.json({ error: scErr.message }, { status: 500 })
      }

      if ((scData ?? []).length > 0) {
        totalCount = scCount ?? (scData ?? []).length
        products = (scData ?? []).map((row: any) => {
          const weight =
            toNum(row?.package_weight_lbs) ??
            toNum(row?.shipping_weight) ??
            toNum(row?.weight)

          return {
            id: row.id,
            sku: row.sku,
            description: row.description ?? null,
            price: toNum(row?.site_price) ?? toNum(row?.price) ?? 0,
            pkg_weight_lb: weight,
            pkg_length_in: null,
            pkg_width_in: null,
            pkg_height_in: null,
            available: toNum(row?.quantity_available) ?? 0,
            on_hand: toNum(row?.quantity_physical),
            allocated: null,
            warehouse_id: billingWarehouseId,
            inventory_warehouse_id: billingWarehouseId,
            parent_account_id: callerAccountId,
            account_id: effectiveClientId,
            client_account_id: effectiveClientId,
            source: 'sellercloud',
            warehouse_name: row.warehouse_name ?? warehouseName ?? null,
          }
        })
      }
    }

    if (products.length === 0) {
      let pQuery = (supabase as any)
        .from('products')
        .select(
          'id, sku, product_name, description, site_price, available, physical_qty, on_hold, warehouse_name, raw, parent_account_id, source',
          { count: 'exact' }
        )
        .eq('parent_account_id', callerAccountId)
        .range(from, to)

      if (term.length > 0) {
        pQuery = pQuery.or(`sku.ilike.%${term}%,description.ilike.%${term}%,product_name.ilike.%${term}%`)
      }

      if (warehouseName) {
        pQuery = pQuery.ilike('warehouse_name', `%${warehouseName}%`)
      }

      let { data: pData, error: pErr, count: pCount } = await pQuery
      if (pErr) {
        return NextResponse.json({ error: pErr.message }, { status: 500 })
      }

      // If strict warehouse-name filter yields nothing, retry without it.
      if ((pData ?? []).length === 0) {
        let retryQuery = (supabase as any)
          .from('products')
          .select(
            'id, sku, product_name, description, site_price, available, physical_qty, on_hold, warehouse_name, raw, parent_account_id, source',
            { count: 'exact' }
          )
          .eq('parent_account_id', callerAccountId)
          .range(from, to)

        if (term.length > 0) {
          retryQuery = retryQuery.or(`sku.ilike.%${term}%,description.ilike.%${term}%,product_name.ilike.%${term}%`)
        }

        const retryRes = await retryQuery
        pData = retryRes.data
        pErr = retryRes.error
        pCount = retryRes.count
        if (pErr) {
          return NextResponse.json({ error: pErr.message }, { status: 500 })
        }
      }

      totalCount = pCount ?? (pData ?? []).length
      products = (pData ?? []).map((row: any) => {
        const raw = row?.raw && typeof row.raw === 'object' ? row.raw : {}
        const available =
          toNum(row?.available) ??
          toNum(row?.physical_qty) ??
          toNum((raw as any)?.InventoryAvailableQty) ??
          toNum((raw as any)?.AggregatedQty) ??
          toNum((raw as any)?.AggregateQty) ??
          toNum((raw as any)?.AggregatePhysicalQty) ??
          0

        const onHand =
          toNum(row?.physical_qty) ??
          toNum((raw as any)?.PhysicalQty) ??
          toNum((raw as any)?.WarehousePhysicalQty) ??
          null

        const allocated =
          toNum(row?.on_hold) ??
          toNum((raw as any)?.ReservedQty) ??
          toNum((raw as any)?.ReserveQtyTotalValue) ??
          null

        return {
          id: row.id,
          sku: row.sku,
          description: row.description ?? row.product_name ?? null,
          price:
            toNum(row?.site_price) ??
            toNum((raw as any)?.SitePrice) ??
            toNum((raw as any)?.StorePrice) ??
            toNum((raw as any)?.SalePrice) ??
            toNum((raw as any)?.ListPrice) ??
            0,
          pkg_weight_lb: toNum((raw as any)?.PackageWeightLbs) ?? toNum((raw as any)?.WeightLbs) ?? toNum((raw as any)?.Weight),
          pkg_length_in: toNum((raw as any)?.PackageLength) ?? null,
          pkg_width_in: toNum((raw as any)?.PackageWidth) ?? null,
          pkg_height_in: toNum((raw as any)?.PackageHeight) ?? null,
          available,
          on_hand: onHand,
          allocated,
          warehouse_id: billingWarehouseId,
          inventory_warehouse_id: billingWarehouseId,
          parent_account_id: callerAccountId,
          account_id: effectiveClientId,
          client_account_id: effectiveClientId,
          source: row.source ?? 'sellercloud',
        }
      })
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
      },
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
