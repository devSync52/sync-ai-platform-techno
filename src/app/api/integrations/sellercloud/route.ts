import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import AES from 'crypto-js/aes'
import Utf8 from 'crypto-js/enc-utf8'
import type { Database } from '@/types/supabase'

type SellercloudAction = 'connect' | 'disconnect' | 'retry' | 'test' | 'test_credentials'

type SellercloudCredentials = {
  domain: string
  username: string
  password: string
}

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || 'SYNC_SECRET'

function getCookieHandlers(cookieStore: any) {
  return {
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
  }
}

function normalizeDomain(domain: string): string {
  const trimmed = String(domain || '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '')
  return `https://${trimmed.replace(/\/+$/, '')}`
}

function parseCredentials(raw: unknown): SellercloudCredentials | null {
  if (!raw) return null

  let parsed: any = raw

  if (typeof raw === 'string') {
    try {
      const decrypted = AES.decrypt(raw, ENCRYPTION_KEY).toString(Utf8)
      parsed = JSON.parse(decrypted)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== 'object') return null

  const creds: SellercloudCredentials = {
    domain: String((parsed as any).domain ?? '').trim(),
    username: String((parsed as any).username ?? '').trim(),
    password: String((parsed as any).password ?? '').trim(),
  }

  if (!creds.domain || !creds.username || !creds.password) return null
  return creds
}

function parseCredentialsFromBody(raw: unknown): SellercloudCredentials | null {
  if (!raw || typeof raw !== 'object') return null

  const creds: SellercloudCredentials = {
    domain: String((raw as any).domain ?? '').trim(),
    username: String((raw as any).username ?? '').trim(),
    password: String((raw as any).password ?? '').trim(),
  }

  if (!creds.domain || !creds.username || !creds.password) return null
  return creds
}

async function testSellercloudToken(credentials: SellercloudCredentials) {
  const baseUrl = normalizeDomain(credentials.domain)
  if (!baseUrl) {
    return { ok: false as const, error: 'Missing Sellercloud domain' }
  }

  const response = await fetch(`${baseUrl}/rest/api/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Username: credentials.username,
      Password: credentials.password,
    }),
  })

  const text = await response.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Sellercloud request failed with ${response.status}`
    return { ok: false as const, error: String(message) }
  }

  if (!data?.access_token) {
    return { ok: false as const, error: 'Sellercloud token response did not include access_token' }
  }

  return {
    ok: true as const,
    tokenType: data?.token_type ?? null,
    issued: data?.issued ?? null,
    expires: data?.expires ?? null,
  }
}

function mergeMetadata(existing: unknown, patch: Record<string, unknown>) {
  const base = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {}
  return { ...(base as Record<string, unknown>), ...patch }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const action = String(body?.action ?? '').toLowerCase() as SellercloudAction

    if (!['connect', 'disconnect', 'retry', 'test', 'test_credentials'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const cookieStore = (await cookies()) as any
    const authClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: getCookieHandlers(cookieStore) }
    )

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRow, error: userRowError } = await authClient
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .maybeSingle()

    if (userRowError || !userRow?.account_id) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    const accountId = String(userRow.account_id)
    const requestedAccountId = String(body?.accountId ?? '').trim()

    if (requestedAccountId && requestedAccountId !== accountId) {
      return NextResponse.json({ error: 'Forbidden account scope' }, { status: 403 })
    }

    if (action === 'test_credentials') {
      const inputCredentials = parseCredentialsFromBody(body?.credentials)
      if (!inputCredentials) {
        return NextResponse.json(
          { error: 'Domain, username and password are required' },
          { status: 400 }
        )
      }

      const testedInput = await testSellercloudToken(inputCredentials)
      if (!testedInput.ok) {
        return NextResponse.json({ success: false, error: testedInput.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        token: {
          type: testedInput.tokenType,
          issued: testedInput.issued,
          expires: testedInput.expires,
        },
      })
    }

    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    if (action === 'disconnect') {
      const now = new Date().toISOString()
      const { error: disconnectError } = await admin
        .from('account_integrations')
        .update({
          status: 'inactive',
          metadata: { disconnected_at: now, last_action: 'disconnect' },
        })
        .eq('account_id', accountId)
        .eq('type', 'sellercloud')

      if (disconnectError) {
        return NextResponse.json(
          { error: 'Failed to disconnect Sellercloud', details: disconnectError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, status: 'inactive' })
    }

    const { data: integration, error: integrationError } = await admin
      .from('account_integrations')
      .select('credentials, metadata, status')
      .eq('account_id', accountId)
      .eq('type', 'sellercloud')
      .maybeSingle()

    if (integrationError) {
      return NextResponse.json(
        { error: 'Failed to load Sellercloud integration', details: integrationError.message },
        { status: 500 }
      )
    }

    if (!integration) {
      return NextResponse.json({ error: 'Sellercloud integration is not configured' }, { status: 404 })
    }

    const credentials = parseCredentials(integration.credentials)
    if (!credentials) {
      return NextResponse.json(
        { error: 'Invalid Sellercloud credentials. Open Configure and save valid values.' },
        { status: 400 }
      )
    }

    const tested = await testSellercloudToken(credentials)
    const now = new Date().toISOString()

    if (!tested.ok) {
      const failedStatus = action === 'test' ? integration.status ?? 'inactive' : 'error'
      const { error: failedUpdateError } = await admin
        .from('account_integrations')
        .update({
          status: failedStatus,
          metadata: mergeMetadata(integration.metadata, {
            last_action: action,
            last_error: tested.error,
            last_tested_at: now,
          }),
        })
        .eq('account_id', accountId)
        .eq('type', 'sellercloud')

      if (failedUpdateError) {
        return NextResponse.json(
          { error: 'Sellercloud test failed and status update failed', details: failedUpdateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: false, status: failedStatus, error: tested.error }, { status: 400 })
    }

    const { error: successUpdateError } = await admin
      .from('account_integrations')
      .update({
        status: 'active',
        last_synced_at: now,
        metadata: mergeMetadata(integration.metadata, {
          last_action: action,
          last_error: null,
          last_tested_at: now,
          token_type: tested.tokenType,
          token_issued: tested.issued,
          token_expires: tested.expires,
        }),
      })
      .eq('account_id', accountId)
      .eq('type', 'sellercloud')

    if (successUpdateError) {
      return NextResponse.json(
        { error: 'Sellercloud connected but status update failed', details: successUpdateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: 'active',
      token: {
        type: tested.tokenType,
        issued: tested.issued,
        expires: tested.expires,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected server error' }, { status: 500 })
  }
}
