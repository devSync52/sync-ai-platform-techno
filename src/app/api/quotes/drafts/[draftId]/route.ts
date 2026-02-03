import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function getParentAccountId(user: any) {
  return (
    user?.app_metadata?.parent_account_id ??
    user?.user_metadata?.parent_account_id ??
    user?.app_metadata?.account_id ??
    user?.user_metadata?.account_id ??
    null
  )
}

async function resolveWarehouseIdByZip(
  supabase: any,
  accountId: string,
  zipRaw: any
): Promise<string | null> {
  const zip = String(zipRaw ?? '')
    .trim()
    .slice(0, 5)

  if (!zip) return null

  const { data, error } = await supabase
    .from('warehouses')
    .select('id, is_default, zip_code')
    .eq('account_id', accountId)
    .ilike('zip_code', `${zip}%`)

  if (error) {
    console.error('[drafts] warehouse ZIP lookup failed', error)
    return null
  }

  if (!data || data.length === 0) return null

  const preferred = (data as any[]).find((w) => w.is_default) ?? (data as any[])[0]
  return preferred?.id ? String(preferred.id) : null
}

async function resolveWarehouseIdByZipWithFallback(
  supabase: any,
  parentAccountId: string,
  childAccountId: string,
  zipRaw: any
): Promise<{ id: string | null; parentAccountId: string }> {
  const fromParent = await resolveWarehouseIdByZip(supabase, parentAccountId, zipRaw)
  if (fromParent) return { id: fromParent, parentAccountId }

  const fromChild = await resolveWarehouseIdByZip(supabase, childAccountId, zipRaw)
  return { id: fromChild, parentAccountId }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params

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

  const parentAccountId = getParentAccountId(user)
  if (!parentAccountId) {
    return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
  }

  const { data: draft, error } = await supabase
    .from('saip_quote_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('account_id', parentAccountId) // ajuste aqui se draft for child/parent diferente
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!draft) {
    return NextResponse.json(
      { error: 'Quote not found or access denied (RLS).' },
      { status: 404 }
    )
  }

  return NextResponse.json({ draft })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params

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

  const parentAccountId = getParentAccountId(user)
  if (!parentAccountId) {
    return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
  }

  const body = await req.json()

  // Permitir apenas campos esperados do draft (evita updates arbitrários)
  const patch: any = {}

  if (typeof body.client === 'string') patch.client = body.client

  // JSON-ish fields
  if (body.preferences !== undefined) patch.preferences = body.preferences
  if (body.ship_from !== undefined) patch.ship_from = body.ship_from
  if (body.ship_to !== undefined) patch.ship_to = body.ship_to
  if (body.items !== undefined) patch.items = body.items

  // Optional simple fields often edited in the wizard
  if (typeof body.status === 'string') patch.status = body.status
  if (body.notes !== undefined) patch.notes = body.notes

  // Service selection + simulation outputs
if (body.selected_service !== undefined) patch.selected_service = body.selected_service
if (body.quote_results !== undefined) patch.quote_results = body.quote_results

// Timestamps (optional)
if (body.updated_at !== undefined) patch.updated_at = body.updated_at

  // Auto-resolve ship_from.warehouse_id by ZIP (server-side) when missing
  try {
    if (
      patch.ship_from &&
      typeof patch.ship_from === 'object' &&
      !(patch.ship_from as any).warehouse_id
    ) {
      const zip =
        (patch.ship_from as any)?.address?.zip_code ??
        (patch.ship_from as any)?.zip_code ??
        null

      if (zip) {
        // We may need the draft's account_id (child) to support setups where warehouses are stored on the child.
        const { data: draftRow } = await supabase
          .from('saip_quote_drafts')
          .select('account_id')
          .eq('id', draftId)
          .maybeSingle()

        const childAccountId = String((draftRow as any)?.account_id ?? parentAccountId)

        const resolved = await resolveWarehouseIdByZipWithFallback(
          supabase,
          String(parentAccountId),
          childAccountId,
          zip
        )

        if (resolved.id) {
          patch.ship_from = {
            ...(patch.ship_from as any),
            warehouse_id: resolved.id,
          }
        }
      }
    }
  } catch (e) {
    console.warn('[drafts] warehouse auto-resolution skipped due to error', e)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Garante que só atualiza drafts da conta do user
  const { data, error } = await supabase
    .from('saip_quote_drafts')
    .update(patch)
    .eq('id', draftId)
    .eq('account_id', parentAccountId)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Quote not found or access denied (RLS).' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, draft: data })
}