import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

type UpsCredentials = {
  account_number: string
  client_id: string
  client_secret: string
}

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

function parseCredentialsFromBody(raw: unknown): UpsCredentials | null {
  if (!raw || typeof raw !== 'object') return null

  const creds: UpsCredentials = {
    account_number: String((raw as any).account_number ?? '').trim(),
    client_id: String((raw as any).client_id ?? '').trim(),
    client_secret: String((raw as any).client_secret ?? '').trim(),
  }

  if (!creds.account_number || !creds.client_id || !creds.client_secret) return null
  return creds
}

async function testUpsToken(credentials: UpsCredentials) {
  const oauthUrl = process.env.UPS_OAUTH_URL || 'https://wwwcie.ups.com/security/v1/oauth/token'

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  })

  const response = await fetch(oauthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64')}`,
    },
    body: body.toString(),
  })

  const text = await response.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (response.ok && json?.access_token) {
    return { ok: true as const, expiresIn: json.expires_in ?? null, scope: json.scope ?? null }
  }

  const message = json?.error_description || json?.error || json?.message || text || 'UPS token request failed'
  return { ok: false as const, error: String(message) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const action = String(body?.action ?? '').toLowerCase()

    if (action !== 'test_credentials') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const cookieStore = (await cookies()) as any
    const authClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: getCookieHandlers(cookieStore) },
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

    const inputCredentials = parseCredentialsFromBody(body?.credentials)
    if (!inputCredentials) {
      return NextResponse.json(
        { error: 'Account number, Client ID and Client Secret are required' },
        { status: 400 },
      )
    }

    const tested = await testUpsToken(inputCredentials)
    if (!tested.ok) {
      return NextResponse.json({ success: false, error: tested.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      token: {
        expires_in: tested.expiresIn,
        scope: tested.scope,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected server error' }, { status: 500 })
  }
}
