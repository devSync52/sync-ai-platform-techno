import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type AuthType = 'local' | 'wms_extensiv'

const ALLOWED_CALLER_ROLES = new Set(['superadmin', 'admin', 'staff-admin'])
const ALLOWED_TARGET_ROLES = new Set(['client', 'staff-client'])

function normalizeAuthType(value: unknown): AuthType | null {
  if (value === 'local') return 'local'
  if (value === 'wms_extensiv') return 'wms_extensiv'
  return null
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

  if (!ALLOWED_CALLER_ROLES.has(me.role)) {
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

async function resolveTargetCustomer(userId: string, accountId: string) {
  const { data: target, error } = await supabaseAdmin
    .from('users')
    .select('id, role, account_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { error: error.message, status: 500 as const }
  }

  if (!target || target.account_id !== accountId || !ALLOWED_TARGET_ROLES.has(target.role)) {
    return { error: 'Customer user not found', status: 404 as const }
  }

  return { target }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const context = await resolveCallerContext()
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const { userId } = await params
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const targetResult = await resolveTargetCustomer(userId, context.accountId)
  if ('error' in targetResult) {
    return NextResponse.json({ error: targetResult.error }, { status: targetResult.status })
  }

  let body: {
    name?: string
    email?: string
    role?: 'client'
    authType?: AuthType
    temporaryPassword?: string
    wmsUserIdentifier?: string
    status?: 'active' | 'disabled'
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const role = body.role === 'client' ? 'client' : 'client'
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

  if (authType === 'local' && temporaryPassword && temporaryPassword.length < 8) {
    return NextResponse.json(
      { error: 'Temporary Password must be at least 8 characters for Local auth' },
      { status: 400 },
    )
  }

  if (authType === 'wms_extensiv' && !wmsUserIdentifier) {
    return NextResponse.json({ error: 'WMS User Identifier is required for WMS auth' }, { status: 400 })
  }

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      name,
      email,
      role,
    })
    .eq('id', userId)
    .select('id, name, email, role, created_at, last_login_at, has_logged_in')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const authUpdatePayload: {
    email?: string
    password?: string
    app_metadata?: Record<string, string>
    user_metadata?: Record<string, string | null>
    ban_duration?: string
  } = {
    email,
    app_metadata: { role },
    user_metadata: {
      name,
      account_id: context.accountId,
      customer_auth_type: authType,
      wms_user_identifier: authType === 'wms_extensiv' ? wmsUserIdentifier : null,
    },
  }

  if (authType === 'local' && temporaryPassword) {
    authUpdatePayload.password = temporaryPassword
  }

  if (body.status === 'disabled') {
    authUpdatePayload.ban_duration = '876000h'
  } else if (body.status === 'active') {
    authUpdatePayload.ban_duration = 'none'
  }

  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    authUpdatePayload,
  )

  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    customer: {
      ...updatedUser,
      auth_type: authType,
      wms_user_identifier: authType === 'wms_extensiv' ? wmsUserIdentifier : null,
      status: body.status ?? 'active',
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const context = await resolveCallerContext()
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const { userId } = await params
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const targetResult = await resolveTargetCustomer(userId, context.accountId)
  if ('error' in targetResult) {
    return NextResponse.json({ error: targetResult.error }, { status: targetResult.status })
  }

  await supabaseAdmin.from('user_details').delete().eq('id', userId)

  const { error: publicDeleteError } = await supabaseAdmin.from('users').delete().eq('id', userId)
  if (publicDeleteError) {
    return NextResponse.json({ error: publicDeleteError.message }, { status: 500 })
  }

  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
