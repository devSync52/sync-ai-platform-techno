import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendCustomerCredentialsEmail } from '@/lib/emails/sendCustomerCredentialsEmail'

type AuthType = 'local' | 'wms_extensiv'
type RoleType = 'client'

const ALLOWED_ROLES = new Set(['superadmin', 'admin', 'staff-admin'])

function pick<T = any>(obj: any, keys: string[], fallback: T = null as T): T {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key] as T
  }
  return fallback
}

function deriveCustomerName(primary: any, metadata: any) {
  const first = String(
    pick(metadata, ['FirstName', 'ShippingAddressFirstName', 'BillingAddressFirstName'], '')
  ).trim()
  const last = String(
    pick(metadata, ['LastName', 'ShippingAddressLastName', 'BillingAddressLastName'], '')
  ).trim()
  const full = `${first} ${last}`.trim()
  if (full) return full

  const fromPrimary = String(primary || '').trim()
  if (fromPrimary) return fromPrimary

  const company = String(pick(metadata, ['CompanyName'], '')).trim()
  if (company) return company

  const email = String(pick(metadata, ['CustomerEmail', 'Email'], '')).trim()
  return email || 'Customer'
}

function normalizeAuthType(value: unknown): AuthType | null {
  if (value === 'local') return 'local'
  if (value === 'wms_extensiv') return 'wms_extensiv'
  return null
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function generateSecurePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
  let password = ''
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

async function resolveCallerContext() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 as const }
  }

  const { data: me, error: meError } = await supabaseAdmin
    .from('users')
    .select('id, role, account_id')
    .eq('id', user.id)
    .maybeSingle()

  if (meError || !me) {
    return { error: meError?.message || 'User not found', status: 404 as const }
  }

  if (!ALLOWED_ROLES.has(me.role)) {
    return { error: 'Forbidden', status: 403 as const }
  }

  let accountId = me.account_id

  if (!accountId) {
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('created_by_user_id', user.id)
      .maybeSingle()

    accountId = account?.id ?? null
  }

  if (!accountId) {
    return { error: 'Account not found', status: 404 as const }
  }

  return { userId: user.id, accountId }
}

