import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendCustomerCredentialsEmail } from '@/lib/emails/sendCustomerCredentialsEmail'

type AuthType = 'local' | 'wms_extensiv'
type RoleType = 'client'

const ALLOWED_ROLES = new Set(['superadmin', 'admin', 'staff-admin'])

function normalizeAuthType(value: unknown): AuthType | null {
  if (value === 'local') return 'local'
  if (value === 'wms_extensiv') return 'wms_extensiv'
  return null
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
    .in('role', ['client', 'staff-client'])
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
    }
  })

  return NextResponse.json({ customers: payload })
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
    },
  })
}
