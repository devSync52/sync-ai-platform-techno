// /src/app/api/billing/warehouses/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Helper para SR (sem depender de outro arquivo)
function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

function getAnonClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

const shapeWarehouse = (w: any) => ({
  id: w.id,
  name: w.name,
  city: w.city,
  state: w.state,
  is_default: w.is_default,
  parent_account_id: w.parent_account_id,
  source: w.source,
  wms_facility_id: w.wms_facility_id,
  is_active: w.is_active,
})

type UserContext =
  | { ok: true; accountId: string }
  | { ok: false; status: number; message: string }

async function resolveAccountContext(request: Request): Promise<UserContext> {
  // 1) Cliente “user” para identificar o usuário atual
  const userClient = createRouteHandlerClient({ cookies })
  const { data: authData, error: authErr } = await userClient.auth.getUser()
  let activeClient = userClient
  let userId = authData?.user?.id ?? null

  if ((!authData?.user || authErr) && !userId) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null

    if (token) {
      const anonClient = getAnonClient(token)
      const { data: tokenData, error: tokenError } = await anonClient.auth.getUser()
      if (!tokenError && tokenData?.user) {
        activeClient = anonClient
        userId = tokenData.user.id
      }
    }
  }

  if (!userId) {
    return { ok: false, status: 401, message: 'Not authenticated' }
  }

  // 2) Descobrir o parent_account_id do usuário (public.users)
  const { data: me, error: meErr } = await activeClient
    .from('users')
    .select('account_id')
    .eq('id', userId)
    .maybeSingle()

  if (meErr || !me?.account_id) {
    return {
      ok: false,
      status: 400,
      message: meErr?.message ?? 'User account not found',
    }
  }

  return { ok: true, accountId: me.account_id }
}

export async function GET(request: Request) {
  const context = await resolveAccountContext(request)
  if (!context.ok) {
    return NextResponse.json({ error: context.message }, { status: context.status })
  }

  // 3) Service Role para ler a view pública e filtrar por parent_account_id
  const sr = getServiceRoleClient()
  const { data, error } = await sr
    .from('v_billing_warehouses')
    .select('*')
    .eq('parent_account_id', context.accountId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // 4) Retorne apenas os campos usados pela sua UI (ou tudo)
  const shaped = (data ?? []).map(shapeWarehouse)

  return NextResponse.json({ data: shaped })
}

export async function POST(request: Request) {
  const context = await resolveAccountContext(request)
  if (!context.ok) {
    return NextResponse.json({ error: context.message }, { status: context.status })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const action = payload?.action
  if (!action || typeof action !== 'string') {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 })
  }

  const sr = getServiceRoleClient()
  const accountId = context.accountId

  if (action === 'setDefault') {
    const warehouseId = payload?.warehouse_id
    if (!warehouseId || typeof warehouseId !== 'string') {
      return NextResponse.json({ error: 'Missing warehouse_id' }, { status: 400 })
    }

    const { data: targetWarehouse, error: fetchErr } = await sr
      .from('v_billing_warehouses')
      .select('*')
      .eq('parent_account_id', accountId)
      .eq('id', warehouseId)
      .maybeSingle()

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 400 })
    }
    if (!targetWarehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    const { error: clearErr } = await sr
      .from('billing.warehouses')
      .update({ is_default: false })
      .eq('parent_account_id', accountId)

    if (clearErr) {
      return NextResponse.json({ error: clearErr.message }, { status: 400 })
    }

    const { error: setErr } = await sr
      .from('billing.warehouses')
      .update({ is_default: true })
      .eq('id', warehouseId)
      .eq('parent_account_id', accountId)

    if (setErr) {
      return NextResponse.json({ error: setErr.message }, { status: 400 })
    }

    const { data: refreshed, error: refreshErr } = await sr
      .from('v_billing_warehouses')
      .select('*')
      .eq('parent_account_id', accountId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (refreshErr) {
      return NextResponse.json({ error: refreshErr.message }, { status: 400 })
    }

    return NextResponse.json({ data: (refreshed ?? []).map(shapeWarehouse) })
  }

  if (action === 'create') {
    const name = String(payload?.name ?? '').trim()
    const city = String(payload?.city ?? '').trim()
    const state = String(payload?.state ?? '').trim()
    const isDefault = Boolean(payload?.is_default)
    const customId = payload?.id ? String(payload.id).trim() : null

    if (!name || !city || !state) {
      return NextResponse.json(
        { error: 'Name, city, and state are required' },
        { status: 400 }
      )
    }

    const insertPayload: Record<string, any> = {
      parent_account_id: accountId,
      name,
      city,
      state,
      is_active: true,
      is_default: isDefault,
      source: payload?.source ?? 'manual',
      wms_facility_id: payload?.wms_facility_id ?? null,
    }

    if (customId) insertPayload.id = customId

    const { data: inserted, error: insertErr } = await sr
      .from('billing.warehouses')
      .insert(insertPayload)
      .select('*')
      .maybeSingle()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 400 })
    }

    const createdId = (inserted?.id ?? customId) as string | null
    if (!createdId) {
      return NextResponse.json({ error: 'Warehouse identifier not returned' }, { status: 500 })
    }

    if (isDefault && createdId) {
      const { error: clearErr } = await sr
        .from('billing.warehouses')
        .update({ is_default: false })
        .eq('parent_account_id', accountId)
        .neq('id', createdId)

      if (clearErr) {
        return NextResponse.json({ error: clearErr.message }, { status: 400 })
      }
    }

    const { data: refreshed, error: refreshErr } = await sr
      .from('v_billing_warehouses')
      .select('*')
      .eq('parent_account_id', accountId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (refreshErr) {
      return NextResponse.json({ error: refreshErr.message }, { status: 400 })
    }

    return NextResponse.json({ data: (refreshed ?? []).map(shapeWarehouse) })
  }

  return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 })
}
