import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET /api/billing/clients/:id/warehouses
// Returns warehouses for this client with a user-friendly label.
// Backed by: public.b1_v_client_warehouses_options
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  if (!clientId || clientId === 'undefined') {
    return NextResponse.json({ error: 'Missing client id' }, { status: 400 })
  }

  const cookieStore = (await cookies()) as any

  const supabase = createServerClient(
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

  try {
    // Optional: resolve parent_account_id to avoid RLS-related empty results
    const { data: clientRow, error: clientErr } = await supabase
      .from('billing_clients_view')
      .select('parent_account_id')
      .eq('client_account_id', clientId)
      .maybeSingle()

    if (clientErr) {
      console.warn('[billing/clients/:id/warehouses] client lookup error:', clientErr)
    }

    const parentAccountId: string | null = clientRow?.parent_account_id ?? null

    type WarehouseOption = {
      warehouse_id: string
      label: string
      name: string | null
      city: string | null
      state: string | null
      is_default: boolean
    }

    let q = supabase
      .from('b1_v_client_warehouses_options')
      .select('warehouse_id,label,name,city,state,is_default')
      .eq('client_account_id', clientId)

    if (parentAccountId) q = q.eq('parent_account_id', parentAccountId)

    const { data, error } = await q

    if (error) {
      console.error('[billing/clients/:id/warehouses] query error:', error)
      return NextResponse.json({ error: 'Failed to load warehouses' }, { status: 500 })
    }

    const warehouses = (data as WarehouseOption[] | null)
      ?.filter((r) => r?.warehouse_id)
      .map((r) => ({
        id: r.warehouse_id,
        label: r.label ?? r.warehouse_id,
        name: r.name ?? undefined,
        city: r.city ?? undefined,
        state: r.state ?? undefined,
        is_default: !!r.is_default,
      }))
      // Default first, then alphabetical by label
      .sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
        return a.label.localeCompare(b.label)
      })
      ?? []

    return NextResponse.json({ warehouses })
  } catch (e) {
    console.error('[billing/clients/:id/warehouses] unexpected error:', e)
    return NextResponse.json({ error: 'Failed to load warehouses' }, { status: 500 })
  }
}