export async function GET() {
  const context = await resolveCallerContext()
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const { data: customers, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, created_at, last_login_at, has_logged_in')
    .eq('account_id', context.accountId)
    .in('role', ['client', 'staff-client', 'staff-user', 'client-user'])
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const authUsersResult = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authUsersResult.error) {
    return NextResponse.json({ error: authUsersResult.error.message }, { status: 500 })
  }

  const now = Date.now()
  const authById = new Map(authUsersResult.data.users.map((authUser) => [authUser.id, authUser]))

  const payload = (customers ?? []).map((customer) => {
    const authUser = authById.get(customer.id)
    const userMetadata = authUser?.user_metadata ?? {}
    const appMetadata = authUser?.app_metadata ?? {}

    const authType =
      normalizeAuthType(
        userMetadata.customer_auth_type ??
          userMetadata.auth_type ??
          appMetadata.customer_auth_type ??
          appMetadata.auth_type,
      ) ?? 'local'

    const bannedUntil = authUser?.banned_until ? new Date(authUser.banned_until).getTime() : 0

    return {
      ...customer,
      auth_type: authType,
      wms_user_identifier:
        (userMetadata.wms_user_identifier as string | undefined) ??
        (appMetadata.wms_user_identifier as string | undefined) ??
        null,
      status: bannedUntil > now ? 'disabled' : 'active',
      source: 'local',
      origin:
        (userMetadata.customer_source as string | undefined) ??
        (appMetadata.customer_source as string | undefined) ??
        'manual',
    }
  })

  // Merge customers discovered from synced orders so they are visible
  // in the Customers screen even when they are not platform auth users.
  const { data: orderRows, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('client_name, origin, metadata, created_at, order_number')
    .eq('account_id', context.accountId)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (ordersError) {
    console.error('[customers][orders] failed to load orders:', ordersError)
    return NextResponse.json({ customers: payload })
  }

  const existingEmails = new Set(
    payload
      .map((row: any) => String(row?.email || '').trim().toLowerCase())
      .filter((email: string) => email.length > 0)
  )

  const seenKeys = new Set<string>()
  const discoveredRows: any[] = []

  for (const row of orderRows || []) {
    const metadata = (row as any)?.metadata || {}
    const customerName = deriveCustomerName((row as any)?.client_name, metadata)

    const email = String(metadata?.CustomerEmail || '').trim().toLowerCase()
    const wmsId = String(metadata?.CustomerID || metadata?.customer_id || '').trim()
    const source = String((row as any)?.origin || 'orders').trim().toLowerCase() || 'orders'
    const dedupeKey = wmsId || email || `${source}:${customerName.toLowerCase()}`
    if (!dedupeKey || seenKeys.has(dedupeKey)) continue
    seenKeys.add(dedupeKey)

    if (email && existingEmails.has(email)) {
      continue
    }

    discoveredRows.push({
      id: `ord-${wmsId || email || String((row as any)?.order_number || dedupeKey)}`,
      name: customerName,
      email: email || '-',
      role: 'client',
      created_at: (row as any)?.created_at ?? null,
      last_login_at: null,
      has_logged_in: null,
      auth_type: 'wms_extensiv',
      wms_user_identifier: wmsId || null,
      status: 'active',
      source,
      origin: source,
    })
  }

  return NextResponse.json({ customers: [...payload, ...discoveredRows] })
}

export async function POST(req: NextRequest) {
  const context = await resolveCallerContext()
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  let body: {
    name?: string
    email?: string
    role?: RoleType
    authType?: AuthType
    temporaryPassword?: string
    wmsUserIdentifier?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const role: RoleType = body.role === 'client' ? 'client' : 'client'
  const authType = normalizeAuthType(body.authType)
  const temporaryPassword = (body.temporaryPassword ?? '').trim()
  const wmsUserIdentifier = (body.wmsUserIdentifier ?? '').trim()

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  if (!authType) {
    return NextResponse.json({ error: 'Authentication type is required' }, { status: 400 })
  }

  if (authType === 'local' && temporaryPassword.length < 8) {
    return NextResponse.json(
      { error: 'Temporary Password must be at least 8 characters for Local auth' },
      { status: 400 },
    )
  }

  if (authType === 'wms_extensiv' && !wmsUserIdentifier) {
    return NextResponse.json({ error: 'WMS User Identifier is required for WMS auth' }, { status: 400 })
  }

  const passwordForLogin = authType === 'local' ? temporaryPassword : generateSecurePassword(12)

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: passwordForLogin,
    email_confirm: true,
    user_metadata: {
      name,
      account_id: context.accountId,
      customer_auth_type: authType,
      wms_user_identifier: authType === 'wms_extensiv' ? wmsUserIdentifier : null,
      customer_source: 'manual',
    },
    app_metadata: {
      role,
    },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 500 })
  }

  const newUserId = authData.user.id

  const { data: userRow, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      id: newUserId,
      name,
      email,
      role,
      account_id: context.accountId,
      created_by_user_id: context.userId,
    })
    .select('id, name, email, role, created_at, last_login_at, has_logged_in')
    .single()

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  let emailWarning: string | null = null
  try {
    await sendCustomerCredentialsEmail({
      to: email,
      customerName: name,
      authType,
      password: passwordForLogin,
      wmsUserIdentifier: authType === 'wms_extensiv' ? wmsUserIdentifier : null,
    })
  } catch (error) {
    console.error('[customers][create] failed to send credentials email:', error)
    const message = error instanceof Error ? error.message : 'Unknown email delivery error.'
    emailWarning = `User created, but failed to send credentials email: ${message}`
  }

  return NextResponse.json({
    success: true,
    warning: emailWarning,
    customer: {
      ...userRow,
      auth_type: authType,
      wms_user_identifier: authType === 'wms_extensiv' ? wmsUserIdentifier : null,
      status: 'active',
      source: 'local',
      origin: 'manual',
    },
  })
}
