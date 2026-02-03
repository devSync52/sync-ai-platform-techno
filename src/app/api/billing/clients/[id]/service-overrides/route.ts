import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params
    const url = new URL(req.url)
    const warehouseId = String(url.searchParams.get('warehouseId') ?? '').trim()

    if (!clientId) return NextResponse.json({ error: 'Missing client id' }, { status: 400 })
    if (!warehouseId) return NextResponse.json({ error: 'Missing warehouseId' }, { status: 400 })

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
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In our JWT, tenant/account id lives in user_metadata.account_id (see debug_auth_context)
    const parentAccountId =
      (user as any)?.user_metadata?.account_id ??
      (user as any)?.app_metadata?.account_id ??
      (user as any)?.user_metadata?.parent_account_id ??
      (user as any)?.app_metadata?.parent_account_id

    if (!parentAccountId) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    // The route param may be either:
    // - client account id (accounts.id), OR
    // - billing client id (billing_clients.id)
    // Overrides table expects client_account_id.
    let effectiveClientAccountId: string = String(clientId)
    try {
      const { data: bcRow, error: bcErr } = await (supabase as any)
        .from('billing_clients')
        .select('account_id')
        .eq('id', String(clientId))
        .limit(1)
        .maybeSingle()

      if (bcErr) {
        // ignore; we'll treat clientId as an account id
        console.warn('[billing][service-overrides] failed to resolve billing_clients.id -> account_id:', bcErr)
      }

      if (bcRow?.account_id) {
        effectiveClientAccountId = String(bcRow.account_id)
      }
    } catch (e) {
      console.warn('[billing][service-overrides] client id resolution threw:', e)
    }

    // UI passes the public warehouse id; overrides are stored against the billing warehouse id.
    // Map via public.v_warehouses.
    let billingWarehouseId: string | null = null
    try {
      const { data: whRow, error: whErr } = await (supabase as any)
        .from('v_warehouses')
        .select('billing_warehouse_id')
        .eq('public_warehouse_id', String(warehouseId))
        .eq('account_id', String(parentAccountId))
        .limit(1)
        .maybeSingle()

      if (whErr) {
        // Don't fail hard; fall back below
        console.warn('[billing][service-overrides] failed to map warehouse id via v_warehouses:', whErr)
      }

      billingWarehouseId = whRow?.billing_warehouse_id ? String(whRow.billing_warehouse_id) : null
    } catch (e) {
      console.warn('[billing][service-overrides] warehouse mapping threw:', e)
    }

    const effectiveWarehouseId = billingWarehouseId ?? String(warehouseId)

    const { data, error } = await (supabase as any)
      .from('billing_client_service_overrides')
      .select('service_id, override_rate_cents, active')
      .eq('parent_account_id', String(parentAccountId))
      .eq('client_account_id', String(effectiveClientAccountId))
      .eq('warehouse_id', String(effectiveWarehouseId))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      effective: {
        parentAccountId: String(parentAccountId),
        clientId: String(clientId),
        effectiveClientAccountId: String(effectiveClientAccountId),
        warehousePublicId: String(warehouseId),
        billingWarehouseId: billingWarehouseId,
        effectiveWarehouseId: String(effectiveWarehouseId),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}